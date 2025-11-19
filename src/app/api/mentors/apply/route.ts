import { NextRequest } from 'next/server';
import mentorService from '@/services/mentor.service';
import { applyMentorSchema } from '@/lib/validation';
import { successResponse, validationErrorResponse, errorResponse } from '@/utils/response.util';
import { validateData } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * POST /api/mentors/apply
 * Apply to become a mentor
 */
async function handler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = await validateData(applyMentorSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Handle website: convert null to undefined
    const dataToApply = {
      ...validation.data,
      website: validation.data.website === null ? undefined : validation.data.website,
      linkedin: validation.data.linkedin === null ? undefined : validation.data.linkedin,
      twitter: validation.data.twitter === null ? undefined : validation.data.twitter,
      portfolio: validation.data.portfolio === null ? undefined : validation.data.portfolio,
    };

    // Apply as mentor
    const result = await mentorService.applyAsMentor(user.userId, dataToApply);

    return successResponse(result, result.message, HTTP_STATUS.CREATED);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to submit application', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request);
}

export const POST = errorHandler(loggingMiddleware(corsMiddleware(authenticatedHandler)));
