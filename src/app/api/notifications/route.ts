import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  paginatedResponse,
  successResponse,
  validationErrorResponse,
  errorResponse,
} from "@/utils/response.util";
import { validatePagination } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS, USER_ROLES } from "@/lib/constants";
import type {
  NotificationType,
  NotificationStatus,
  Prisma,
} from "@prisma/client";

/**
 * GET /api/notifications
 * Get all notifications (admin only)
 */
async function getHandler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    if (user.role !== USER_ROLES.ADMIN) {
      return errorResponse("Insufficient permissions", HTTP_STATUS.FORBIDDEN);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") as NotificationStatus | undefined;
    const type = searchParams.get("type") as NotificationType | undefined;
    const userId = searchParams.get("userId") || undefined;

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Build where clause
    const where: Prisma.NotificationWhereInput = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (userId) where.user_id = userId;

    // Calculate skip
    const skip = (validatedPagination.page - 1) * validatedPagination.limit;

    // Get notifications
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: validatedPagination.limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          user_id: true,
          type: true,
          title: true,
          message: true,
          status: true,
          data: true,
          read_at: true,
          created_at: true,
          user: {
            select: {
              full_name: true,
              email: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return paginatedResponse(
      notifications,
      {
        page: validatedPagination.page,
        limit: validatedPagination.limit,
        total,
      },
      "Notifications retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get notifications",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * POST /api/notifications
 * Send notification (admin only)
 */
async function postHandler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    if (user.role !== USER_ROLES.ADMIN) {
      return errorResponse("Insufficient permissions", HTTP_STATUS.FORBIDDEN);
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

    const { user_id, type, title, message, data } = body;

    // Validate required fields
    if (!user_id || !type || !title || !message) {
      return validationErrorResponse({
        user_id: !user_id ? ["User ID is required"] : [],
        type: !type ? ["Type is required"] : [],
        title: !title ? ["Title is required"] : [],
        message: !message ? ["Message is required"] : [],
      });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: user_id },
    });

    if (!targetUser) {
      return errorResponse("User not found", HTTP_STATUS.NOT_FOUND);
    }

    // Create notification directly
    await prisma.notification.create({
      data: {
        user_id,
        type: type as NotificationType,
        title,
        message,
        data: data || {},
        status: "UNREAD",
      },
    });

    return successResponse(
      {
        user_id,
        type,
        title,
      },
      "Notification sent successfully",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to send notification",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply authentication
const authenticatedGetHandler = requireAuth(getHandler);
const authenticatedPostHandler = requireAuth(postHandler);

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedGetHandler))
);
export const POST = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedPostHandler))
);
