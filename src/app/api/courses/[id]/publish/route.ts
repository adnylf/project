import { NextRequest, NextResponse } from 'next/server';
import courseService from '@/services/course.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * POST /api/courses/:id/publish
 * Publish course (change status to PUBLISHED)
 */
async function handler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = await context.params;

    // Publish course
    const course = await courseService.publishCourse(id, user.userId, user.role);

    return successResponse(
      {
        id: course.id,
        title: course.title,
        status: course.status,
        publishedAt: course.publishedAt,
      },
      'Course published successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to publish course', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
