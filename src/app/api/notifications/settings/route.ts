import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
} from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

// Type for notification settings
interface NotificationSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  course_updates: boolean;
  payment_notifications: boolean;
  certificate_notifications: boolean;
  comment_notifications: boolean;
  review_notifications: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * GET /api/notifications/settings
 * Get notification preferences
 */
async function getHandler(
  request: NextRequest,
  { user }: { user: { userId: string; email: string; role: string } }
) {
  try {
    // Try to get settings from notification_settings table
    let settings = await prisma.notificationSettings.findUnique({
      where: { user_id: user.userId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          user_id: user.userId,
          email_notifications: true,
          push_notifications: true,
          course_updates: true,
          payment_notifications: true,
          certificate_notifications: true,
          comment_notifications: true,
          review_notifications: true,
        },
      });
    }

    return successResponse(
      settings,
      "Notification settings retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get settings",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * PUT /api/notifications/settings
 * Update notification preferences
 */
async function putHandler(
  request: NextRequest,
  { user }: { user: { userId: string; email: string; role: string } }
) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      email_notifications,
      push_notifications,
      course_updates,
      payment_notifications,
      certificate_notifications,
      comment_notifications,
      review_notifications,
    } = body;

    // Validate at least one field is provided
    if (
      email_notifications === undefined &&
      push_notifications === undefined &&
      course_updates === undefined &&
      payment_notifications === undefined &&
      certificate_notifications === undefined &&
      comment_notifications === undefined &&
      review_notifications === undefined
    ) {
      return validationErrorResponse({
        settings: ["At least one setting must be provided"],
      });
    }

    // Build update data
    const updateData: any = {};
    if (email_notifications !== undefined)
      updateData.email_notifications = email_notifications;
    if (push_notifications !== undefined)
      updateData.push_notifications = push_notifications;
    if (course_updates !== undefined)
      updateData.course_updates = course_updates;
    if (payment_notifications !== undefined)
      updateData.payment_notifications = payment_notifications;
    if (certificate_notifications !== undefined)
      updateData.certificate_notifications = certificate_notifications;
    if (comment_notifications !== undefined)
      updateData.comment_notifications = comment_notifications;
    if (review_notifications !== undefined)
      updateData.review_notifications = review_notifications;

    // Update or create settings
    const settings = await prisma.notificationSettings.upsert({
      where: { user_id: user.userId },
      update: updateData,
      create: {
        user_id: user.userId,
        email_notifications: email_notifications ?? true,
        push_notifications: push_notifications ?? true,
        course_updates: course_updates ?? true,
        payment_notifications: payment_notifications ?? true,
        certificate_notifications: certificate_notifications ?? true,
        comment_notifications: comment_notifications ?? true,
        review_notifications: review_notifications ?? true,
      },
    });

    return successResponse(
      settings,
      "Notification settings updated successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to update settings",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply middlewares dan export
const authenticatedGetHandler = requireAuth(getHandler);
const authenticatedPutHandler = requireAuth(putHandler);

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedGetHandler))
);
export const PUT = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedPutHandler))
);
