import { NextRequest, NextResponse } from "next/server";
import searchService from "@/services/search.service";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/search/similar/:id
 * Get similar courses based on a course ID
 */
async function handler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: courseId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "6");

    const similarCourses = await searchService.getSimilarCourses(
      courseId,
      limit
    );

    return successResponse(
      {
        courseId,
        similar: similarCourses,
        total: similarCourses.length,
      },
      "Similar courses retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse(
      "Failed to get similar courses",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Properly typed export
export async function GET(
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
