import { NextRequest } from "next/server";
import mentorService from "@/services/mentor.service";
import { applyMentorSchema } from "@/lib/validation";
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
 * POST /api/mentors/apply
 * Apply to become a mentor
 */
async function handler(
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
    const validation = await validateData(applyMentorSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Handle website: convert null to undefined
    const dataToApply = {
      ...validation.data,
      website:
        validation.data.website === null ? undefined : validation.data.website,
      linkedin:
        validation.data.linkedin === null
          ? undefined
          : validation.data.linkedin,
      twitter:
        validation.data.twitter === null ? undefined : validation.data.twitter,
      portfolio:
        validation.data.portfolio === null
          ? undefined
          : validation.data.portfolio,
    };

    // Apply as mentor
    const result = await mentorService.applyAsMentor(user.userId, dataToApply);

    return successResponse(result, result.message, HTTP_STATUS.CREATED);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to submit application",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply authentication
const authenticatedHandler = requireAuth(handler);

export const POST = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
