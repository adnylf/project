import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * PUT /api/users/notifications/read-all
 * Mark all notifications as read
 */
async function handler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Mark all unread notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        user_id: user.userId,
        status: "UNREAD",
      },
      data: {
        status: "READ",
        read_at: new Date(),
      },
    });

    return successResponse(
      {
        markedAsRead: result.count,
      },
      "All notifications marked as read"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to mark notifications as read",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply authentication
const authenticatedHandler = requireAuth(handler);

export const PUT = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
