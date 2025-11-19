import { NextRequest, NextResponse } from 'next/server';
import commentService from '@/services/comment.service';
import { createCommentSchema } from '@/lib/validation';
import {
  paginatedResponse,
  successResponse,
  validationErrorResponse,
  errorResponse,
} from '@/utils/response.util';
import { validateData, validatePagination } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/comments/:id/replies
 * Get all replies for a comment
 */
async function getHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: commentId } = await context.params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const validatedPagination = validatePagination(page, limit);

    const result = await commentService.getCommentReplies(commentId, {
      page: validatedPagination.page,
      limit: validatedPagination.limit,
    });

    return paginatedResponse(result.data, result.meta, 'Replies retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get replies', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * POST /api/comments/:id/replies
 * Reply to a comment
 */
async function postHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id: parentId } = await context.params;

    // Get parent comment to get materialId
    const parentComment = await commentService.getCommentById(parentId);

    const body = await request.json();
    const dataWithParent = {
      ...body,
      materialId: parentComment.materialId,
      parentId,
    };

    const validation = await validateData(createCommentSchema, dataWithParent);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const reply = await commentService.createComment(user.userId, validation.data);

    return successResponse(reply, 'Reply added successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to add reply', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares
async function authenticatedPostHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return postHandler(request, context);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (request: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return getHandler(rq, context);
      })(r);
    })(request);
  })(req);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (request: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return authenticatedPostHandler(rq, context);
      })(r);
    })(request);
  })(req);
}
