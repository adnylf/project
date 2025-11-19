import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import mentorService from '@/services/mentor.service';
import { paginatedResponse, errorResponse } from '@/utils/response.util';
import { validatePagination } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';
import type { Prisma, EnrollmentStatus } from '@prisma/client';

/**
 * GET /api/mentors/students
 * Get all students enrolled in mentor's courses
 */
async function handler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Get mentor profile
    const mentor = await mentorService.getMentorByUserId(user.userId);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as EnrollmentStatus | undefined;
    const courseId = searchParams.get('courseId') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Build where clause
    const where: Prisma.EnrollmentWhereInput = {
      course: {
        mentorId: mentor.id,
      },
    };

    if (status) {
      where.status = status;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Calculate skip
    const skip = (validatedPagination.page - 1) * validatedPagination.limit;

    // Get enrollments
    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: validatedPagination.limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          status: true,
          progress: true,
          completedAt: true,
          lastAccessedAt: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
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
    ]);

    return paginatedResponse(
      enrollments,
      {
        page: validatedPagination.page,
        limit: validatedPagination.limit,
        total,
      },
      'Students retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get students', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request);
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(authenticatedHandler)));
