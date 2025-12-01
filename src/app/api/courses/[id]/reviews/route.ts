import { NextRequest } from "next/server";
import reviewService from "@/services/review.service";
import { createReviewSchema } from "@/lib/validation";
import {
  paginatedResponse,
  successResponse,
  validationErrorResponse,
  errorResponse,
} from "@/utils/response.util";
import { validateData } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

async function getHandler(request: NextRequest) {
  try {
    // Extract course ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const courseId = pathSegments[pathSegments.length - 2]; // Get ID from /api/courses/[id]/reviews

    if (!courseId) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

    const result = await reviewService.getCourseReviews(courseId, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return paginatedResponse(
      result.data,
      {
        page: result.meta.page,
        limit: result.meta.limit,
        total: result.meta.total,
      },
      "Reviews retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get reviews",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

async function postHandler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Extract course ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const courseId = pathSegments[pathSegments.length - 2]; // Get ID from /api/courses/[id]/reviews

    if (!courseId) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", HTTP_STATUS.BAD_REQUEST);
    }

    const dataWithCourseId = { ...body, courseId };

    // Validate input
    const validation = await validateData(createReviewSchema, dataWithCourseId);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Create review
    const review = await reviewService.createReview(
      user.userId,
      validation.data
    );

    return successResponse(
      review,
      "Review added successfully",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to add review",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Gunakan requireAuth untuk POST handler
const authenticatedPostHandler = requireAuth(postHandler);

export const GET = errorHandler(loggingMiddleware(corsMiddleware(getHandler)));

export const POST = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedPostHandler))
);
