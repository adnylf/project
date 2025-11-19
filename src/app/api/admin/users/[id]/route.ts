// ============================================
// FILE: src/app/api/admin/users/[id]/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

interface UserStatistics {
  total_enrollments: string;
  active_enrollments: string;
  completed_courses: string;
  total_transactions: string;
  total_spent: string;
  courses_created: string;
  reviews_written: string;
  avg_rating_given: string;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date;
  updated_at: Date;
  password?: string;
  total_enrollments: string;
  active_enrollments: string;
  completed_courses: string;
  total_transactions: string;
  total_spent: string;
  courses_created: string;
  reviews_written: string;
  avg_rating_given: string;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const userId = params.id;

    // Get user details with statistics
    const result = await sql`
      SELECT 
        u.*,
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') as active_enrollments,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') as completed_courses,
        COUNT(DISTINCT t.id) as total_transactions,
        COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'success'), 0) as total_spent,
        COUNT(DISTINCT c.id) as courses_created,
        COUNT(DISTINCT r.id) as reviews_written,
        COALESCE(AVG(r.rating), 0) as avg_rating_given
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.user_id
      LEFT JOIN transactions t ON u.id = t.user_id
      LEFT JOIN courses c ON u.id = c.instructor_id
      LEFT JOIN reviews r ON u.id = r.user_id
      WHERE u.id = ${userId}
      GROUP BY u.id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0] as UserRow;

    // Remove password from response
    delete user.password;

    // Format statistics - Fixed: Properly access properties from user object
    const statistics = {
      total_enrollments: parseInt(user.total_enrollments),
      active_enrollments: parseInt(user.active_enrollments),
      completed_courses: parseInt(user.completed_courses),
      total_transactions: parseInt(user.total_transactions),
      total_spent: parseFloat(user.total_spent),
      courses_created: parseInt(user.courses_created),
      reviews_written: parseInt(user.reviews_written),
      avg_rating_given: parseFloat(user.avg_rating_given).toFixed(1),
    };

    // Create response object without statistics properties
    const {
      total_enrollments,
      active_enrollments,
      completed_courses,
      total_transactions,
      total_spent,
      courses_created,
      reviews_written,
      avg_rating_given,
      ...userWithoutStats
    } = user;

    const userWithStats = {
      ...userWithoutStats,
      statistics,
    };

    return NextResponse.json({
      success: true,
      data: userWithStats,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const userId = params.id;

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `;

    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { full_name, email, password, phone, role, status, avatar_url, bio } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number)[] = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(full_name);
    }

    if (email !== undefined) {
      // Check if email is already taken by another user
      const emailCheck = await sql`
        SELECT id FROM users 
        WHERE email = ${email} AND id != ${userId}
      `;

      if (emailCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }

      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }

    if (role !== undefined) {
      const validRoles = ['student', 'instructor'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }

    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);

    // Execute update
    values.push(userId);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id, full_name, email, phone, role, 
        status, avatar_url, bio, created_at, updated_at
    `;

    const result = await sql.query(query, values);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const userId = params.id;

    // Check if user exists
    const existingUser = await sql`
      SELECT id, role FROM users WHERE id = ${userId}
    `;

    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting admin users
    if (existingUser.rows[0].role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 400 });
    }

    // Soft delete: Update status to deleted
    await sql`
      UPDATE users
      SET 
        status = 'deleted',
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    // Also deactivate all enrollments
    await sql`
      UPDATE enrollments
      SET status = 'inactive'
      WHERE user_id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
