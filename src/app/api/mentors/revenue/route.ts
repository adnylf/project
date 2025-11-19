import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import mentorService from '@/services/mentor.service';
import { paymentGateway } from '@/lib/payment';
import { successResponse, paginatedResponse, errorResponse } from '@/utils/response.util';
import { validatePagination } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/mentors/revenue
 * Get mentor revenue report with breakdown per course
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
    const type = searchParams.get('type') || 'summary'; // summary | detailed | per-course
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const courseId = searchParams.get('courseId') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;

    // Build date filter
    const dateFilter: Prisma.TransactionWhereInput['paidAt'] = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    // Summary Report
    if (type === 'summary') {
      const [totalRevenue, totalTransactions, pendingRevenue, thisMonthRevenue, lastMonthRevenue] =
        await Promise.all([
          // Total revenue (paid transactions)
          prisma.transaction.aggregate({
            where: {
              status: 'PAID',
              course: { mentorId: mentor.id },
              ...(startDate || endDate ? { paidAt: dateFilter } : {}),
            },
            _sum: { totalAmount: true },
          }),

          // Total paid transactions
          prisma.transaction.count({
            where: {
              status: 'PAID',
              course: { mentorId: mentor.id },
              ...(startDate || endDate ? { paidAt: dateFilter } : {}),
            },
          }),

          // Pending revenue
          prisma.transaction.aggregate({
            where: {
              status: 'PENDING',
              course: { mentorId: mentor.id },
            },
            _sum: { totalAmount: true },
          }),

          // This month revenue
          prisma.transaction.aggregate({
            where: {
              status: 'PAID',
              course: { mentorId: mentor.id },
              paidAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
            _sum: { totalAmount: true },
          }),

          // Last month revenue
          prisma.transaction.aggregate({
            where: {
              status: 'PAID',
              course: { mentorId: mentor.id },
              paidAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
            _sum: { totalAmount: true },
          }),
        ]);

      const totalAmount = totalRevenue._sum.totalAmount || 0;
      const pendingAmount = pendingRevenue._sum.totalAmount || 0;
      const thisMonth = thisMonthRevenue._sum.totalAmount || 0;
      const lastMonth = lastMonthRevenue._sum.totalAmount || 0;

      // Calculate commission breakdown
      const commission = paymentGateway.calculateCommission(totalAmount);

      // Calculate growth
      const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

      return successResponse(
        {
          summary: {
            totalRevenue: totalAmount,
            mentorRevenue: commission.mentorRevenue,
            platformCommission: commission.platformCommission,
            paymentFee: commission.paymentFee,
            pendingRevenue: pendingAmount,
            totalTransactions,
          },
          monthly: {
            thisMonth,
            lastMonth,
            growth: Math.round(growth * 10) / 10,
          },
        },
        'Revenue summary retrieved successfully'
      );
    }

    // Per-Course Revenue
    if (type === 'per-course') {
      const courseRevenue = await prisma.transaction.groupBy({
        by: ['courseId'],
        where: {
          status: 'PAID',
          course: { mentorId: mentor.id },
          ...(startDate || endDate ? { paidAt: dateFilter } : {}),
        },
        _sum: {
          totalAmount: true,
        },
        _count: {
          id: true,
        },
      });

      // Get course details
      const courseIds = courseRevenue.map((r) => r.courseId);
      const courses = await prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          price: true,
        },
      });

      // Merge data
      const courseRevenueData = courseRevenue.map((revenue) => {
        const course = courses.find((c) => c.id === revenue.courseId);
        const totalAmount = revenue._sum.totalAmount || 0;
        const commission = paymentGateway.calculateCommission(totalAmount);

        return {
          courseId: revenue.courseId,
          courseName: course?.title || 'Unknown',
          courseSlug: course?.slug,
          thumbnail: course?.thumbnail,
          price: course?.price || 0,
          totalSales: revenue._count.id,
          totalRevenue: totalAmount,
          mentorRevenue: commission.mentorRevenue,
          platformCommission: commission.platformCommission,
        };
      });

      // Sort by revenue
      courseRevenueData.sort((a, b) => b.totalRevenue - a.totalRevenue);

      return successResponse(courseRevenueData, 'Per-course revenue retrieved successfully');
    }

    // Detailed Transaction List
    const validatedPagination = validatePagination(page, limit);
    const skip = (validatedPagination.page - 1) * validatedPagination.limit;

    const where: Prisma.TransactionWhereInput = {
      status: 'PAID',
      course: { mentorId: mentor.id },
    };

    if (courseId) where.courseId = courseId;
    if (startDate || endDate) where.paidAt = dateFilter;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: validatedPagination.limit,
        orderBy: { paidAt: 'desc' },
        select: {
          id: true,
          orderId: true,
          amount: true,
          discount: true,
          totalAmount: true,
          paymentMethod: true,
          status: true,
          paidAt: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              title: true,
              slug: true,
              price: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Add commission breakdown to each transaction
    const transactionsWithCommission = transactions.map((t) => {
      const commission = paymentGateway.calculateCommission(t.totalAmount);
      return {
        ...t,
        commission: {
          mentorRevenue: commission.mentorRevenue,
          platformCommission: commission.platformCommission,
          paymentFee: commission.paymentFee,
        },
      };
    });

    return paginatedResponse(
      transactionsWithCommission,
      {
        page: validatedPagination.page,
        limit: validatedPagination.limit,
        total,
      },
      'Revenue transactions retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get revenue', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request);
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(authenticatedHandler)));
