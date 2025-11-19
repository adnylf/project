import { NextRequest } from 'next/server';
import reviewService from '@/services/review.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * POST /api/reviews/:id/helpful
 * Mark review as helpful
 */
async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const review = await reviewService.markHelpful(id);

    return successResponse(
      {
        reviewId: review.id,
        helpfulCount: review.helpfulCount,
      },
      'Marked as helpful'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to mark as helpful', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Properly typed export
export const POST = (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  errorHandler((req: NextRequest) =>
    loggingMiddleware((req2: NextRequest) =>
      corsMiddleware((req3: NextRequest) => handler(req3, context))(req2)
    )(req)
  )(request);
