import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const courseId = params.id;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Rejection reason is required and must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Get course details
    const courseResult = await sql`
      SELECT c.*, u.full_name, u.email
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      WHERE c.id = ${courseId}
    `;

    if (courseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const course = courseResult.rows[0];

    if (course.status !== 'review') {
      return NextResponse.json(
        { error: 'Only courses in review can be rejected' },
        { status: 400 }
      );
    }

    // Reject course
    await sql`
      UPDATE courses
      SET 
        status = 'draft',
        rejection_reason = ${reason},
        rejected_at = NOW(),
        updated_at = NOW()
      WHERE id = ${courseId}
    `;

    // Create notification for instructor
    await sql`
      INSERT INTO notifications (
        user_id, title, message, type
      )
      VALUES (
        ${course.instructor_id},
        'Course Rejected',
        ${`Your course "${course.title}" has been rejected. Reason: ${reason}. Please make the necessary changes and resubmit.`},
        'course_rejected'
      )
    `;

    // Log admin action
    await sql`
      INSERT INTO admin_action_logs (
        admin_id, action_type, target_type, target_id, details
      )
      VALUES (
        ${decoded.userId},
        'reject_course',
        'course',
        ${courseId},
        ${JSON.stringify({ reason })}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Course rejected successfully',
      data: {
        course_id: courseId,
        status: 'draft',
        rejected_at: new Date(),
        rejection_reason: reason,
      },
    });
  } catch (error) {
    console.error('Reject course error:', error);
    return NextResponse.json({ error: 'Failed to reject course' }, { status: 500 });
  }
}
