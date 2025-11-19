import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import mentorService from '@/services/mentor.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/mentors/statistics
 * Get comprehensive mentor statistics
 */
async function handler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Get mentor profile
    const mentor = await mentorService.getMentorByUserId(user.userId);

    // Date ranges for analytics
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      // Course statistics
      totalCourses,
      publishedCourses,
      draftCourses,

      // Student statistics
      totalStudents,
      activeStudents,
      newStudentsThisMonth,
      newStudentsThisWeek,

      // Engagement statistics
      totalEnrollments,
      completedEnrollments,
      averageProgress,

      // Revenue statistics
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,

      // Review statistics
      averageRating,
      totalReviews,
      reviewsThisMonth,

      // Certificate statistics
      totalCertificates,

      // Top performing courses
      topCourses,
    ] = await Promise.all([
      // Courses
      prisma.course.count({ where: { mentorId: mentor.id } }),
      prisma.course.count({ where: { mentorId: mentor.id, status: 'PUBLISHED' } }),
      prisma.course.count({ where: { mentorId: mentor.id, status: 'DRAFT' } }),

      // Students
      prisma.enrollment
        .findMany({
          where: { course: { mentorId: mentor.id } },
          distinct: ['userId'],
          select: { userId: true },
        })
        .then((enrollments) => enrollments.length),

      prisma.enrollment.count({
        where: {
          course: { mentorId: mentor.id },
          status: 'ACTIVE',
        },
      }),

      prisma.enrollment
        .findMany({
          where: {
            course: { mentorId: mentor.id },
            createdAt: { gte: lastMonth },
          },
          distinct: ['userId'],
          select: { userId: true },
        })
        .then((enrollments) => enrollments.length),

      prisma.enrollment
        .findMany({
          where: {
            course: { mentorId: mentor.id },
            createdAt: { gte: lastWeek },
          },
          distinct: ['userId'],
          select: { userId: true },
        })
        .then((enrollments) => enrollments.length),

      // Enrollments
      prisma.enrollment.count({
        where: { course: { mentorId: mentor.id } },
      }),

      prisma.enrollment.count({
        where: {
          course: { mentorId: mentor.id },
          status: 'COMPLETED',
        },
      }),

      prisma.enrollment
        .aggregate({
          where: { course: { mentorId: mentor.id } },
          _avg: { progress: true },
        })
        .then((result) => result._avg.progress || 0),

      // Revenue
      prisma.transaction
        .aggregate({
          where: {
            status: 'PAID',
            course: { mentorId: mentor.id },
          },
          _sum: { totalAmount: true },
        })
        .then((result) => result._sum.totalAmount || 0),

      prisma.transaction
        .aggregate({
          where: {
            status: 'PAID',
            course: { mentorId: mentor.id },
            paidAt: { gte: lastMonth },
          },
          _sum: { totalAmount: true },
        })
        .then((result) => result._sum.totalAmount || 0),

      prisma.transaction
        .aggregate({
          where: {
            status: 'PAID',
            course: { mentorId: mentor.id },
            paidAt: {
              gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, lastMonth.getDate()),
              lt: lastMonth,
            },
          },
          _sum: { totalAmount: true },
        })
        .then((result) => result._sum.totalAmount || 0),

      // Reviews
      prisma.review
        .aggregate({
          where: { course: { mentorId: mentor.id } },
          _avg: { rating: true },
        })
        .then((result) => result._avg.rating || 0),

      prisma.review.count({
        where: { course: { mentorId: mentor.id } },
      }),

      prisma.review.count({
        where: {
          course: { mentorId: mentor.id },
          createdAt: { gte: lastMonth },
        },
      }),

      // Certificates
      prisma.certificate.count({
        where: {
          enrollment: {
            course: { mentorId: mentor.id },
          },
          status: 'ISSUED',
        },
      }),

      // Top courses
      prisma.course.findMany({
        where: {
          mentorId: mentor.id,
          status: 'PUBLISHED',
        },
        orderBy: [{ totalStudents: 'desc' }, { averageRating: 'desc' }],
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          totalStudents: true,
          averageRating: true,
          totalReviews: true,
        },
      }),
    ]);

    // Calculate completion rate
    const completionRate =
      totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

    // Calculate revenue growth
    const revenueGrowth =
      revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;

    // Build response
    const statistics = {
      overview: {
        totalCourses,
        publishedCourses,
        draftCourses,
        totalStudents,
        activeStudents,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
      },

      engagement: {
        totalEnrollments,
        completedEnrollments,
        averageProgress: Math.round(averageProgress * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        totalCertificates,
      },

      growth: {
        newStudentsThisWeek,
        newStudentsThisMonth,
        reviewsThisMonth,
        revenueThisMonth,
        revenueLastMonth,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      },

      topCourses,
    };

    return successResponse(statistics, 'Statistics retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to get statistics', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request);
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(authenticatedHandler)));
