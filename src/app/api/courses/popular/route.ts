import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { paginatedResponse, errorResponse } from '@/utils/response.util';
import { validatePagination } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/courses/popular
 * Get popular courses based on enrollment count
 */
async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const timeRange = searchParams.get('timeRange') || 'all'; // all, week, month

    const validatedPagination = validatePagination(page, limit);
    const skip = (validatedPagination.page - 1) * validatedPagination.limit;

    // Calculate date filter based on time range
    let dateFilter = {};
    if (timeRange === 'week') {
      dateFilter = {
        publishedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      };
    } else if (timeRange === 'month') {
      dateFilter = {
        publishedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      };
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          ...dateFilter,
        },
        skip,
        take: validatedPagination.limit,
        orderBy: [{ totalStudents: 'desc' }, { averageRating: 'desc' }, { totalViews: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          shortDescription: true,
          level: true,
          language: true,
          price: true,
          discountPrice: true,
          isFree: true,
          isPremium: true,
          totalStudents: true,
          averageRating: true,
          totalReviews: true,
          totalDuration: true,
          totalLectures: true,
          totalViews: true,
          publishedAt: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          mentor: {
            select: {
              user: {
                select: {
                  name: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      }),
      prisma.course.count({
        where: {
          status: 'PUBLISHED',
          ...dateFilter,
        },
      }),
    ]);

    return paginatedResponse(
      courses,
      {
        page: validatedPagination.page,
        limit: validatedPagination.limit,
        total,
      },
      `Popular courses ${timeRange !== 'all' ? `(${timeRange})` : ''} retrieved successfully`
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get popular courses', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(handler)));
