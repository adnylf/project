import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import enrollmentService from '@/services/enrollment.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

async function handler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id: materialId } = await context.params;

    const body = await request.json();
    const { watchedDuration, lastPosition, isCompleted } = body;

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        section: {
          select: { courseId: true },
        },
      },
    });

    if (!material) {
      return errorResponse('Material not found', HTTP_STATUS.NOT_FOUND);
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.userId,
          courseId: material.section.courseId,
        },
      },
    });

    if (!enrollment) {
      return errorResponse('You must be enrolled to track progress', HTTP_STATUS.FORBIDDEN);
    }

    const progress = await prisma.progress.upsert({
      where: {
        enrollmentId_materialId: {
          enrollmentId: enrollment.id,
          materialId,
        },
      },
      update: {
        watchedDuration: watchedDuration ?? undefined,
        lastPosition: lastPosition ?? undefined,
        isCompleted: isCompleted ?? undefined,
        completedAt: isCompleted ? new Date() : undefined,
      },
      create: {
        enrollmentId: enrollment.id,
        materialId,
        userId: user.userId,
        watchedDuration: watchedDuration || 0,
        lastPosition: lastPosition || 0,
        isCompleted: isCompleted || false,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    await enrollmentService.updateEnrollmentProgress(enrollment.id);

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { lastAccessedAt: new Date() },
    });

    return successResponse(
      {
        progressId: progress.id,
        materialId: progress.materialId,
        watchedDuration: progress.watchedDuration,
        lastPosition: progress.lastPosition,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
      },
      'Progress updated successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to update progress', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function authenticatedHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (request: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return authenticatedHandler(rq, context);
      })(r);
    })(request);
  })(req);
}
