import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { updateProgressSchema } from '@/lib/validation';

interface RouteParams {
  params: { enrollmentId: string };
}

// GET /api/enrollments/[enrollmentId]/progress - Get enrollment progress
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { enrollmentId } = params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { progress_records: true },
    });

    if (!enrollment || enrollment.user_id !== authUser.userId) {
      return NextResponse.json({ error: 'Enrollment tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      progress: enrollment.progress,
      records: enrollment.progress_records,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/enrollments/[enrollmentId]/progress - Update progress
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { enrollmentId } = params;
    const body = await request.json();

    const result = updateProgressSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { material_id, is_completed, watched_duration, last_position } = result.data;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment || enrollment.user_id !== authUser.userId) {
      return NextResponse.json({ error: 'Enrollment tidak ditemukan' }, { status: 404 });
    }

    // Upsert progress
    const progress = await prisma.progress.upsert({
      where: {
        enrollment_id_material_id: { enrollment_id: enrollmentId, material_id },
      },
      update: {
        is_completed: is_completed ?? undefined,
        watched_duration: watched_duration ?? undefined,
        last_position: last_position ?? undefined,
        completed_at: is_completed ? new Date() : undefined,
      },
      create: {
        enrollment_id: enrollmentId,
        material_id,
        user_id: authUser.userId,
        is_completed: is_completed ?? false,
        watched_duration: watched_duration ?? 0,
        last_position: last_position ?? 0,
        completed_at: is_completed ? new Date() : undefined,
      },
    });

    // Recalculate enrollment progress
    const course = await prisma.course.findFirst({
      where: { enrollments: { some: { id: enrollmentId } } },
      include: { sections: { include: { materials: true } } },
    });

    if (course) {
      const totalMaterials = course.sections.reduce((sum, s) => sum + s.materials.length, 0);
      const completedMaterials = await prisma.progress.count({
        where: { enrollment_id: enrollmentId, is_completed: true },
      });

      const progressPercent = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;

      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          progress: progressPercent,
          last_accessed_at: new Date(),
          ...(progressPercent >= 100 && { status: 'COMPLETED', completed_at: new Date() }),
        },
      });
    }

    return NextResponse.json({ message: 'Progress diperbarui', progress });
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
