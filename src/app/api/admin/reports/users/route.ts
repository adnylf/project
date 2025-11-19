import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS, USER_ROLES } from '@/lib/constants';

interface UserOverview {
  total_users: bigint;
  students: bigint;
  mentors: bigint;
  admins: bigint;
  active_users: bigint;
  verified_users: bigint;
  new_users: bigint;
}

interface UserEngagement {
  enrolled_users: bigint;
  active_learners: bigint;
  completed_users: bigint;
  avg_progress: number;
  users_with_reviews: bigint;
  users_with_comments: bigint;
}

async function usersHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user || user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const [
      // Overview
      overviewResult,

      // Growth trend
      growth,

      // Engagement
      engagementResult,

      // Top users
      topUsers,

      // Retention
      retention,

      // Demographics
      demographics,
    ] = await Promise.all([
      // User overview
      prisma.$queryRaw<UserOverview[]>`
        SELECT 
          COUNT(*)::bigint as total_users,
          COUNT(*) FILTER (WHERE role = 'STUDENT')::bigint as students,
          COUNT(*) FILTER (WHERE role = 'MENTOR')::bigint as mentors,
          COUNT(*) FILTER (WHERE role = 'ADMIN')::bigint as admins,
          COUNT(*) FILTER (WHERE status = 'ACTIVE')::bigint as active_users,
          COUNT(*) FILTER (WHERE email_verified = true)::bigint as verified_users,
          ${
            startDate
              ? Prisma.sql`COUNT(*) FILTER (WHERE created_at >= ${new Date(startDate)})::bigint`
              : Prisma.sql`0::bigint`
          } as new_users
        FROM users
        ${
          Object.keys(dateFilter).length > 0
            ? Prisma.sql`WHERE created_at >= ${dateFilter.gte} AND created_at <= ${dateFilter.lte}`
            : Prisma.empty
        }
      `,

      // User growth trend (last 30 days)
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*)::int as count,
          COUNT(*) FILTER (WHERE role = 'STUDENT')::int as students,
          COUNT(*) FILTER (WHERE role = 'MENTOR')::int as mentors
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,

      // Engagement metrics
      prisma.$queryRaw<UserEngagement[]>`
        SELECT 
          COUNT(DISTINCT e.user_id)::bigint as enrolled_users,
          COUNT(DISTINCT e.user_id) FILTER (WHERE e.progress > 0)::bigint as active_learners,
          COUNT(DISTINCT e.user_id) FILTER (WHERE e.status = 'COMPLETED')::bigint as completed_users,
          COALESCE(AVG(e.progress), 0) as avg_progress,
          COUNT(DISTINCT r.user_id)::bigint as users_with_reviews,
          COUNT(DISTINCT c.user_id)::bigint as users_with_comments
        FROM users u
        LEFT JOIN enrollments e ON u.id = e.user_id
        LEFT JOIN reviews r ON u.id = r.user_id
        LEFT JOIN comments c ON u.id = c.user_id
        WHERE u.role = 'STUDENT'
      `,

      // Top active users
      prisma.$queryRaw`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          COUNT(DISTINCT e.id)::int as total_enrollments,
          COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'COMPLETED')::int as completed_courses,
          COUNT(DISTINCT r.id)::int as total_reviews,
          u.last_login_at
        FROM users u
        LEFT JOIN enrollments e ON u.id = e.user_id
        LEFT JOIN reviews r ON u.id = r.user_id
        WHERE u.role = 'STUDENT'
        GROUP BY u.id
        ORDER BY total_enrollments DESC
        LIMIT 20
      `,

      // Retention cohorts
      prisma.$queryRaw`
        WITH cohorts AS (
          SELECT 
            DATE_TRUNC('month', created_at) as cohort_month,
            id as user_id
          FROM users
          WHERE role = 'STUDENT'
        )
        SELECT 
          TO_CHAR(cohort_month, 'YYYY-MM') as cohort,
          COUNT(DISTINCT user_id)::int as cohort_size,
          COUNT(DISTINCT CASE WHEN last_login_at >= NOW() - INTERVAL '30 days' THEN user_id END)::int as retained_30d,
          COUNT(DISTINCT CASE WHEN last_login_at >= NOW() - INTERVAL '90 days' THEN user_id END)::int as retained_90d
        FROM cohorts
        JOIN users ON cohorts.user_id = users.id
        GROUP BY cohort_month
        ORDER BY cohort_month DESC
        LIMIT 12
      `,

      // Demographics
      prisma.user.groupBy({
        by: ['country'],
        where: { country: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } },
        take: 20,
      }),
    ]);

    const overview = overviewResult[0];
    const engagement = engagementResult[0];

    return successResponse(
      {
        overview: {
          total_users: Number(overview.total_users),
          students: Number(overview.students),
          mentors: Number(overview.mentors),
          admins: Number(overview.admins),
          active_users: Number(overview.active_users),
          verified_users: Number(overview.verified_users),
          new_users: Number(overview.new_users),
        },
        growth,
        engagement: {
          enrolled_users: Number(engagement.enrolled_users),
          active_learners: Number(engagement.active_learners),
          completed_users: Number(engagement.completed_users),
          avg_progress: engagement.avg_progress,
          users_with_reviews: Number(engagement.users_with_reviews),
          users_with_comments: Number(engagement.users_with_comments),
        },
        topUsers,
        retention,
        demographics,
      },
      'User report retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to generate user report', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function authenticatedUsersHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return usersHandler(request);
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(authenticatedUsersHandler)));
