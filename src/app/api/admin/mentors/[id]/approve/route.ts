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

    // Check if already approved
    if (mentor.status === 'approved') {
      return NextResponse.json({ error: 'Mentor already approved' }, { status: 400 });
    }

    // Check if status is pending
    if (mentor.status !== 'pending') {
      return NextResponse.json({ error: 'Can only approve pending applications' }, { status: 400 });
    }

    // Approve mentor profile
    await sql`
      UPDATE mentor_profiles
      SET 
        status = 'approved',
        approved_at = NOW(),
        rejected_at = NULL,
        rejection_reason = NULL,
        updated_at = NOW()
      WHERE id = ${mentorId}
    `;

    // Update user role to instructor
    await sql`
      UPDATE users
      SET role = 'instructor', updated_at = NOW()
      WHERE id = ${mentor.user_id}
    `;

    // Create notification for user
    await sql`
      INSERT INTO notifications (
        user_id, title, message, type
      )
      VALUES (
        ${mentor.user_id},
        'Mentor Application Approved',
        'Congratulations! Your mentor application has been approved. You can now start creating courses.',
        'mentor_approved'
      )
    `;

    // Log admin action
    await sql`
      INSERT INTO admin_action_logs (
        admin_id, action_type, target_type, target_id
      )
      VALUES (
        ${decoded.userId},
        'approve_mentor',
        'mentor_profile',
        ${mentorId}
      )
    `;

    // TODO: Send approval email
    // await emailService.sendMentorApprovedEmail(mentor.email, mentor.full_name);

    return NextResponse.json({
      success: true,
      message: 'Mentor application approved successfully',
      data: {
        mentor_id: mentorId,
        user_id: mentor.user_id,
        status: 'approved',
        approved_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Approve mentor error:', error);
    return NextResponse.json({ error: 'Failed to approve mentor application' }, { status: 500 });
  }
}
