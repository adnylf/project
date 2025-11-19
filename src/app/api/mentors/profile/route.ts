import { NextRequest } from 'next/server';
import mentorService from '@/services/mentor.service';
import { updateMentorProfileSchema } from '@/lib/validation';
import { successResponse, validationErrorResponse, errorResponse } from '@/utils/response.util';
import { validateData } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/mentors/profile
 * Get mentor profile for authenticated user
 */
async function getHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Get mentor profile
    const profile = await mentorService.getMentorByUserId(user.userId);

    return successResponse(profile, 'Mentor profile retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to get mentor profile', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * PUT /api/mentors/profile
 * Update mentor profile
 */
async function putHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = await validateData(updateMentorProfileSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Handle all nullable fields - convert null to undefined
    const cleanedData = Object.entries(validation.data).reduce((acc, [key, value]) => {
      acc[key] = value === null ? undefined : value;
      return acc;
    }, {} as Record<string, unknown>);

    // Update profile
    const updated = await mentorService.updateMentorProfile(user.userId, cleanedData);

    return successResponse(updated, 'Mentor profile updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to update mentor profile', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedGetHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return getHandler(request);
}

async function authenticatedPutHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return putHandler(request);
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(authenticatedGetHandler)));
export const PUT = errorHandler(loggingMiddleware(corsMiddleware(authenticatedPutHandler)));
