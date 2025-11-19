import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // FIXED: Check your Prisma schema for the correct model name
    // If your schema uses "CertificateTemplate" (PascalCase), use:
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            // FIXED: Make sure this relation name matches your schema
            Certificate: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, design, variables, isDefault } = body;

    if (isDefault) {
      await prisma.certificateTemplate.updateMany({
        where: {
          isDefault: true,
          id: { not: params.id },
        },
        data: { isDefault: false },
      });
    }

    const template = await prisma.certificateTemplate.update({
      where: { id: params.id },
      data: {
        name,
        description,
        design,
        variables,
        isDefault,
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Template updated successfully',
    });
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // FIXED: Check the field name in your Certificate model that references CertificateTemplate
    // Common field names: templateId, certificateTemplateId, template_id
    const count = await prisma.certificate.count({
      where: {
        // Choose ONE of these based on your schema:
        templateId: params.id, // if your schema uses "templateId"
        // certificateTemplateId: params.id,  // if your schema uses "certificateTemplateId"
      },
    });

    if (count > 0) {
      return NextResponse.json({ error: 'Cannot delete template in use' }, { status: 400 });
    }

    await prisma.certificateTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
