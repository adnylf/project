import { NextRequest } from 'next/server';
import reviewService from '@/services/review.service';
import { updateReviewSchema } from '@/lib/validation';
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  noContentResponse,
} from '@/utils/response.util';
import { validateData } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/reviews/:id
 * Get review by ID
 */
async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const review = await reviewService.getReviewById(id);

    return successResponse(review, 'Review retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to get review', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * PUT /api/reviews/:id
 * Update review
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

    // Validate input
    const validation = await validateData(updateReviewSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Update review
    const review = await reviewService.updateReview(id, user.userId, validation.data);

    return successResponse(review, 'Review updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to update review', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * DELETE /api/reviews/:id
 * Delete review
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

    await reviewService.deleteReview(id, user.userId, user.role);

    return noContentResponse();
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to delete review', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
export const GET = (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  errorHandler((req: NextRequest) =>
    loggingMiddleware((req2: NextRequest) =>
      corsMiddleware((req3: NextRequest) => getHandler(req3, context))(req2)
    )(req)
  )(request);

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
