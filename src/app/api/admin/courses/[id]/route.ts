import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';

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

    const courseId = params.id;

    // Get course details with full information
    const result = await sql`
      SELECT 
        c.*,
        cat.name as category_name,
        u.full_name as instructor_name,
        u.email as instructor_email,
        u.avatar_url as instructor_avatar,
        COUNT(DISTINCT e.id) as enrollment_count,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') as active_enrollment_count,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') as completed_enrollment_count,
        COUNT(DISTINCT r.id) as review_count,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(DISTINCT cm.id) as module_count,
        COUNT(DISTINCT cm.id) FILTER (WHERE cm.is_published = true) as published_module_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN reviews r ON c.id = r.course_id
      LEFT JOIN course_modules cm ON c.id = cm.course_id
      WHERE c.id = ${courseId}
      GROUP BY c.id, cat.id, u.id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const course = result.rows[0];

    // Get course modules
    const modulesResult = await sql`
      SELECT 
        id, title, description, order_index, 
        duration_minutes, is_published, created_at
      FROM course_modules
      WHERE course_id = ${courseId}
      ORDER BY order_index ASC
    `;

    course.modules = modulesResult.rows;

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Get course details error:', error);
    return NextResponse.json({ error: 'Failed to fetch course details' }, { status: 500 });
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

    const courseId = params.id;

    // Check if course exists
    const existingCourse = await sql`
      SELECT id FROM courses WHERE id = ${courseId}
    `;

    if (existingCourse.rows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      short_description,
      category_id,
      level,
      language,
      price,
      discount_price,
      thumbnail_url,
      preview_video_url,
      is_active,
      is_featured,
      status,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (short_description !== undefined) {
      updates.push(`short_description = $${paramCount++}`);
      values.push(short_description);
    }

    if (category_id !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(category_id);
    }

    if (level !== undefined) {
      updates.push(`level = $${paramCount++}`);
      values.push(level);
    }

    if (language !== undefined) {
      updates.push(`language = $${paramCount++}`);
      values.push(language);
    }

    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }

    if (discount_price !== undefined) {
      updates.push(`discount_price = $${paramCount++}`);
      values.push(discount_price);
    }

    if (thumbnail_url !== undefined) {
      updates.push(`thumbnail_url = $${paramCount++}`);
      values.push(thumbnail_url);
    }

    if (preview_video_url !== undefined) {
      updates.push(`preview_video_url = $${paramCount++}`);
      values.push(preview_video_url);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (is_featured !== undefined) {
      updates.push(`is_featured = $${paramCount++}`);
      values.push(is_featured);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);

    // Execute update
    values.push(courseId);
    const query = `
      UPDATE courses
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await sql.query(query, values);

    // Log admin action
    await sql`
      INSERT INTO admin_action_logs (
        admin_id, action_type, target_type, target_id, details
      )
      VALUES (
        ${decoded.userId},
        'update_course',
        'course',
        ${courseId},
        ${JSON.stringify(body)}
      )
    `;

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Course updated successfully',
    });
  } catch (error) {
    console.error('Update course error:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
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

    const courseId = params.id;

    // Check if course exists
    const existingCourse = await sql`
      SELECT id FROM courses WHERE id = ${courseId}
    `;

    if (existingCourse.rows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if course has enrollments
    const enrollmentCount = await sql`
      SELECT COUNT(*) as count FROM enrollments WHERE course_id = ${courseId}
    `;

    if (parseInt(enrollmentCount.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with active enrollments' },
        { status: 400 }
      );
    }

    // Soft delete: Update status to deleted
    await sql`
      UPDATE courses
      SET 
        status = 'deleted',
        is_active = false,
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = ${courseId}
    `;

    // Log admin action
    await sql`
      INSERT INTO admin_action_logs (
        admin_id, action_type, target_type, target_id
      )
      VALUES (
        ${decoded.userId},
        'delete_course',
        'course',
        ${courseId}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
