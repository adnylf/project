// ============================================
// PATH: src/app/api/notifications/settings/route.ts
// ============================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, validationErrorResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

// Type for notification settings
interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  courseUpdates: boolean;
  paymentNotifications: boolean;
  certificateNotifications: boolean;
  commentNotifications: boolean;
  reviewNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/notifications/settings
 * Get notification preferences
 */
async function getHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Try to get settings from userPreferences or notificationPreferences
    let settings: NotificationSettings | null = null;

    try {
      // Try userPreferences first
      const userPrefsTable = prisma as {
        userPreferences?: {
          findUnique: (args: { where: { userId: string } }) => Promise<NotificationSettings | null>;
        };
      };
      if (userPrefsTable.userPreferences) {
        settings = await userPrefsTable.userPreferences.findUnique({
          where: { userId: user.userId },
        });
      }
    } catch {
      // Silently continue
    }

    if (!settings) {
      try {
        // If that fails, try notificationPreferences
        const notifPrefsTable = prisma as {
          notificationPreferences?: {
            findUnique: (args: {
              where: { userId: string };
            }) => Promise<NotificationSettings | null>;
          };
        };
        if (notifPrefsTable.notificationPreferences) {
          settings = await notifPrefsTable.notificationPreferences.findUnique({
            where: { userId: user.userId },
          });
        }
      } catch {
        // Silently continue
      }
    }

    // Create default settings if not exists
    if (!settings) {
      const defaultSettings = {
        userId: user.userId,
        emailNotifications: true,
        pushNotifications: true,
        courseUpdates: true,
        paymentNotifications: true,
        certificateNotifications: true,
        commentNotifications: true,
        reviewNotifications: true,
      };

      try {
        // Try to create in userPreferences
        const userPrefsTable = prisma as {
          userPreferences?: {
            create: (args: { data: typeof defaultSettings }) => Promise<NotificationSettings>;
          };
        };
        if (userPrefsTable.userPreferences) {
          settings = await userPrefsTable.userPreferences.create({
            data: defaultSettings,
          });
        }
      } catch {
        // If userPreferences doesn't exist, try notificationPreferences
        try {
          const notifPrefsTable = prisma as {
            notificationPreferences?: {
              create: (args: { data: typeof defaultSettings }) => Promise<NotificationSettings>;
            };
          };
          if (notifPrefsTable.notificationPreferences) {
            settings = await notifPrefsTable.notificationPreferences.create({
              data: defaultSettings,
            });
          }
        } catch {
          return errorResponse(
            'Notification settings table not found in database schema',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
          );
        }
      }
    }

    return successResponse(settings, 'Notification settings retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get settings', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * PUT /api/notifications/settings
 * Update notification preferences
 */
async function putHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Parse request body
    const body = await request.json();
    const {
      emailNotifications,
      pushNotifications,
      courseUpdates,
      paymentNotifications,
      certificateNotifications,
      commentNotifications,
      reviewNotifications,
    } = body;

    // Validate at least one field is provided
    if (
      emailNotifications === undefined &&
      pushNotifications === undefined &&
      courseUpdates === undefined &&
      paymentNotifications === undefined &&
      certificateNotifications === undefined &&
      commentNotifications === undefined &&
      reviewNotifications === undefined
    ) {
      return validationErrorResponse({
        settings: ['At least one setting must be provided'],
      });
    }

    // Build update data with proper typing
    const updateData: Record<string, boolean> = {};
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
    if (courseUpdates !== undefined) updateData.courseUpdates = courseUpdates;
    if (paymentNotifications !== undefined) updateData.paymentNotifications = paymentNotifications;
    if (certificateNotifications !== undefined)
      updateData.certificateNotifications = certificateNotifications;
    if (commentNotifications !== undefined) updateData.commentNotifications = commentNotifications;
    if (reviewNotifications !== undefined) updateData.reviewNotifications = reviewNotifications;

    // Default values for create
    const createData = {
      userId: user.userId,
      emailNotifications: emailNotifications ?? true,
      pushNotifications: pushNotifications ?? true,
      courseUpdates: courseUpdates ?? true,
      paymentNotifications: paymentNotifications ?? true,
      certificateNotifications: certificateNotifications ?? true,
      commentNotifications: commentNotifications ?? true,
      reviewNotifications: reviewNotifications ?? true,
    };

    // Try to update or create settings
    let settings: NotificationSettings | null = null;

    try {
      // Try userPreferences first
      const userPrefsTable = prisma as {
        userPreferences?: {
          upsert: (args: {
            where: { userId: string };
            update: Record<string, boolean>;
            create: typeof createData;
          }) => Promise<NotificationSettings>;
        };
      };
      if (userPrefsTable.userPreferences) {
        settings = await userPrefsTable.userPreferences.upsert({
          where: { userId: user.userId },
          update: updateData,
          create: createData,
        });
      }
    } catch {
      // If that fails, try notificationPreferences
      try {
        const notifPrefsTable = prisma as {
          notificationPreferences?: {
            upsert: (args: {
              where: { userId: string };
              update: Record<string, boolean>;
              create: typeof createData;
            }) => Promise<NotificationSettings>;
          };
        };
        if (notifPrefsTable.notificationPreferences) {
          settings = await notifPrefsTable.notificationPreferences.upsert({
            where: { userId: user.userId },
            update: updateData,
            create: createData,
          });
        }
      } catch {
        return errorResponse(
          'Notification settings table not found in database schema',
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
      }
    }

    return successResponse(settings, 'Notification settings updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to update settings', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedGetHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return getHandler(request);
}

async function authenticatedPutHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return putHandler(request);
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(authenticatedGetHandler)));
export const PUT = errorHandler(loggingMiddleware(corsMiddleware(authenticatedPutHandler)));
