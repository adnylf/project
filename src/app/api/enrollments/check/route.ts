import { NextRequest, NextResponse } from "next/server";
import enrollmentService from "@/services/enrollment.service";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * POST /api/enrollments/check
 * Check enrollment status for a course
 */
async function handler(
  request: NextRequest,
  user: { userId: string; email: string; role: string }
) {
  try {
    // Parse request body
    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Check enrollment status
    const status = await enrollmentService.checkEnrollmentStatus(
      user.userId,
      courseId
    );

    return successResponse(status, "Enrollment status retrieved successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to check enrollment status",
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
  // PERBAIKAN: Langsung gunakan authResult sebagai user
  return handler(request, authResult);
}

export const POST = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
