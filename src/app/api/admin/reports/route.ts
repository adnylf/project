import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/reports
 * Generate custom reports
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let reportData;

    switch (reportType) {
      case 'overview':
        reportData = await generateOverviewReport(startDate, endDate);
        break;
      case 'users':
        reportData = await generateUserReport(startDate, endDate);
        break;
      case 'courses':
        reportData = await generateCourseReport(startDate, endDate);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      metadata: {
        reportType,
        dateRange: { startDate, endDate },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

async function generateOverviewReport(startDate: string | null, endDate: string | null) {
  try {
    const dateFilter = buildDateFilter(startDate, endDate);

    const [userStats, courseStats, enrollmentStats, revenueStats] = await Promise.all([
      prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE role = 'student') as total_students,
          COUNT(*) FILTER (WHERE role = 'instructor') as total_instructors,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d
        FROM users
        WHERE 1=1 ${dateFilter}
      `),
      prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as total_courses,
          COUNT(*) FILTER (WHERE status = 'published') as published_courses,
          COUNT(*) FILTER (WHERE status = 'draft') as draft_courses,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_courses_30d
        FROM courses
        WHERE 1=1 ${dateFilter}
      `),
      prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as total_enrollments,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_enrollments,
          COUNT(*) FILTER (WHERE status = 'active') as active_enrollments,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_enrollments_30d
        FROM enrollments
        WHERE 1=1 ${dateFilter}
      `),
      prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(*) FILTER (WHERE status = 'success') as successful_transactions,
          COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as total_revenue,
          COALESCE(AVG(amount) FILTER (WHERE status = 'success'), 0) as avg_transaction_value
        FROM transactions
        WHERE 1=1 ${dateFilter}
      `),
    ]);

    return {
      users: userStats[0],
      courses: courseStats[0],
      enrollments: enrollmentStats[0],
      revenue: revenueStats[0],
    };
  } catch (error) {
    console.error('Overview report error:', error);
    throw error;
  }
}

async function generateUserReport(startDate: string | null, endDate: string | null) {
  try {
    const dateFilter = buildDateFilter(startDate, endDate);

    const [userGrowth, engagement, topUsers, retention] = await Promise.all([
      prisma.$queryRawUnsafe(`
        SELECT 
          DATE_TRUNC('day', created_at)::date as date,
          COUNT(*) as new_users,
          COUNT(*) FILTER (WHERE role = 'student') as new_students,
          COUNT(*) FILTER (WHERE role = 'instructor') as new_instructors
        FROM users
        WHERE 1=1 ${dateFilter}
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date DESC
        LIMIT 30
      `),
      prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(DISTINCT e.user_id) as enrolled_users,
          COUNT(DISTINCT e.user_id) FILTER (WHERE e.progress > 0) as active_learners,
          COUNT(DISTINCT e.user_id) FILTER (WHERE e.status = 'completed') as completed_users,
          COALESCE(AVG(e.progress), 0) as avg_progress
        FROM enrollments e
        WHERE 1=1 ${dateFilter}
      `),
      prisma.$queryRawUnsafe(`
        SELECT 
          u.id,
          u.full_name,
          u.email,
          u.role,
          COUNT(DISTINCT e.id) as total_enrollments,
          COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') as completed_courses
        FROM users u
        LEFT JOIN enrollments e ON u.id = e.user_id
        WHERE u.role = 'student'
        GROUP BY u.id
        ORDER BY total_enrollments DESC
        LIMIT 20
      `),
      prisma.$queryRawUnsafe(`
        SELECT 
          DATE_TRUNC('month', created_at)::date as month,
          COUNT(*) as cohort_size,
          COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '30 days') as retained_30d
        FROM users
        WHERE role = 'student'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
        LIMIT 12
      `),
    ]);

    return {
      growth: userGrowth,
      engagement: engagement[0],
      topUsers,
      retention,
    };
  } catch (error) {
    console.error('User report error:', error);
    throw error;
  }
}

async function generateCourseReport(startDate: string | null, endDate: string | null) {
  try {
    const dateFilter = buildDateFilter(startDate, endDate);

    const [courseStats, topCourses, categoryStats, instructorStats] = await Promise.all([
      prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as total_courses,
          COUNT(*) FILTER (WHERE status = 'published') as published,
          COUNT(*) FILTER (WHERE status = 'draft') as draft,
          COALESCE(AVG(price), 0) as avg_price,
          COALESCE(AVG(average_rating), 0) as avg_rating
        FROM courses
        WHERE 1=1 ${dateFilter}
      `),
      prisma.$queryRawUnsafe(`
        SELECT 
          c.id,
          c.title,
          c.slug,
          COUNT(DISTINCT e.id) as total_enrollments,
          COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') as completed_enrollments,
          c.average_rating,
          c.price
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE 1=1 ${dateFilter}
        GROUP BY c.id
        ORDER BY total_enrollments DESC
        LIMIT 20
      `),
      prisma.$queryRawUnsafe(`
        SELECT 
          cat.id,
          cat.name,
          COUNT(DISTINCT c.id) as course_count,
          COUNT(DISTINCT e.id) as total_enrollments
        FROM categories cat
        LEFT JOIN courses c ON cat.id = c.category_id
        LEFT JOIN enrollments e ON c.id = e.course_id
        GROUP BY cat.id
        ORDER BY course_count DESC
        LIMIT 20
      `),
      prisma.$queryRawUnsafe(`
        SELECT 
          u.id,
          u.full_name,
          u.email,
          COUNT(DISTINCT c.id) as total_courses,
          COUNT(DISTINCT e.id) as total_students,
          COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'success'), 0) as total_revenue
        FROM users u
        LEFT JOIN courses c ON u.id = c.instructor_id
        LEFT JOIN enrollments e ON c.id = e.course_id
        LEFT JOIN transactions t ON c.id = t.course_id
        WHERE u.role = 'instructor'
        GROUP BY u.id
        ORDER BY total_courses DESC
        LIMIT 20
      `),
    ]);

    return {
      stats: courseStats[0],
      topCourses,
      categories: categoryStats,
      instructors: instructorStats,
    };
  } catch (error) {
    console.error('Course report error:', error);
    throw error;
  }
}

function buildDateFilter(startDate: string | null, endDate: string | null): string {
  let filter = '';

  if (startDate) {
    filter += ` AND created_at >= '${startDate}'`;
  }

  if (endDate) {
    filter += ` AND created_at <= '${endDate}'`;
  }

  return filter;
}
