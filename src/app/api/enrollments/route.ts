import { NextRequest, NextResponse } from "next/server";
import enrollmentService from "@/services/enrollment.service";
import { paginatedResponse, errorResponse } from "@/utils/response.util";
import { validatePagination } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";
import type { EnrollmentStatus } from "@prisma/client";

/**
 * GET /api/enrollments
 * Get user's enrollments
 */
async function handler(request: NextRequest, user: any) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") as EnrollmentStatus | undefined;

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Get enrollments
    const result = await enrollmentService.getUserEnrollments(user.userId, {
      page: validatedPagination.page,
      limit: validatedPagination.limit,
      status,
    });

    return paginatedResponse(
      result.data,
      result.meta,
      "Enrollments retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get enrollments",
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
