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
import type { Prisma, CourseStatus } from '@prisma/client';

/**
 * GET /api/mentors/courses
 * Get all courses created by authenticated mentor
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as CourseStatus | undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Build where clause
    const where: Prisma.CourseWhereInput = {
      mentorId: mentor.id,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate skip
    const skip = (validatedPagination.page - 1) * validatedPagination.limit;

    // Get courses
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: validatedPagination.limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          status: true,
          level: true,
          price: true,
          discountPrice: true,
          isFree: true,
          totalStudents: true,
          averageRating: true,
          totalReviews: true,
          totalViews: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              sections: true,
              enrollments: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return paginatedResponse(
      courses,
      {
        page: validatedPagination.page,
        limit: validatedPagination.limit,
        total,
      },
      'Courses retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get courses', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request);
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(authenticatedHandler)));
