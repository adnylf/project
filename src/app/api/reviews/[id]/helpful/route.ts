import { NextRequest, NextResponse } from "next/server";
import reviewService from "@/services/review.service";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * POST /api/reviews/:id/helpful
 * Mark review as helpful
 */
async function handler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const review = await reviewService.markHelpful(id);

    return successResponse(
      {
        reviewId: review.id,
        helpfulCount: review.helpfulCount,
      },
      "Marked as helpful"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse(
      "Failed to mark as helpful",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Properly typed export
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (req: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return handler(rq, context);
      })(r);
    })(req);
  })(request);
}
