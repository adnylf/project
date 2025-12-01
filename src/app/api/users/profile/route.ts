import { NextRequest } from "next/server";
import { updateProfileSchema } from "@/lib/validation";
import authService from "@/services/auth.service";
import userService from "@/services/user.service";
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
} from "@/utils/response.util";
import { validateData } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/users/profile
 * Get current user profile
 */
async function getHandler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Get full user profile
    const profile = await authService.getCurrentUser(user.userId);

    return successResponse(profile, "Profile retrieved successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get profile",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * PUT /api/users/profile
 * Update current user profile
 */
async function putHandler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(
        "Invalid JSON in request body",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate input
    const validation = await validateData(updateProfileSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Update profile
    const updatedProfile = await userService.updateUser(
      user.userId,
      validation.data
    );

    return successResponse(updatedProfile, "Profile updated successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to update profile",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply authentication
const authenticatedGetHandler = requireAuth(getHandler);
const authenticatedPutHandler = requireAuth(putHandler);

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedGetHandler))
);
export const PUT = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedPutHandler))
);
