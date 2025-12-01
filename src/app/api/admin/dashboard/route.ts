import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS, USER_ROLES } from "@/lib/constants";

async function handler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  try {
    const { user } = context;

    if (user.role !== USER_ROLES.ADMIN) {
      return errorResponse("Insufficient permissions", HTTP_STATUS.FORBIDDEN);
    }

    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      activeUsers,

      totalCourses,
      publishedCourses,
      draftCourses,
      pendingApproval,

      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,

      totalEnrollments,
      enrollmentsThisMonth,
      activeEnrollments,

      recentUsers,
      recentCourses,
      recentTransactions,

      userGrowth,
      courseGrowth,
      revenueGrowth,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { created_at: { gte: thisMonth } } }),
      prisma.user.count({
        where: {
          created_at: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
      prisma.user.count({
        where: {
          last_login: { gte: last7Days },
        },
      }),

      // Courses
      prisma.course.count(),
      prisma.course.count({ where: { status: "PUBLISHED" } }),
      prisma.course.count({ where: { status: "DRAFT" } }),
      prisma.course.count({ where: { status: "PENDING_REVIEW" } }),

      // Revenue
      prisma.transaction.aggregate({
        where: { status: "PAID" },
        _sum: { total_amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          status: "PAID",
          paid_at: { gte: thisMonth },
        },
        _sum: { total_amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          status: "PAID",
          paid_at: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
        _sum: { total_amount: true },
      }),

      // Enrollments
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { created_at: { gte: thisMonth } } }),
      prisma.enrollment.count({ where: { status: "ACTIVE" } }),

      // Recent activities
      prisma.user.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          created_at: true,
          avatar_url: true,
        },
      }),
      prisma.course.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          created_at: true,
          thumbnail: true,
          mentor: {
            select: {
              user: {
                select: { full_name: true },
              },
            },
          },
        },
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        where: { status: "PAID" },
        select: {
          id: true,
          order_id: true,
          total_amount: true,
          paid_at: true,
          user: {
            select: { full_name: true, email: true },
          },
          course: {
            select: { title: true },
          },
        },
      }),

      // Growth trends (last 7 days)
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM users
        WHERE created_at >= ${last7Days}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM courses
        WHERE created_at >= ${last7Days}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      prisma.$queryRaw`
        SELECT 
          DATE(paid_at) as date,
          COALESCE(SUM(total_amount), 0) as amount
        FROM transactions
        WHERE paid_at >= ${last7Days} AND status = 'PAID'
        GROUP BY DATE(paid_at)
        ORDER BY date ASC
      `,
    ]);

    const userGrowthPercent =
      newUsersLastMonth > 0
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
        : 0;

    const revenueGrowthPercent =
      (revenueLastMonth._sum.total_amount || 0) > 0
        ? (((revenueThisMonth._sum.total_amount || 0) -
            (revenueLastMonth._sum.total_amount || 0)) /
            (revenueLastMonth._sum.total_amount || 0)) *
          100
        : 0;

    return successResponse(
      {
        overview: {
          users: {
            total: totalUsers,
            newThisMonth: newUsersThisMonth,
            active: activeUsers,
            growth: Math.round(userGrowthPercent * 10) / 10,
          },
          courses: {
            total: totalCourses,
            published: publishedCourses,
            draft: draftCourses,
            pendingApproval,
          },
          revenue: {
            total: totalRevenue._sum.total_amount || 0,
            thisMonth: revenueThisMonth._sum.total_amount || 0,
            lastMonth: revenueLastMonth._sum.total_amount || 0,
            growth: Math.round(revenueGrowthPercent * 10) / 10,
          },
          enrollments: {
            total: totalEnrollments,
            thisMonth: enrollmentsThisMonth,
            active: activeEnrollments,
          },
        },
        recentActivities: {
          users: recentUsers,
          courses: recentCourses,
          transactions: recentTransactions,
        },
        trends: {
          users: userGrowth,
          courses: courseGrowth,
          revenue: revenueGrowth,
        },
      },
      "Dashboard data retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get dashboard data",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

const authenticatedHandler = requireAuth(handler);

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
