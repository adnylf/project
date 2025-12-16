import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// GET /api/users/enrollments - Get user's enrollments
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      user_id: authUser.userId,
    };

    if (status) where.status = status;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              total_duration: true,
              total_lectures: true,
              mentor: {
                select: {
                  user: { select: { full_name: true, avatar_url: true } },
                },
              },
            },
          },
          certificate: {
            select: {
              id: true,
              certificate_number: true,
              status: true,
              issued_at: true,
            },
          },
          progress_records: {
            select: {
              id: true,
              material_id: true,
              is_completed: true,
              watched_duration: true,
              last_position: true,
            },
          },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return NextResponse.json({
      enrollments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
