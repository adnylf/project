import { NextRequest } from 'next/server';
import commentService from '@/services/comment.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * POST /api/comments/report
 * Report inappropriate comment
 */
async function reportHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const body = await request.json();
    const { commentId, reason } = body;

    if (!commentId || !reason) {
      return errorResponse('Comment ID and reason are required', HTTP_STATUS.BAD_REQUEST);
    }

    if (reason.trim().length < 10) {
      return errorResponse('Reason must be at least 10 characters', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await commentService.reportComment(commentId, user.userId, reason);

    return successResponse(result, result.message);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to report comment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function authenticatedHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return reportHandler(request);
}

export const POST = errorHandler(loggingMiddleware(corsMiddleware(authenticatedHandler)));
