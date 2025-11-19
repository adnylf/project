import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { paginatedResponse, errorResponse } from '@/utils/response.util';
import { validatePagination } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS, USER_ROLES } from '@/lib/constants';
import type { Prisma, EnrollmentStatus } from '@prisma/client';

async function handler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id: courseId } = await context.params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { mentor: true },
    });

    if (!course) {
      return errorResponse('Course not found', HTTP_STATUS.NOT_FOUND);
    }

    if (user.role !== USER_ROLES.ADMIN && course.mentor.userId !== user.userId) {
      return errorResponse('Only course mentor or admin can view students', HTTP_STATUS.FORBIDDEN);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as EnrollmentStatus | undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const validatedPagination = validatePagination(page, limit);

    const where: Prisma.EnrollmentWhereInput = { courseId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const skip = (validatedPagination.page - 1) * validatedPagination.limit;

    const [enrollments, total, stats] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: validatedPagination.limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          certificate: {
            select: {
              id: true,
              certificateNumber: true,
              issuedAt: true,
            },
          },
          _count: {
            select: {
              progressRecords: true,
            },
          },
        },
      }),
      prisma.enrollment.count({ where }),
      prisma.enrollment.groupBy({
        by: ['status'],
        where: { courseId },
        _count: true,
        _avg: { progress: true },
      }),
    ]);

    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const completedMaterials = await prisma.progress.count({
          where: {
            enrollmentId: enrollment.id,
            isCompleted: true,
          },
        });

        const lastProgress = await prisma.progress.findFirst({
          where: { enrollmentId: enrollment.id },
          orderBy: { updatedAt: 'desc' },
          include: {
            material: {
              select: {
                title: true,
                type: true,
              },
            },
          },
        });

        return {
          ...enrollment,
          completedMaterials,
          lastAccessedMaterial: lastProgress?.material || null,
        };
      })
    );

    const enrollmentStats = {
      total,
      byStatus: Object.fromEntries(
        stats.map((stat) => [
          stat.status,
          { count: stat._count, avgProgress: stat._avg.progress || 0 },
        ])
      ),
    };

    // Fix: Use proper pagination meta type
    const paginationMeta = {
      page: validatedPagination.page,
      limit: validatedPagination.limit,
      total,
    };

    // Add stats to response data instead of meta
    const responseData = enrichedEnrollments.map((e) => ({
      ...e,
      _stats: enrollmentStats,
    }));

    return paginatedResponse(
      enrichedEnrollments,
      paginationMeta,
      'Students retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get students', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function authenticatedHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request, context);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (request: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return authenticatedHandler(rq, context);
      })(r);
    })(request);
  })(req);
}
