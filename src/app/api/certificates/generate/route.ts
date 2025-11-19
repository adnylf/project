import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import certificateService from '@/services/certificate.service';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { enrollment_id } = body;

    if (!enrollment_id) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    // Get enrollment details
    const enrollmentResult = await sql`
      SELECT 
        e.*,
        c.title as course_title,
        c.duration_hours
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = ${enrollment_id}
    `;

    if (enrollmentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const enrollment = enrollmentResult.rows[0];

    // Check authorization
    if (enrollment.user_id !== decoded.userId && decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if course is completed
    if (enrollment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Course must be completed to generate certificate' },
        { status: 400 }
      );
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
        message: 'Certificate already exists',
      });
    }

    // Generate certificate
    const certificate = await certificateService.generateCertificate(
      enrollment.user_id,
      enrollment.course_id,
      enrollment.completed_at || new Date()
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
    console.error('Generate certificate error:', error);
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
  }
}
