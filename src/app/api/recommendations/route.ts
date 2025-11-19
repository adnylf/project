import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

async function recommendationsHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    if (user) {
      // Personalized recommendations for authenticated users
      const [
        // Get user's enrolled courses to find similar ones
        userEnrollments,

        // Get user's wishlist
        userWishlist,

        // Get trending courses
        trendingCourses,
      ] = await Promise.all([
        prisma.enrollment.findMany({
          where: { userId: user.userId },
          select: {
            course: {
              select: {
                categoryId: true,
                tags: true,
                level: true,
              },
            },
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),

        prisma.wishlist.findMany({
          where: { userId: user.userId },
          select: {
            course: {
              select: {
                categoryId: true,
                tags: true,
              },
            },
          },
        }),

        prisma.course.findMany({
          where: {
            status: 'PUBLISHED',
          },
          take: limit,
          orderBy: [{ totalStudents: 'desc' }, { averageRating: 'desc' }],
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            shortDescription: true,
            level: true,
            price: true,
            discountPrice: true,
            isFree: true,
            averageRating: true,
            totalStudents: true,
            totalReviews: true,
            category: {
              select: { name: true, slug: true },
            },
            mentor: {
              select: {
                user: {
                  select: { name: true, profilePicture: true },
                },
              },
            },
          },
        }),
      ]);

      // Extract user preferences
      const userCategories = new Set(
        [...userEnrollments, ...userWishlist].map((e) => e.course.categoryId).filter(Boolean)
      );

      const userTags = new Set([...userEnrollments, ...userWishlist].flatMap((e) => e.course.tags));

      // Get recommended courses based on preferences
      const recommendedCourses = await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { categoryId: { in: Array.from(userCategories) } },
            { tags: { hasSome: Array.from(userTags) } },
          ],
          // Exclude already enrolled courses
          NOT: {
            enrollments: {
              some: { userId: user.userId },
            },
          },
        },
        take: limit,
        orderBy: [{ averageRating: 'desc' }, { totalStudents: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          shortDescription: true,
          level: true,
          price: true,
          discountPrice: true,
          isFree: true,
          averageRating: true,
          totalStudents: true,
          totalReviews: true,
          category: {
            select: { name: true, slug: true },
          },
          mentor: {
            select: {
              user: {
                select: { name: true, profilePicture: true },
              },
            },
          },
        },
      });

      return successResponse(
        {
          personalized: recommendedCourses.length > 0 ? recommendedCourses : trendingCourses,
          trending: trendingCourses,
          reason:
            recommendedCourses.length > 0 ? 'Based on your learning history' : 'Popular courses',
        },
        'Recommendations retrieved successfully'
      );
    }

    // For non-authenticated users, show trending courses
    const trendingCourses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
      },
      take: limit,
      orderBy: [{ totalStudents: 'desc' }, { averageRating: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        shortDescription: true,
        level: true,
        price: true,
        discountPrice: true,
        isFree: true,
        averageRating: true,
        totalStudents: true,
        totalReviews: true,
        category: {
          select: { name: true, slug: true },
        },
        mentor: {
          select: {
            user: {
              select: { name: true, profilePicture: true },
            },
          },
        },
      },
    });

    return successResponse(
      {
        courses: trendingCourses,
        reason: 'Trending courses',
      },
      'Recommendations retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get recommendations', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function optionalAuthRecommendationsHandler(request: NextRequest) {
  await authMiddleware(request);
  return recommendationsHandler(request);
}

export const GET_RECOMMENDATIONS = errorHandler(
  loggingMiddleware(corsMiddleware(optionalAuthRecommendationsHandler))
);
