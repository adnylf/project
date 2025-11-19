import { NextRequest, NextResponse } from 'next/server';
import certificateService from '@/services/certificate.service';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const certificateId = params.id;

    // Get certificate details
    const certificate = await certificateService.getCertificateById(certificateId);

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Public access to certificate details (for verification)
    return NextResponse.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error('GET certificate error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificate' }, { status: 500 });
  }
}
