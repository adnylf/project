import { NextRequest } from "next/server";
import videoService from "@/services/video.service";
import {
  successResponse,
  errorResponse,
  noContentResponse,
} from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/videos/:id
 * Get video metadata
 */
async function getHandler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Extract video ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 1];

    if (!id) {
      return errorResponse("Video ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Get video
    const video = await videoService.getVideoById(id);

    if (!video) {
      return errorResponse("Video not found", HTTP_STATUS.NOT_FOUND);
    }

    return successResponse(video, "Video metadata retrieved successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse(
      "Failed to get video",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * DELETE /api/videos/:id
 * Delete video and all related files
 */
async function deleteHandler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Extract video ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 1];

    if (!id) {
      return errorResponse("Video ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Delete video
    await videoService.deleteVideo(id);

    return noContentResponse();
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to delete video",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply authentication
const authenticatedGetHandler = requireAuth(getHandler);
const authenticatedDeleteHandler = requireAuth(deleteHandler);

// Export handlers
export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedGetHandler))
);

export const DELETE = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedDeleteHandler))
);
