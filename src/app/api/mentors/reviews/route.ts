import { NextRequest, NextResponse } from "next/server";
import mentorService from "@/services/mentor.service";
import { paginatedResponse, errorResponse } from "@/utils/response.util";
import { validatePagination } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/mentors/reviews
 * Get mentor reviews for authenticated mentor
 */
async function handler(request: NextRequest, user: any) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Get mentor profile first
    const mentor = await mentorService.getMentorByUserId(user.userId);

    // Get reviews
    const result = await mentorService.getMentorReviews(mentor.id, {
      page: validatedPagination.page,
      limit: validatedPagination.limit,
    });

    return paginatedResponse(
      result.data,
      result.meta,
      "Reviews retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get reviews",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply middlewares and export
async function authenticatedHandler(
  request: NextRequest
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  return handler(request, authResult);
}

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
