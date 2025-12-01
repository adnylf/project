import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  noContentResponse,
  errorResponse,
} from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS, USER_ROLES } from "@/lib/constants";

/**
 * PUT /api/notifications/:id
 * Update notification status
 */
async function putHandler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Extract notification ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 1];

    if (!id) {
      return errorResponse(
        "Notification ID is required",
        HTTP_STATUS.BAD_REQUEST
      );
    }

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

    const { status } = body;

    // Validate status
    if (!status || !["UNREAD", "READ", "ARCHIVED"].includes(status)) {
      return errorResponse("Invalid status", HTTP_STATUS.BAD_REQUEST);
    }

    // Check notification exists
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return errorResponse("Notification not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check permission (own notification or admin)
    if (
      notification.user_id !== user.userId &&
      user.role !== USER_ROLES.ADMIN
    ) {
      return errorResponse("Insufficient permissions", HTTP_STATUS.FORBIDDEN);
    }

    // Update notification
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        status,
        read_at: status === "READ" ? new Date() : notification.read_at,
      },
    });

    return successResponse(
      {
        id: updated.id,
        status: updated.status,
        read_at: updated.read_at,
      },
      "Notification updated successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to update notification",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
async function deleteHandler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Extract notification ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 1];

    if (!id) {
      return errorResponse(
        "Notification ID is required",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Check notification exists
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return errorResponse("Notification not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check permission (own notification or admin)
    if (
      notification.user_id !== user.userId &&
      user.role !== USER_ROLES.ADMIN
    ) {
      return errorResponse("Insufficient permissions", HTTP_STATUS.FORBIDDEN);
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id },
    });

    return noContentResponse();
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to delete notification",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply authentication
const authenticatedPutHandler = requireAuth(putHandler);
const authenticatedDeleteHandler = requireAuth(deleteHandler);

export const PUT = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedPutHandler))
);
export const DELETE = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedDeleteHandler))
);
