import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS, USER_ROLES } from '@/lib/constants';

async function handler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user || user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

    const [totalCourses, totalMentors, avgRating, mostPopularCategory] = await Promise.all([
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.mentorProfile.count({ where: { status: 'APPROVED' } }),
      prisma.course.aggregate({
        where: { status: 'PUBLISHED' },
        _avg: { averageRating: true },
      }),
      prisma.course.groupBy({
        by: ['categoryId'],
        where: { status: 'PUBLISHED' },
        _count: { categoryId: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: 1,
      }),
    ]);

    const categoryId = mostPopularCategory[0]?.categoryId;
    const category = categoryId
      ? await prisma.category.findUnique({ where: { id: categoryId }, select: { name: true } })
      : null;

    return successResponse(
      {
        overview: {
          totalPublishedCourses: totalCourses,
          totalActiveMentors: totalMentors,
          averageCourseRating: Math.round((avgRating._avg.averageRating || 0) * 10) / 10,
          mostPopularCategory: category?.name || 'Unknown',
        },
        message: 'Full analytics require search logging implementation',
      },
      'Search analytics retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get analytics', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function authenticatedHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request);
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(authenticatedHandler)));
