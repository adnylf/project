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

    const mentorId = params.id;

    // Parse request body
    const body = await request.json();
    const { reason } = body;

    // Validate rejection reason
    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Rejection reason is required and must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Check if mentor profile exists
    const mentorResult = await sql`
      SELECT mp.*, u.full_name, u.email
      FROM mentor_profiles mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.id = ${mentorId}
    `;

    if (mentorResult.rows.length === 0) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    const mentor = mentorResult.rows[0];

    // Check if status is pending
    if (mentor.status !== 'pending') {
      return NextResponse.json({ error: 'Can only reject pending applications' }, { status: 400 });
    }

    // Reject mentor profile
    await sql`
      UPDATE mentor_profiles
      SET 
        status = 'rejected',
        rejected_at = NOW(),
        rejection_reason = ${reason},
        approved_at = NULL,
        updated_at = NOW()
      WHERE id = ${mentorId}
    `;

    // Create notification for user
    await sql`
      INSERT INTO notifications (
        user_id, title, message, type
      )
      VALUES (
        ${mentor.user_id},
        'Mentor Application Rejected',
        ${`Your mentor application has been reviewed. Reason: ${reason}. You can update your application and reapply.`},
        'mentor_rejected'
      )
    `;

    // Log admin action
    await sql`
      INSERT INTO admin_action_logs (
        admin_id, action_type, target_type, target_id, details
      )
      VALUES (
        ${decoded.userId},
        'reject_mentor',
        'mentor_profile',
        ${mentorId},
        ${JSON.stringify({ reason })}
      )
    `;

    // TODO: Send rejection email
    // await emailService.sendMentorRejectedEmail(mentor.email, mentor.full_name, reason);

    return NextResponse.json({
      success: true,
      message: 'Mentor application rejected',
      data: {
        mentor_id: mentorId,
        user_id: mentor.user_id,
        status: 'rejected',
        rejected_at: new Date(),
        rejection_reason: reason,
      },
    });
  } catch (error) {
    console.error('Reject mentor error:', error);
    return NextResponse.json({ error: 'Failed to reject mentor application' }, { status: 500 });
  }
}
