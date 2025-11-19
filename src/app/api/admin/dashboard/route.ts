// src/app/api/admin/dashboard/route.ts
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
      prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
      prisma.user.count({
        where: {
          lastLoginAt: { gte: last7Days },
        },
      }),

      // Courses
      prisma.course.count(),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.course.count({ where: { status: 'DRAFT' } }),
      prisma.course.count({ where: { status: 'REVIEW' } }),

      // Revenue
      prisma.transaction.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: thisMonth },
        },
        _sum: { totalAmount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
        _sum: { totalAmount: true },
      }),

      // Enrollments
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.enrollment.count({ where: { status: 'ACTIVE' } }),

      // Recent activities
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          profilePicture: true,
        },
      }),
      prisma.course.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          thumbnail: true,
          mentor: {
            select: {
              user: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { status: 'PAID' },
        select: {
          id: true,
          orderId: true,
          totalAmount: true,
          paidAt: true,
          user: {
            select: { name: true, email: true },
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
      (revenueLastMonth._sum.totalAmount || 0) > 0
        ? (((revenueThisMonth._sum.totalAmount || 0) - (revenueLastMonth._sum.totalAmount || 0)) /
            (revenueLastMonth._sum.totalAmount || 0)) *
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
            total: totalRevenue._sum.totalAmount || 0,
            thisMonth: revenueThisMonth._sum.totalAmount || 0,
            lastMonth: revenueLastMonth._sum.totalAmount || 0,
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
      'Dashboard data retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get dashboard data', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function authenticatedHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request);
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(authenticatedHandler)));
