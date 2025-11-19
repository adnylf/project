import { NextRequest, NextResponse } from 'next/server';
import enrollmentService from '@/services/enrollment.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * POST /api/courses/:id/enroll
 * Enroll in course (free or paid)
 */
async function handler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id: courseId } = await context.params;

    // Parse request body (optional transactionId for paid courses)
    const body = await request.json().catch(() => ({}));
    const { transactionId } = body;

    // Enroll user
    const enrollment = await enrollmentService.enrollCourse(user.userId, courseId, transactionId);

    return successResponse(
      {
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        status: enrollment.status,
        progress: enrollment.progress,
        course: enrollment.course,
      },
      'Successfully enrolled in course',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('payment')) {
        return errorResponse(error.message, HTTP_STATUS.PAYMENT_REQUIRED);
      }
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to enroll in course', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
    return loggingMiddleware(async (req: NextRequest) => {
      return corsMiddleware(async (r: NextRequest) => {
        return authenticatedHandler(r, context);
      })(req);
    })(request);
  })(req);
}
