import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

interface CourseData {
  mentorId: string;
  categoryId: string;
  level: string;
}

async function mentorRecommendationsHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    if (user) {
      const userEnrollments = await prisma.enrollment.findMany({
        where: { userId: user.userId },
        select: {
          course: {
            select: {
              mentorId: true,
              categoryId: true,
              level: true,
            },
          },
        },
      });

      const enrolledMentorIds = userEnrollments.map((e) => e.course.mentorId);
      const preferredCategories = [...new Set(userEnrollments.map((e) => e.course.categoryId))];

      const recommendedMentors = await prisma.mentorProfile.findMany({
        where: {
          status: 'APPROVED',
          id: { notIn: enrolledMentorIds },
          courses: {
            some: {
              categoryId: { in: preferredCategories },
              status: 'PUBLISHED',
            },
          },
        },
        take: limit,
        orderBy: [{ averageRating: 'desc' }, { totalStudents: 'desc' }],
        select: {
          id: true,
          bio: true,
          headline: true,
          expertise: true,
          experience: true,
          averageRating: true,
          totalStudents: true,
          totalCourses: true,
          totalReviews: true,
          user: {
            select: {
              name: true,
              profilePicture: true,
            },
          },
          courses: {
            where: { status: 'PUBLISHED' },
            take: 3,
            select: {
              id: true,
              title: true,
              thumbnail: true,
              averageRating: true,
            },
          },
        },
      });

      return successResponse(
        {
          mentors: recommendedMentors,
          reason: 'Based on your enrolled courses',
        },
        'Mentor recommendations retrieved successfully'
      );
    }

    const topMentors = await prisma.mentorProfile.findMany({
      where: {
        status: 'APPROVED',
        totalCourses: { gt: 0 },
      },
      take: limit,
      orderBy: [{ averageRating: 'desc' }, { totalStudents: 'desc' }],
      select: {
        id: true,
        bio: true,
        headline: true,
        expertise: true,
        experience: true,
        averageRating: true,
        totalStudents: true,
        totalCourses: true,
        totalReviews: true,
        user: {
          select: {
            name: true,
            profilePicture: true,
          },
        },
        courses: {
          where: { status: 'PUBLISHED' },
          take: 3,
          select: {
            id: true,
            title: true,
            thumbnail: true,
            averageRating: true,
          },
        },
      },
    });

    return successResponse(
      {
        mentors: topMentors,
        reason: 'Top rated mentors',
      },
      'Mentor recommendations retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get mentor recommendations', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function optionalAuthMentorRecommendationsHandler(request: NextRequest) {
  await authMiddleware(request);
  return mentorRecommendationsHandler(request);
}

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(optionalAuthMentorRecommendationsHandler))
);
