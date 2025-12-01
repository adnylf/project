import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { paginatedResponse, errorResponse } from "@/utils/response.util";
import { validatePagination } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/users/activity
 * Get user activity history
 */
async function handler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action") || undefined;

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Build where clause
    const where: Prisma.ActivityLogWhereInput = { user_id: user.userId };
    if (action) {
      where.action = action;
    }

    // Get activity logs
    const skip = (validatedPagination.page - 1) * validatedPagination.limit;

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: validatedPagination.limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          action: true,
          entity_type: true,
          entity_id: true,
          metadata: true,
          ip_address: true,
          user_agent: true,
          created_at: true,
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return paginatedResponse(
      activities,
      {
        page: validatedPagination.page,
        limit: validatedPagination.limit,
        total,
      },
      "Activity history retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get activity history",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply authentication
const authenticatedHandler = requireAuth(handler);

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
