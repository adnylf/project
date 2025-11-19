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
 * GET /api/materials/:id/comments
 * Get all comments for a material
 */
async function getHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: materialId } = await context.params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const validatedPagination = validatePagination(page, limit);

    const result = await commentService.getMaterialComments(materialId, {
      page: validatedPagination.page,
      limit: validatedPagination.limit,
      sortBy,
      sortOrder,
    });

    return paginatedResponse(result.data, result.meta, 'Comments retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get comments', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * POST /api/materials/:id/comments
 * Create new comment
 */
async function postHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id: materialId } = await context.params;
    const body = await request.json();

    const dataWithMaterialId = { ...body, materialId };

    const validation = await validateData(createCommentSchema, dataWithMaterialId);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const comment = await commentService.createComment(user.userId, validation.data);

    return successResponse(comment, 'Comment added successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to add comment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
