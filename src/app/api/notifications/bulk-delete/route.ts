import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * DELETE /api/notifications/bulk-delete
 * Bulk delete notifications
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

    const { notificationIds } = body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return errorResponse(
        "Notification IDs required",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Delete notifications (only user's own)
    const result = await prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        user_id: user.userId,
      },
    });

    return successResponse(
      {
        deleted: result.count,
      },
      `${result.count} notification(s) deleted`
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to delete notifications",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply authentication
const authenticatedHandler = requireAuth(handler);

export const DELETE = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
