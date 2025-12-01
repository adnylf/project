import { NextRequest } from "next/server";
import courseService from "@/services/course.service";
import { paginatedResponse, errorResponse } from "@/utils/response.util";
import { validatePagination } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/courses/popular
 * Get popular courses based on enrollment count
 */
async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const timeRange = searchParams.get("timeRange") || "all"; // all, week, month

    const validatedPagination = validatePagination(page, limit);

    // Get popular courses using service with filters
    const result = await courseService.getAllCourses({
      page: validatedPagination.page,
      limit: validatedPagination.limit,
      sortBy: "totalStudents",
      sortOrder: "desc",
    });

    return paginatedResponse(
      result.data,
      result.meta,
      `Popular courses ${
        timeRange !== "all" ? `(${timeRange})` : ""
      } retrieved successfully`
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get popular courses",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(handler)));
