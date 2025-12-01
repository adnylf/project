// app/api/courses/[id]/enroll/route.ts
import { NextRequest } from "next/server";
import enrollmentService from "@/services/enrollment.service";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

async function handler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Extract course ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const courseId = pathSegments[pathSegments.length - 2]; // Get ID from /api/courses/[id]/enroll

    if (!courseId) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Parse request body (optional transactionId for paid courses)
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const { transactionId } = body;

    // Enroll user
    const result = await enrollmentService.enrollCourse(
      user.userId,
      courseId,
      transactionId
    );

    // PERBAIKAN: Gunakan field yang sesuai dengan return value service
    return successResponse(
      {
        enrollmentId: result.enrollment.id,
        courseId: result.enrollment.courseId, // PERBAIKAN: Gunakan course_id bukan courseId
        status: result.enrollment.status,
        progress: result.enrollment.progress,
        course: result.enrollment.course,
      },
      "Successfully enrolled in course",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes("payment")) {
        return errorResponse(error.message, HTTP_STATUS.PAYMENT_REQUIRED);
      }
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to enroll in course",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Gunakan requireAuth untuk wrap handler
const authenticatedHandler = requireAuth(handler);

export const POST = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
