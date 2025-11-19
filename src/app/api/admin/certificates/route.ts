import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth'; // Fixed: Changed from verifyAuthToken

/**
 * GET /api/admin/certificates
 * Get all issued certificates with filters
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const courseId = searchParams.get('courseId') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * limit;

    const whereConditions: string[] = ['1=1'];
    const params: unknown[] = [];

    if (search) {
      whereConditions.push(`(
        u.full_name ILIKE $${params.length + 1} OR 
        u.email ILIKE $${params.length + 1} OR
        c.title ILIKE $${params.length + 1} OR
        cert.certificate_number ILIKE $${params.length + 1}
      )`);
      params.push(`%${search}%`);
    }

    if (status) {
      whereConditions.push(`cert.status = $${params.length + 1}`);
      params.push(status);
    }

    if (courseId) {
      whereConditions.push(`cert.course_id = $${params.length + 1}`);
      params.push(courseId);
    }

    if (startDate) {
      whereConditions.push(`cert.issued_at >= $${params.length + 1}`);
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`cert.issued_at <= $${params.length + 1}`);
      params.push(endDate);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        cert.*,
        u.full_name as user_name,
        u.email as user_email,
        u.avatar_url,
        c.title as course_title,
        c.thumbnail_url as course_thumbnail,
        i.full_name as instructor_name,
        e.completed_at,
        e.progress
      FROM certificates cert
      JOIN users u ON cert.user_id = u.id
      JOIN courses c ON cert.course_id = c.id
      JOIN enrollments e ON cert.enrollment_id = e.id
      JOIN users i ON c.instructor_id = i.id
      WHERE ${whereClause}
      ORDER BY cert.issued_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = (await prisma.$queryRawUnsafe(query, ...params)) as unknown[];

    const countQuery = `
      SELECT COUNT(*) as total
      FROM certificates cert
      JOIN users u ON cert.user_id = u.id
      JOIN courses c ON cert.course_id = c.id
      WHERE ${whereClause}
    `;

    const countResult = (await prisma.$queryRawUnsafe(
      countQuery,
      ...params.slice(0, -2)
    )) as Array<{ total: number }>;

    const total = parseInt(String(countResult[0]?.total || '0'));

    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'issued') as issued_count,
        COUNT(*) FILTER (WHERE status = 'revoked') as revoked_count,
        COUNT(*) FILTER (WHERE issued_at >= NOW() - INTERVAL '30 days') as issued_this_month,
        COUNT(*) FILTER (WHERE issued_at >= NOW() - INTERVAL '7 days') as issued_this_week
      FROM certificates
    `;

    const statsResult = (await prisma.$queryRawUnsafe(statsQuery)) as unknown[];

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
      statistics: statsResult[0],
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}
