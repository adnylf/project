import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';

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
      SELECT id, status FROM users WHERE id = ${userId}
    `;

    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = existingUser.rows[0];

    // Check if user is suspended
    if (user.status !== 'suspended') {
      return NextResponse.json({ error: 'User is not suspended' }, { status: 400 });
    }

    // Activate user
    await sql`
      UPDATE users
      SET 
        status = 'active',
        suspension_reason = NULL,
        suspended_at = NULL,
        suspension_ends_at = NULL,
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    // Create notification
    await sql`
      INSERT INTO notifications (
        user_id, title, message, type
      )
      VALUES (
        ${userId},
        'Account Activated',
        'Your account has been reactivated. You can now access all features.',
        'account_activated'
      )
    `;

    // Log admin action
    await sql`
      INSERT INTO admin_action_logs (
        admin_id, action_type, target_type, target_id
      )
      VALUES (
        ${decoded.userId},
        'activate_user',
        'user',
        ${userId}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'User activated successfully',
    });
  } catch (error) {
    console.error('Activate user error:', error);
    return NextResponse.json({ error: 'Failed to activate user' }, { status: 500 });
  }
}
