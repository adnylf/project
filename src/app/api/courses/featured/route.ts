import { NextRequest } from "next/server";
import courseService from "@/services/course.service";
import { paginatedResponse, errorResponse } from "@/utils/response.util";
import { validatePagination } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/courses/featured
 * Get featured/promoted courses
 */
async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const validatedPagination = validatePagination(page, limit);

    // Get featured courses using service
    const result = await courseService.getFeaturedCourses(
      validatedPagination.limit
    );

    return paginatedResponse(
      result,
      {
        page: validatedPagination.page,
        limit: validatedPagination.limit,
        total: result.length,
      },
      "Featured courses retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get featured courses",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(handler)));
