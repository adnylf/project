// ============================================
// FILE: src/app/api/admin/users/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

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
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const offset = (page - 1) * limit;

    // Build query - Fixed: Changed 'let' to 'const' and fixed type
    const whereConditions: string[] = ["role != 'admin'"];
    const params: (string | number)[] = [];

    if (search) {
      whereConditions.push(`(
        full_name ILIKE $${params.length + 1} OR 
        email ILIKE $${params.length + 1}
      )`);
      params.push(`%${search}%`);
    }

    if (role) {
      whereConditions.push(`role = $${params.length + 1}`);
      params.push(role);
    }

    if (status) {
      whereConditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['created_at', 'full_name', 'email', 'last_login'];
    const validatedSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const validatedSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get users
    const query = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.avatar_url,
        u.created_at,
        u.last_login,
        u.email_verified,
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') as completed_courses,
        COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'success'), 0) as total_spent
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.user_id
      LEFT JOIN transactions t ON u.id = t.user_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.${validatedSortBy} ${validatedSortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await sql.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;

    const countResult = await sql.query(
      countQuery,
      params.slice(0, -2) // Remove limit and offset
    );

    const total = parseInt(countResult.rows[0].total);

    // Format users data
    const users = result.rows.map((user) => ({
      ...user,
      total_enrollments: parseInt(user.total_enrollments),
      completed_courses: parseInt(user.completed_courses),
      total_spent: parseFloat(user.total_spent),
      password: undefined, // Never send password
    }));

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { full_name, email, password, phone, role, status, avatar_url, bio } = body;

    // Validate required fields
    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['student', 'instructor'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await sql`
      INSERT INTO users (
        full_name, email, password, phone, 
        role, status, avatar_url, bio, email_verified
      )
      VALUES (
        ${full_name}, ${email}, ${hashedPassword}, ${phone || null},
        ${role || 'student'}, ${status || 'active'}, 
        ${avatar_url || null}, ${bio || null}, true
      )
      RETURNING 
        id, full_name, email, phone, role, 
        status, avatar_url, created_at
    `;

    const user = result.rows[0];

    // Create notification for new user
    await sql`
      INSERT INTO notifications (
        user_id, title, message, type
      )
      VALUES (
        ${user.id},
        'Welcome to Our Platform',
        'Your account has been created by an administrator. Please check your email for login instructions.',
        'system'
      )
    `;

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
