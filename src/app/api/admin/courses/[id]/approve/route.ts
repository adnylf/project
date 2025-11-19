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

    const courseId = params.id;

    // Check if course exists
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

    // Check if course is in review status
    if (course.status !== 'review') {
      return NextResponse.json(
        { error: 'Only courses in review can be approved' },
        { status: 400 }
      );
    }

    // Validate course has required content
    const moduleCount = await sql`
      SELECT COUNT(*) as count FROM course_modules WHERE course_id = ${courseId}
    `;

    if (parseInt(moduleCount.rows[0].count) === 0) {
      return NextResponse.json({ error: 'Course must have at least one module' }, { status: 400 });
    }

    // Approve course
    await sql`
      UPDATE courses
      SET 
        status = 'published',
        is_active = true,
        published_at = NOW(),
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
        'Course Approved',
        'Congratulations! Your course "${course.title}" has been approved and is now published.',
        'course_approved'
      )
    `;

    // Log admin action
    await sql`
      INSERT INTO admin_action_logs (
        admin_id, action_type, target_type, target_id
      )
      VALUES (
        ${decoded.userId},
        'approve_course',
        'course',
        ${courseId}
      )
    `;

    // TODO: Send approval email
    // await emailService.sendCourseApprovedEmail(course.email, course.full_name, course.title);

    return NextResponse.json({
      success: true,
      message: 'Course approved and published successfully',
      data: {
        course_id: courseId,
        status: 'published',
        published_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Approve course error:', error);
    return NextResponse.json({ error: 'Failed to approve course' }, { status: 500 });
  }
}
