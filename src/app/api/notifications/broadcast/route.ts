import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, validationErrorResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS, USER_ROLES } from '@/lib/constants';
import type { NotificationType, UserRole, Prisma } from '@prisma/client';

/**
 * POST /api/notifications/broadcast
 * Send notification to all users (admin only)
 */
async function handler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user || user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

    // Parse request body
    const body = await request.json();
    const { type, title, message, data, userRole } = body;

    // Validate required fields
    if (!type || !title || !message) {
      return validationErrorResponse({
        type: !type ? ['Type is required'] : [],
        title: !title ? ['Title is required'] : [],
        message: !message ? ['Message is required'] : [],
      });
    }

    // Build where clause for users
    const where: Prisma.UserWhereInput = { status: 'ACTIVE' };
    if (userRole) {
      where.role = userRole as UserRole;
    }

    // Get all active users
    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    // Create notifications for all users
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: type as NotificationType,
        title,
        message,
        data: data || {},
        status: 'UNREAD',
      })),
    });

    return successResponse(
      {
        sentTo: users.length,
        type,
        title,
      },
      `Notification broadcast to ${users.length} user(s)`,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to broadcast notification', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request);
}

export const POST = errorHandler(loggingMiddleware(corsMiddleware(authenticatedHandler)));
