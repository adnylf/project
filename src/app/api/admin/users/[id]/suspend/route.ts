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

    // Parse request body
    const body = await request.json();
    const { reason, duration_days } = body;

    // Check if user exists
    const existingUser = await sql`
      SELECT id, role, status, full_name, email
      FROM users 
      WHERE id = ${userId}
    `;

    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = existingUser.rows[0];

    // Prevent suspending admin users
    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Cannot suspend admin users' }, { status: 400 });
    }

    // Check if already suspended
    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'User is already suspended' }, { status: 400 });
    }

    // Calculate suspension end date
    let suspensionEndsAt = null;
    if (duration_days) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(duration_days));
      suspensionEndsAt = endDate;
    }

    // Suspend user
    await sql`
      UPDATE users
      SET 
        status = 'suspended',
        suspension_reason = ${reason || 'Suspended by administrator'},
        suspended_at = NOW(),
        suspension_ends_at = ${suspensionEndsAt?.toISOString() || null},
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
        'Account Suspended',
        ${`Your account has been suspended. Reason: ${reason || 'Administrative decision'}. ${
          duration_days
            ? `This suspension will last for ${duration_days} days.`
            : 'Please contact support for more information.'
        }`},
        'account_suspended'
      )
    `;

    // Log admin action
    await sql`
      INSERT INTO admin_action_logs (
        admin_id, action_type, target_type, 
        target_id, details
      )
      VALUES (
        ${decoded.userId},
        'suspend_user',
        'user',
        ${userId},
        ${JSON.stringify({ reason, duration_days })}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'User suspended successfully',
      data: {
        user_id: userId,
        suspended_until: suspensionEndsAt,
      },
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 });
  }
}
