// ============================================
// FILE: src/app/api/admin/transactions/route.ts
// ============================================

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
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('payment_method');
    const paymentGateway = searchParams.get('payment_gateway');
    const courseId = searchParams.get('course_id');
    const userId = searchParams.get('user_id');
    const minAmount = searchParams.get('min_amount');
    const maxAmount = searchParams.get('max_amount');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const offset = (page - 1) * limit;

    // Build query - Fixed: Changed 'let' to 'const' and fixed type
    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      whereConditions.push(`(
        t.order_id ILIKE $${params.length + 1} OR
        u.full_name ILIKE $${params.length + 1} OR
        u.email ILIKE $${params.length + 1} OR
        c.title ILIKE $${params.length + 1}
      )`);
      params.push(`%${search}%`);
    }

    if (status) {
      whereConditions.push(`t.status = $${params.length + 1}`);
      params.push(status);
    }

    if (paymentMethod) {
      whereConditions.push(`t.payment_method = $${params.length + 1}`);
      params.push(paymentMethod);
    }

    if (paymentGateway) {
      whereConditions.push(`t.payment_gateway = $${params.length + 1}`);
      params.push(paymentGateway);
    }

    if (courseId) {
      whereConditions.push(`t.course_id = $${params.length + 1}`);
      params.push(courseId);
    }

    if (userId) {
      whereConditions.push(`t.user_id = $${params.length + 1}`);
      params.push(userId);
    }

    if (minAmount) {
      whereConditions.push(`t.amount >= $${params.length + 1}`);
      params.push(parseFloat(minAmount));
    }

    if (maxAmount) {
      whereConditions.push(`t.amount <= $${params.length + 1}`);
      params.push(parseFloat(maxAmount));
    }

    if (startDate) {
      whereConditions.push(`t.created_at >= $${params.length + 1}`);
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`t.created_at <= $${params.length + 1}`);
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['created_at', 'amount', 'status', 'paid_at', 'order_id'];
    const validatedSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const validatedSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get transactions with full details
    const query = `
      SELECT 
        t.*,
        u.full_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        c.title as course_title,
        c.slug as course_slug,
        c.price as course_price,
        c.thumbnail_url as course_thumbnail,
        i.full_name as instructor_name,
        CASE 
          WHEN t.payment_gateway = 'manual' THEN (
            SELECT json_build_object(
              'proof_url', pp.proof_url,
              'submitted_at', pp.submitted_at,
              'status', pp.status,
              'reviewed_by', admin.full_name,
              'reviewed_at', pp.reviewed_at,
              'admin_notes', pp.admin_notes
            )
            FROM payment_proofs pp
            LEFT JOIN users admin ON pp.reviewed_by = admin.id
            WHERE pp.transaction_id = t.id
            ORDER BY pp.submitted_at DESC
            LIMIT 1
          )
          ELSE NULL
        END as payment_proof
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN courses c ON t.course_id = c.id
      JOIN users i ON c.instructor_id = i.id
      ${whereClause}
      ORDER BY t.${validatedSortBy} ${validatedSortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await sql.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN courses c ON t.course_id = c.id
      ${whereClause}
    `;

    const countResult = await sql.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Get transaction statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
        COUNT(*) FILTER (WHERE status = 'success') as success_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending' OR status = 'processing'), 0) as pending_revenue,
        COALESCE(AVG(amount) FILTER (WHERE status = 'success'), 0) as average_transaction,
        COUNT(DISTINCT user_id) as unique_customers,
        COUNT(DISTINCT course_id) as unique_courses
      FROM transactions t
      ${whereClause}
    `;

    const statsResult = await sql.query(statsQuery, params.slice(0, -2));

    // Get revenue trend (last 7 days)
    const trendQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as revenue
      FROM transactions
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const trendResult = await sql.query(trendQuery);

    // Get payment method distribution - Fixed: Removed sql.raw usage
    const methodDistributionQuery = `
      SELECT 
        payment_method,
        payment_gateway,
        COUNT(*) as count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as total_amount
      FROM transactions
      ${whereClause}
      GROUP BY payment_method, payment_gateway
      ORDER BY count DESC
    `;

    const methodDistribution = await sql.query(methodDistributionQuery, params.slice(0, -2));

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
      statistics: {
        ...statsResult.rows[0],
        revenue_trend: trendResult.rows,
        payment_method_distribution: methodDistribution.rows,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
