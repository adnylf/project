import { NextRequest, NextResponse } from 'next/server';
import certificateService from '@/services/certificate.service';
import { verifyToken } from '@/lib/auth';

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

    const certificateId = params.id;

    // Get certificate
    const certificate = await certificateService.getCertificateById(certificateId);

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Check authorization
    if (certificate.user_id !== decoded.userId && decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if certificate is valid
    if (!certificate.is_valid) {
      return NextResponse.json({ error: 'Certificate has been revoked' }, { status: 400 });
    }

    // Check if PDF exists
    if (!certificate.pdf_url) {
      return NextResponse.json(
        { error: 'Certificate PDF is not available yet. Please try again later.' },
        { status: 404 }
      );
    }

    // Redirect to PDF URL or stream the PDF
    // For now, return the URL
    return NextResponse.json({
      success: true,
      data: {
        download_url: certificate.pdf_url,
        certificate_number: certificate.certificate_number,
      },
    });

    // Alternative: Stream the PDF directly
    // const pdfResponse = await fetch(certificate.pdf_url);
    // const pdfBuffer = await pdfResponse.arrayBuffer();
    // return new NextResponse(pdfBuffer, {
    //   headers: {
    //     'Content-Type': 'application/pdf',
    //     'Content-Disposition': `attachment; filename="certificate-${certificate.certificate_number}.pdf"`,
    //   },
    // });
  } catch (error) {
    console.error('Download certificate error:', error);
    return NextResponse.json({ error: 'Failed to download certificate' }, { status: 500 });
  }
}
