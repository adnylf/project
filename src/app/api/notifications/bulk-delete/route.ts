import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * DELETE /api/notifications/bulk-delete
 * Bulk delete notifications
 */
async function handler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Parse request body
    const body = await request.json();
    const { notificationIds } = body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return errorResponse('Notification IDs required', HTTP_STATUS.BAD_REQUEST);
    }

    // Delete notifications (only user's own)
    const result = await prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId: user.userId,
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
    return errorResponse('Failed to delete notifications', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request);
}

export const DELETE = errorHandler(loggingMiddleware(corsMiddleware(authenticatedHandler)));
