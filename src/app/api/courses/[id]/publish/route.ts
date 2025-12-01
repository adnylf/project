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
  const { user } = context;

  try {
    // Extract course ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 2]; // Get ID from /api/courses/[id]/publish

    if (!id) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Publish course
    const result = await courseService.publishCourse(
      id,
      user.userId,
      user.role
    );

    return successResponse(
      {
        id: result.id,
        title: result.title,
        status: result.status,
        published_at: result.published_at,
      },
      "Course published successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to publish course",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Gunakan requireAuth untuk wrap handler
const authenticatedHandler = requireAuth(handler);

export const POST = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
