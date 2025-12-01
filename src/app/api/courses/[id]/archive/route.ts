import { NextRequest } from "next/server";
import courseService from "@/services/course.service";
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
  try {
    const { user } = context;

    // Extract course ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 2]; // Get ID from /api/courses/[id]/archive

    if (!id) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Archive course menggunakan service
    const result = await courseService.archiveCourse(
      id,
      user.userId,
      user.role
    );

    return successResponse(
      {
        id: result.id,
        title: result.title,
        status: result.status,
      },
      "Course archived successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to archive course",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Gunakan requireAuth untuk wrap handler
const authenticatedHandler = requireAuth(handler);

export const POST = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
