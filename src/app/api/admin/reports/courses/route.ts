import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/reports/courses
 * Course performance reports
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = buildDateFilter(startDate, endDate);

    // Course overview
    const overview = (await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*) as total_courses,
        COUNT(*) FILTER (WHERE status = 'published') as published,
        COUNT(*) FILTER (WHERE status = 'draft') as drafts,
        COUNT(*) FILTER (WHERE status = 'archived') as archived,
        COALESCE(AVG(average_rating), 0) as avg_rating,
        COALESCE(AVG(total_students), 0) as avg_students_per_course,
        COALESCE(SUM(total_students), 0) as total_enrollments
      FROM courses
      WHERE 1=1 ${dateFilter}
    `)) as Array<Record<string, unknown>>;

    // Course creation trend
    const creationTrend = (await prisma.$queryRawUnsafe(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as total_created,
        COUNT(*) FILTER (WHERE status = 'published') as published
      FROM courses
      WHERE 1=1 ${dateFilter}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `)) as Array<Record<string, unknown>>;

    // Top performing courses
    const topCourses = (await prisma.$queryRawUnsafe(`
      SELECT 
        c.id,
        c.title,
        c.slug,
        c.thumbnail_url,
        c.price,
        c.total_students,
        c.average_rating,
        c.total_reviews,
        i.full_name as instructor_name,
        cat.name as category_name,
        COALESCE(SUM(t.amount), 0) as revenue,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') as completions
      FROM courses c
      JOIN users i ON c.instructor_id = i.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN transactions t ON c.id = t.course_id AND t.status = 'success'
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.status = 'published'
      GROUP BY c.id, i.full_name, cat.name
      ORDER BY c.total_students DESC
      LIMIT 20
    `)) as Array<Record<string, unknown>>;

    // Courses by category
    const byCategory = (await prisma.$queryRawUnsafe(`
      SELECT 
        cat.name as category,
        COUNT(c.id) as course_count,
        COALESCE(SUM(c.total_students), 0) as total_students,
        COALESCE(AVG(c.average_rating), 0) as avg_rating,
        COALESCE(SUM(t.amount), 0) as total_revenue
      FROM categories cat
      LEFT JOIN courses c ON cat.id = c.category_id AND c.status = 'published'
      LEFT JOIN transactions t ON c.id = t.course_id AND t.status = 'success'
      GROUP BY cat.id, cat.name
      ORDER BY total_students DESC
    `)) as Array<Record<string, unknown>>;

    // Course completion rates
    const completionRates = (await prisma.$queryRawUnsafe(`
      SELECT 
        c.id,
        c.title,
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') as completions,
        CASE 
          WHEN COUNT(DISTINCT e.id) > 0 
          THEN (COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed')::float / COUNT(DISTINCT e.id) * 100)::numeric(10,2)
          ELSE 0
        END as completion_rate,
        COALESCE(AVG(e.progress), 0) as avg_progress
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.status = 'published'
      GROUP BY c.id
      HAVING COUNT(DISTINCT e.id) >= 10
      ORDER BY completion_rate DESC
      LIMIT 20
    `)) as Array<Record<string, unknown>>;

    // Student satisfaction
    const satisfaction = (await prisma.$queryRawUnsafe(`
      SELECT 
        c.id,
        c.title,
        c.average_rating,
        c.total_reviews,
        COUNT(r.id) FILTER (WHERE r.rating >= 4) as positive_reviews,
        COUNT(r.id) FILTER (WHERE r.rating <= 2) as negative_reviews,
        COUNT(DISTINCT r.user_id) as unique_reviewers
      FROM courses c
      LEFT JOIN reviews r ON c.id = r.course_id
      WHERE c.status = 'published'
      GROUP BY c.id
      HAVING COUNT(r.id) >= 5
      ORDER BY c.average_rating DESC, c.total_reviews DESC
      LIMIT 20
    `)) as Array<Record<string, unknown>>;

    // Course engagement metrics
    const engagement = (await prisma.$queryRawUnsafe(`
      SELECT 
        c.id,
        c.title,
        c.total_students,
        COUNT(DISTINCT co.id) as total_comments,
        COUNT(DISTINCT r.id) as total_reviews,
        COALESCE(AVG(e.progress), 0) as avg_progress,
        COUNT(DISTINCT e.id) FILTER (WHERE e.last_accessed_at >= NOW() - INTERVAL '7 days') as active_last_7d
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN comments co ON c.id = co.course_id
      LEFT JOIN reviews r ON c.id = r.course_id
      WHERE c.status = 'published'
      GROUP BY c.id
      ORDER BY total_students DESC
      LIMIT 20
    `)) as Array<Record<string, unknown>>;

    return NextResponse.json({
      success: true,
      data: {
        overview: overview[0],
        creationTrend,
        topCourses,
        byCategory,
        completionRates,
        satisfaction,
        engagement,
      },
    });
  } catch (error) {
    console.error('Course report error:', error);
    return NextResponse.json({ error: 'Failed to generate course report' }, { status: 500 });
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
