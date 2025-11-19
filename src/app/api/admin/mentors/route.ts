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
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const offset = (page - 1) * limit;

    // Build query
    let whereConditions: string[] = ['1=1'];
    const params: any[] = [];

    if (status) {
      whereConditions.push(`mp.status = $${params.length + 1}`);
      params.push(status);
    }

    if (search) {
      whereConditions.push(`(
        u.full_name ILIKE $${params.length + 1} OR 
        u.email ILIKE $${params.length + 1} OR
        mp.headline ILIKE $${params.length + 1}
      )`);
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['created_at', 'full_name', 'status', 'average_rating'];
    const validatedSortBy = validSortColumns.includes(sortBy) ? `mp.${sortBy}` : 'mp.created_at';
    const validatedSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get mentor applications
    const query = `
      SELECT 
        mp.id,
        mp.user_id,
        mp.expertise,
        mp.experience,
        mp.education,
        mp.bio,
        mp.headline,
        mp.website,
        mp.linkedin,
        mp.twitter,
        mp.portfolio,
        mp.status,
        mp.average_rating,
        mp.total_students,
        mp.total_courses,
        mp.total_reviews,
        mp.approved_at,
        mp.rejected_at,
        mp.rejection_reason,
        mp.created_at,
        mp.updated_at,
        u.full_name,
        u.email,
        u.avatar_url,
        u.phone
      FROM mentor_profiles mp
      JOIN users u ON mp.user_id = u.id
      ${whereClause}
      ORDER BY ${validatedSortBy} ${validatedSortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await sql.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mentor_profiles mp
      JOIN users u ON mp.user_id = u.id
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
      FROM mentor_profiles
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
    console.error('Get mentor applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch mentor applications' }, { status: 500 });
  }
}
