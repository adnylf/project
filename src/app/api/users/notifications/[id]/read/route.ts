import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * PUT /api/users/notifications/:id/read
 * Mark notification as read
 */
async function handler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Extract notification ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 2]; // Get ID from /api/users/notifications/[id]/read

    if (!id) {
      return errorResponse(
        "Notification ID is required",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        user_id: user.userId,
      },
    });

    if (!notification) {
      return errorResponse("Notification not found", HTTP_STATUS.NOT_FOUND);
    }

    // Mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        status: "READ",
        read_at: new Date(),
      },
    });

    return successResponse(
      {
        id: updatedNotification.id,
        status: updatedNotification.status,
        read_at: updatedNotification.read_at,
      },
      "Notification marked as read"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to mark notification as read",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply authentication
const authenticatedHandler = requireAuth(handler);

export const PUT = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
