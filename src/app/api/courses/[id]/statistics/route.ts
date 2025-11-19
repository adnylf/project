import { NextRequest, NextResponse } from 'next/server';
import courseService from '@/services/course.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS, USER_ROLES } from '@/lib/constants';
import prisma from '@/lib/prisma';

/**
 * GET /api/courses/:id/statistics
 * Get course statistics (mentor/admin only)
 */
async function handler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id: courseId } = await context.params;

    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { mentor: true },
    });

    if (!course) {
      return errorResponse('Course not found', HTTP_STATUS.NOT_FOUND);
    }

    // Only mentor owner or admin can view statistics
    if (user.role !== USER_ROLES.ADMIN && course.mentor.userId !== user.userId) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

    // Get statistics
    const statistics = await courseService.getCourseStatistics(courseId);

    return successResponse(statistics, 'Course statistics retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get statistics', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request, context);
}

export async function GET(
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
