import { NextRequest } from 'next/server';
import enrollmentService from '@/services/enrollment.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * POST /api/enrollments/check
 * Check enrollment status for a course
 */
async function handler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Parse request body
    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return errorResponse('Course ID is required', HTTP_STATUS.BAD_REQUEST);
    }

    // Check enrollment status
    const status = await enrollmentService.checkEnrollmentStatus(user.userId, courseId);

    return successResponse(status, 'Enrollment status retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to check enrollment status', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request);
}

export const POST = errorHandler(loggingMiddleware(corsMiddleware(authenticatedHandler)));
