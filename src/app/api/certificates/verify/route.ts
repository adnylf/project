import { NextRequest, NextResponse } from 'next/server';
import certificateService from '@/services/certificate.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { certificate_number, verification_code } = body;

    if (!certificate_number || !verification_code) {
      return NextResponse.json(
        { error: 'Certificate number and verification code are required' },
        { status: 400 }
      );
    }

    const result = await certificateService.verifyCertificate(
      certificate_number,
      verification_code
    );

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: result.message,
        },
        { status: 200 }
      );
    }

    // Type guard to ensure certificate exists
    if (!result.certificate) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: 'Certificate not found',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: result.message,
      data: {
        userName: result.certificate.user_name, // Diubah dari userName ke user_name
        courseTitle: result.certificate.course_title, // Diubah dari courseTitle ke course_title
        issuedAt: result.certificate.issued_at, // Diubah dari issuedAt ke issued_at
        completedAt: result.certificate.completed_at, // Diubah dari completedAt ke completed_at
      },
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
