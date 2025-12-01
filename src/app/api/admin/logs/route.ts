// src/app/api/admin/logs/route.ts
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  paginatedResponse,
  successResponse,
  errorResponse,
} from "@/utils/response.util";
import { validatePagination } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAdmin, AuthContext } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/admin/logs
 * Get system logs with filters
 */
async function getHandler(request: NextRequest, context: AuthContext) {
  try {
    const { user } = context;

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const validatedPagination = validatePagination(page, limit);

    // Filters
    const userId = searchParams.get("userId") || undefined;
    const action = searchParams.get("action") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;
    const search = searchParams.get("search") || undefined;

    // Build where clause
    const where: Prisma.ActivityLogWhereInput = {};

    if (userId) {
      where.user_id = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entity_type = entityType;
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = startDate;
      if (endDate) where.created_at.lte = endDate;
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity_type: { contains: search, mode: "insensitive" } },
        { entity_id: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (validatedPagination.page - 1) * validatedPagination.limit;

    // Get logs
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: validatedPagination.limit,
        orderBy: { created_at: "desc" },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return paginatedResponse(
      logs,
      {
        page: validatedPagination.page,
        limit: validatedPagination.limit,
        total,
      },
      "Logs retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get logs",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * GET /api/admin/logs/stats
 * Get log statistics
 */
async function statsHandler(request: NextRequest, context: AuthContext) {
  try {
    const { user } = context;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "24h"; // 24h, 7d, 30d

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "24h":
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const [totalLogs, logsByAction, logsByEntityType, recentErrors, topUsers] =
      await Promise.all([
        // Total logs in period
        prisma.activityLog.count({
          where: {
            created_at: { gte: startDate },
          },
        }),

        // Logs by action
        prisma.activityLog.groupBy({
          by: ["action"],
          where: {
            created_at: { gte: startDate },
          },
          _count: true,
          orderBy: {
            _count: {
              action: "desc",
            },
          },
          take: 10,
        }),

        // Logs by entity type
        prisma.activityLog.groupBy({
          by: ["entity_type"],
          where: {
            created_at: { gte: startDate },
          },
          _count: true,
          orderBy: {
            _count: {
              entity_type: "desc",
            },
          },
          take: 10,
        }),

        // Recent errors
        prisma.activityLog.findMany({
          where: {
            created_at: { gte: startDate },
            action: {
              contains: "error",
              mode: "insensitive",
            },
          },
          orderBy: { created_at: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                full_name: true,
                email: true,
              },
            },
          },
        }),

        // Top active users
        prisma.activityLog.groupBy({
          by: ["user_id"],
          where: {
            created_at: { gte: startDate },
          },
          _count: true,
          orderBy: {
            _count: {
              user_id: "desc",
            },
          },
          take: 10,
        }),
      ]);

    // Enrich top users with details
    const userIds = topUsers.map((u: any) => u.user_id);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
      },
    });

    const userMap = new Map(users.map((u: any) => [u.id, u]));
    const enrichedTopUsers = topUsers.map((u: any) => ({
      user: userMap.get(u.user_id),
      count: u._count,
    }));

    return successResponse(
      {
        period,
        totalLogs,
        byAction: logsByAction,
        byEntityType: logsByEntityType,
        recentErrors,
        topUsers: enrichedTopUsers,
      },
      "Log statistics retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get log statistics",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * DELETE /api/admin/logs/cleanup
 * Clean up old logs
 */
async function cleanupHandler(request: NextRequest, context: AuthContext) {
  try {
    const { user } = context;

    const body = await request.json();
    const { days = 90 } = body; // Default: delete logs older than 90 days

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await prisma.activityLog.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });

    // Log the cleanup action
    await prisma.activityLog.create({
      data: {
        user_id: user.userId,
        action: "cleanup_logs",
        entity_type: "system",
        entity_id: "log_cleanup",
        metadata: {
          deletedCount: result.count,
          cutoffDate: cutoffDate.toISOString(),
        },
      },
    });

    return successResponse(
      {
        deletedCount: result.count,
        cutoffDate,
      },
      `Deleted ${result.count} old log entries`
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to cleanup logs",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * GET /api/admin/logs/search
 * Advanced log search
 */
async function searchHandler(request: NextRequest, context: AuthContext) {
  try {
    const { user } = context;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "100");

    if (!query || query.length < 3) {
      return errorResponse(
        "Search query must be at least 3 characters",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Search across multiple fields
    const logs = await prisma.activityLog.findMany({
      where: {
        OR: [
          { action: { contains: query, mode: "insensitive" } },
          { entity_type: { contains: query, mode: "insensitive" } },
          { entity_id: { contains: query, mode: "insensitive" } },
          { ip_address: { contains: query, mode: "insensitive" } },
          { user_agent: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            full_name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return successResponse(
      {
        query,
        results: logs,
        count: logs.length,
      },
      "Search completed successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse("Search failed", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares
const authenticatedGetHandler = requireAdmin(getHandler);
const authenticatedStatsHandler = requireAdmin(statsHandler);
const authenticatedCleanupHandler = requireAdmin(cleanupHandler);
const authenticatedSearchHandler = requireAdmin(searchHandler);

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedGetHandler))
);

// Route untuk stats (harus dipisah ke file terpisah: src/app/api/admin/logs/stats/route.ts)
export async function GET_STATS(request: NextRequest) {
  const handler = errorHandler(
    loggingMiddleware(corsMiddleware(authenticatedStatsHandler))
  );
  return handler(request);
}

// Route untuk cleanup (harus dipisah ke file terpisah: src/app/api/admin/logs/cleanup/route.ts)
export async function DELETE_CLEANUP(request: NextRequest) {
  const handler = errorHandler(
    loggingMiddleware(corsMiddleware(authenticatedCleanupHandler))
  );
  return handler(request);
}

// Route untuk search (harus dipisah ke file terpisah: src/app/api/admin/logs/search/route.ts)
export async function GET_SEARCH(request: NextRequest) {
  const handler = errorHandler(
    loggingMiddleware(corsMiddleware(authenticatedSearchHandler))
  );
  return handler(request);
}
