import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import certificateService from '@/services/certificate.service';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const enrollmentId = params.id;

    // Get enrollment with progress
    const enrollmentResult = await sql`
      SELECT 
        e.*,
        c.title as course_title,
        c.total_modules,
        COUNT(up.id) FILTER (WHERE up.completed = true) as completed_modules,
        (COUNT(up.id) FILTER (WHERE up.completed = true)::float / 
         NULLIF(c.total_modules, 0) * 100) as progress_percentage
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN user_progress up ON up.enrollment_id = e.id
      WHERE e.id = ${enrollmentId}
      GROUP BY e.id, c.id
    `;

    if (enrollmentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const enrollment = enrollmentResult.rows[0];

    // Check authorization
    if (enrollment.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if enrollment is active
    if (enrollment.status !== 'active' && enrollment.status !== 'completed') {
      return NextResponse.json({ error: 'Enrollment is not active' }, { status: 400 });
    }

    // Check if course is 100% completed
    const progressPercentage = parseFloat(enrollment.progress_percentage || '0');
    if (progressPercentage < 100) {
      return NextResponse.json(
        {
          error: 'Course not completed',
          progress: progressPercentage,
          message: 'You must complete 100% of the course to request a certificate',
        },
        { status: 400 }
      );
    }

    // Update enrollment status to completed if not already
    if (enrollment.status !== 'completed') {
      await sql`
        UPDATE enrollments
        SET 
          status = 'completed',
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${enrollmentId}
      `;
    }

    // Check if certificate already exists
    const existing = await certificateService.getCertificateByEnrollment(
      enrollment.user_id,
      enrollment.course_id
    );

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: 'Certificate already issued',
      });
    }

    // Generate certificate
    const certificate = await certificateService.generateCertificate(
      enrollment.user_id,
      enrollment.course_id,
      new Date()
    );

    if (!certificate) {
      return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        data: certificate,
        message: 'Certificate generated successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Request certificate error:', error);
    return NextResponse.json({ error: 'Failed to request certificate' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const enrollmentId = params.id;

    // Get enrollment
    const enrollmentResult = await sql`
      SELECT * FROM enrollments
      WHERE id = ${enrollmentId}
    `;

    if (enrollmentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const enrollment = enrollmentResult.rows[0];

    // Check authorization
    if (enrollment.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get certificate if exists
    const certificate = await certificateService.getCertificateByEnrollment(
      enrollment.user_id,
      enrollment.course_id
    );

    if (!certificate) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No certificate issued yet',
      });
    }

    return NextResponse.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error('Get enrollment certificate error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificate' }, { status: 500 });
  }
}
