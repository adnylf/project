import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS, USER_ROLES } from "@/lib/constants";

interface TopCourse {
  courseId: string | null;
  _sum: { total_amount: number | null };
  _count: number;
}

async function handler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  try {
    const { user } = context;

    if (user.role !== USER_ROLES.ADMIN) {
      return errorResponse("Insufficient permissions", HTTP_STATUS.FORBIDDEN);
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const period = searchParams.get("period") || "monthly";

    // Build date filter
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const [
      // Total revenue
      totalRevenue,

      // Revenue by payment method
      revenueByPaymentMethod,

      // Top earning courses
      topCourses,

      // Top earning mentors
      topMentors,

      // Revenue trend
      revenueTrend,
    ] = await Promise.all([
      // Total revenue
      prisma.transaction.aggregate({
        where: {
          status: "PAID",
          ...(Object.keys(dateFilter).length > 0 && { paid_at: dateFilter }),
        },
        _sum: { total_amount: true, discount: true },
        _count: true,
        _avg: { total_amount: true },
      }),

      // By payment method
      prisma.transaction.groupBy({
        by: ["payment_method"],
        where: {
          status: "PAID",
          ...(Object.keys(dateFilter).length > 0 && { paid_at: dateFilter }),
        },
        _sum: { total_amount: true },
        _count: true,
      }),

      // Top courses
      prisma.transaction.groupBy({
        by: ["course_id"],
        where: {
          status: "PAID",
          ...(Object.keys(dateFilter).length > 0 && { paid_at: dateFilter }),
        },
        _sum: { total_amount: true },
        _count: true,
        orderBy: { _sum: { total_amount: "desc" } },
        take: 10,
      }),

      // Top mentors (via courses)
      prisma.$queryRaw`
        SELECT 
          m.id as mentor_id,
          u.full_name as mentor_name,
          COUNT(DISTINCT t.id)::int as transaction_count,
          COALESCE(SUM(t.total_amount), 0) as total_revenue
        FROM mentor_profiles m
        JOIN users u ON m.user_id = u.id
        JOIN courses c ON m.id = c.mentor_id
        JOIN transactions t ON c.id = t.course_id
        WHERE t.status = 'PAID'
          ${
            startDate
              ? Prisma.sql`AND t.paid_at >= ${new Date(startDate)}`
              : Prisma.empty
          }
          ${
            endDate
              ? Prisma.sql`AND t.paid_at <= ${new Date(endDate)}`
              : Prisma.empty
          }
        GROUP BY m.id, u.full_name
        ORDER BY total_revenue DESC
        LIMIT 10
      `,

      // Revenue trend
      prisma.$queryRaw`
        SELECT 
          ${
            period === "daily"
              ? Prisma.sql`DATE(paid_at)`
              : period === "weekly"
              ? Prisma.sql`DATE_TRUNC('week', paid_at)`
              : period === "monthly"
              ? Prisma.sql`DATE_TRUNC('month', paid_at)`
              : Prisma.sql`DATE_TRUNC('year', paid_at)`
          } as period,
          COUNT(*)::int as transaction_count,
          COALESCE(SUM(total_amount), 0) as revenue,
          COALESCE(AVG(total_amount), 0) as avg_transaction
        FROM transactions
        WHERE status = 'PAID'
          ${
            startDate
              ? Prisma.sql`AND paid_at >= ${new Date(startDate)}`
              : Prisma.empty
          }
          ${
            endDate
              ? Prisma.sql`AND paid_at <= ${new Date(endDate)}`
              : Prisma.empty
          }
        GROUP BY period
        ORDER BY period ASC
      `,
    ]);

    // Enrich top courses with details
    const courseIds = (topCourses as TopCourse[])
      .map((tc: TopCourse) => tc.courseId)
      .filter((id): id is string => id !== null);
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        price: true,
        mentor: {
          select: {
            user: {
              select: { full_name: true },
            },
          },
        },
      },
    });

    const enrichedTopCourses = (topCourses as TopCourse[]).map(
      (tc: TopCourse) => {
        const course = courses.find((c: any) => c.id === tc.courseId);
        return {
          courseId: tc.courseId,
          courseName: course?.title || "Unknown",
          thumbnail: course?.thumbnail,
          price: course?.price,
          mentorName: course?.mentor.user.full_name,
          revenue: tc._sum.total_amount || 0,
          transactions: tc._count,
        };
      }
    );

    return successResponse(
      {
        summary: {
          totalRevenue: totalRevenue._sum.total_amount || 0,
          totalDiscount: totalRevenue._sum.discount || 0,
          transactionCount: totalRevenue._count,
          averageTransaction: totalRevenue._avg.total_amount || 0,
        },
        byPaymentMethod: revenueByPaymentMethod,
        topCourses: enrichedTopCourses,
        topMentors,
        trend: revenueTrend,
      },
      "Revenue report retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to generate revenue report",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

const authenticatedHandler = requireAuth(handler);

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
