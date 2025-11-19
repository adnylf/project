import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const category_id = searchParams.get('category_id') || '';
    const instructor_id = searchParams.get('instructor_id') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const offset = (page - 1) * limit;

    // Build query
    let whereConditions: string[] = ['1=1'];
    const params: any[] = [];

    if (status) {
      whereConditions.push(`c.status = $${params.length + 1}`);
      params.push(status);
    }

    if (search) {
      whereConditions.push(`(
        c.title ILIKE $${params.length + 1} OR 
        c.description ILIKE $${params.length + 1}
      )`);
      params.push(`%${search}%`);
    }

    if (category_id) {
      whereConditions.push(`c.category_id = $${params.length + 1}`);
      params.push(category_id);
    }

    if (instructor_id) {
      whereConditions.push(`c.instructor_id = $${params.length + 1}`);
      params.push(instructor_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['created_at', 'title', 'price', 'total_students', 'average_rating'];
    const validatedSortBy = validSortColumns.includes(sortBy) ? `c.${sortBy}` : 'c.created_at';
    const validatedSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get courses
    const query = `
      SELECT 
        c.*,
        cat.name as category_name,
        u.full_name as instructor_name,
        u.email as instructor_email,
        COUNT(DISTINCT e.id) as enrollment_count,
        COUNT(DISTINCT r.id) as review_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN reviews r ON c.id = r.course_id
      ${whereClause}
      GROUP BY c.id, cat.id, u.id
      ORDER BY ${validatedSortBy} ${validatedSortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await sql.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      ${whereClause}
    `;

    const countResult = await sql.query(
      countQuery,
      params.slice(0, -2) // Remove limit and offset
    );

    const total = parseInt(countResult.rows[0].total);

    // Get status summary
    const summaryResult = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM courses
      GROUP BY status
    `;

    const statusSummary = summaryResult.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
      summary: statusSummary,
    });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
