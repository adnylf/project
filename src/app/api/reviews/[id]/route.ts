import { NextRequest, NextResponse } from "next/server";
import reviewService from "@/services/review.service";
import { updateReviewSchema } from "@/lib/validation";
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  noContentResponse,
} from "@/utils/response.util";
import { validateData } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/reviews/:id
 * Get review by ID
 */
async function getHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const review = await reviewService.getReviewById(id);

    return successResponse(review, "Review retrieved successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse(
      "Failed to get review",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * PUT /api/reviews/:id
 * Update review
 */
async function putHandler(
  request: NextRequest,
  user: any,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = await validateData(updateReviewSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Update review
    const review = await reviewService.updateReview(
      id,
      user.userId,
      validation.data
    );

    return successResponse(review, "Review updated successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to update review",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * DELETE /api/reviews/:id
 * Delete review
 */
async function deleteHandler(
  request: NextRequest,
  user: any,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await reviewService.deleteReview(id, user.userId, user.role);

    return noContentResponse();
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to delete review",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply middlewares and export
async function authenticatedPutHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  return putHandler(request, authResult, context);
}

async function authenticatedDeleteHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  return deleteHandler(request, authResult, context);
}

// Properly typed exports dengan handler yang sudah diperbaiki
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (req: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return getHandler(rq, context);
      })(r);
    })(req);
  })(request);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (req: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return authenticatedPutHandler(rq, context);
      })(r);
    })(req);
  })(request);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (req: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return authenticatedDeleteHandler(rq, context);
      })(r);
    })(req);
  })(request);
}
