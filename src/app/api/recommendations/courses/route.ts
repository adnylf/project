import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

interface SimilarUser {
  user_id: string;
  common_courses: bigint;
  avg_progress: number;
}

interface EnrollmentData {
  courseId: string;
  progress: number;
  status: string;
  course: {
    categoryId: string;
    level: string;
    tags: string[];
  };
}

interface CourseResult {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  shortDescription: string | null;
  level: string;
  price: number;
  discountPrice: number | null;
  isFree: boolean;
  averageRating: number;
  totalStudents: number;
  totalReviews: number;
  tags: string[];
  category: {
    name: string;
    slug: string;
  } | null;
  mentor: {
    user: {
      name: string;
      profilePicture: string | null;
    };
  };
}

async function courseRecommendationsHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const userProfile = (await prisma.enrollment.findMany({
      where: { userId: user.userId },
      select: {
        courseId: true,
        progress: true,
        status: true,
        course: {
          select: {
            categoryId: true,
            level: true,
            tags: true,
          },
        },
      },
    })) as EnrollmentData[];

    const similarUsers = await prisma.$queryRaw<SimilarUser[]>`
      SELECT 
        e2.user_id,
        COUNT(DISTINCT e2.course_id)::bigint as common_courses,
        AVG(e2.progress) as avg_progress
      FROM enrollments e1
      JOIN enrollments e2 ON e1.course_id = e2.course_id
      WHERE e1.user_id = ${user.userId}
        AND e2.user_id != ${user.userId}
        AND e2.status = 'ACTIVE'
      GROUP BY e2.user_id
      HAVING COUNT(DISTINCT e2.course_id) >= 2
      ORDER BY common_courses DESC, avg_progress DESC
      LIMIT 20
    `;

    const similarUserIds = similarUsers.map((u) => u.user_id);

    const recommendedCourses = (await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        enrollments: {
          some: {
            userId: { in: similarUserIds },
            status: { in: ['ACTIVE', 'COMPLETED'] },
          },
        },
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
        tags: true,
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
    })) as CourseResult[];

    if (recommendedCourses.length < limit) {
      const userCategories = [...new Set(userProfile.map((e) => e.course.categoryId))];
      const userTags = [...new Set(userProfile.flatMap((e) => e.course.tags))];

      const contentBasedCourses = (await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [{ categoryId: { in: userCategories } }, { tags: { hasSome: userTags } }],
          NOT: {
            id: { in: recommendedCourses.map((c) => c.id) },
            enrollments: {
              some: { userId: user.userId },
            },
          },
        },
        take: limit - recommendedCourses.length,
        orderBy: { averageRating: 'desc' },
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
          tags: true,
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
      })) as CourseResult[];

      recommendedCourses.push(...contentBasedCourses);
    }

    return successResponse(
      {
        courses: recommendedCourses,
        algorithm: 'collaborative_filtering',
        similarUsersCount: similarUserIds.length,
      },
      'Course recommendations retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get course recommendations', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function authenticatedCourseRecommendationsHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return courseRecommendationsHandler(request);
}

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedCourseRecommendationsHandler))
);
