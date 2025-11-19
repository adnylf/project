import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, noContentResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS, USER_ROLES } from '@/lib/constants';

/**
 * PUT /api/notifications/:id
 * Update notification status
 */
async function putHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = await params;

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['UNREAD', 'READ', 'ARCHIVED'].includes(status)) {
      return errorResponse('Invalid status', HTTP_STATUS.BAD_REQUEST);
    }

    // Check notification exists
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return errorResponse('Notification not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check permission (own notification or admin)
    if (notification.userId !== user.userId && user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

    // Update notification
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        status,
        readAt: status === 'READ' ? new Date() : notification.readAt,
      },
    });

    return successResponse(
      {
        id: updated.id,
        status: updated.status,
        readAt: updated.readAt,
      },
      'Notification updated successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to update notification', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = await params;

    // Check notification exists
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return errorResponse('Notification not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check permission (own notification or admin)
    if (notification.userId !== user.userId && user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
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
    return errorResponse('Failed to delete notification', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedPutHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return putHandler(request, context);
}

async function authenticatedDeleteHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return deleteHandler(request, context);
}

// Properly typed exports
export const PUT = (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  errorHandler((req: NextRequest) =>
    loggingMiddleware((req2: NextRequest) =>
      corsMiddleware((req3: NextRequest) => authenticatedPutHandler(req3, context))(req2)
    )(req)
  )(request);

export const DELETE = (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  errorHandler((req: NextRequest) =>
    loggingMiddleware((req2: NextRequest) =>
      corsMiddleware((req3: NextRequest) => authenticatedDeleteHandler(req3, context))(req2)
    )(req)
  )(request);
