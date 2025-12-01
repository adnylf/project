import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import mentorService from "@/services/mentor.service";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/mentors/statistics
 * Get comprehensive mentor statistics
 */
async function handler(request: NextRequest, user: any) {
  try {
    // Get mentor profile
    const mentor = await mentorService.getMentorByUserId(user.userId);

    // Date ranges for analytics
    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
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
      prisma.course.count({ where: { mentor_id: mentor.id } }),
      prisma.course.count({
        where: { mentor_id: mentor.id, status: "PUBLISHED" },
      }),
      prisma.course.count({ where: { mentor_id: mentor.id, status: "DRAFT" } }),

      // Students
      prisma.enrollment
        .findMany({
          where: { course: { mentor_id: mentor.id } },
          distinct: ["user_id"],
          select: { user_id: true },
        })
        .then((enrollments: any[]) => enrollments.length),

      prisma.enrollment.count({
        where: {
          course: { mentor_id: mentor.id },
          status: "ACTIVE",
        },
      }),

      prisma.enrollment
        .findMany({
          where: {
            course: { mentor_id: mentor.id },
            created_at: { gte: lastMonth },
          },
          distinct: ["user_id"],
          select: { user_id: true },
        })
        .then((enrollments: any[]) => enrollments.length),

      prisma.enrollment
        .findMany({
          where: {
            course: { mentor_id: mentor.id },
            created_at: { gte: lastWeek },
          },
          distinct: ["user_id"],
          select: { user_id: true },
        })
        .then((enrollments: any[]) => enrollments.length),

      // Enrollments
      prisma.enrollment.count({
        where: { course: { mentor_id: mentor.id } },
      }),

      prisma.enrollment.count({
        where: {
          course: { mentor_id: mentor.id },
          status: "COMPLETED",
        },
      }),

      prisma.enrollment
        .aggregate({
          where: { course: { mentor_id: mentor.id } },
          _avg: { progress: true },
        })
        .then((result: any) => result._avg.progress || 0),

      // Revenue
      prisma.transaction
        .aggregate({
          where: {
            status: "PAID",
            course: { mentor_id: mentor.id },
          },
          _sum: { total_amount: true },
        })
        .then((result: any) => result._sum.total_amount || 0),

      prisma.transaction
        .aggregate({
          where: {
            status: "PAID",
            course: { mentor_id: mentor.id },
            paid_at: { gte: lastMonth },
          },
          _sum: { total_amount: true },
        })
        .then((result: any) => result._sum.total_amount || 0),

      prisma.transaction
        .aggregate({
          where: {
            status: "PAID",
            course: { mentor_id: mentor.id },
            paid_at: {
              gte: new Date(
                lastMonth.getFullYear(),
                lastMonth.getMonth() - 1,
                lastMonth.getDate()
              ),
              lt: lastMonth,
            },
          },
          _sum: { total_amount: true },
        })
        .then((result: any) => result._sum.total_amount || 0),

      // Reviews
      prisma.review
        .aggregate({
          where: { course: { mentor_id: mentor.id } },
          _avg: { rating: true },
        })
        .then((result: any) => result._avg.rating || 0),

      prisma.review.count({
        where: { course: { mentor_id: mentor.id } },
      }),

      prisma.review.count({
        where: {
          course: { mentor_id: mentor.id },
          created_at: { gte: lastMonth },
        },
      }),

      // Certificates
      prisma.certificate.count({
        where: {
          enrollment: {
            course: { mentor_id: mentor.id },
          },
          status: "ISSUED",
        },
      }),

      // Top courses
      prisma.course.findMany({
        where: {
          mentor_id: mentor.id,
          status: "PUBLISHED",
        },
        orderBy: [{ total_students: "desc" }, { average_rating: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          total_students: true,
          average_rating: true,
          total_reviews: true,
        },
      }),
    ]);

    // Calculate completion rate
    const completionRate =
      totalEnrollments > 0
        ? (completedEnrollments / totalEnrollments) * 100
        : 0;

    // Calculate revenue growth
    const revenueGrowth =
      revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        : 0;

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

    return successResponse(statistics, "Statistics retrieved successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse(
      "Failed to get statistics",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply middlewares and export
async function authenticatedHandler(
  request: NextRequest
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  return handler(request, authResult);
}

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
