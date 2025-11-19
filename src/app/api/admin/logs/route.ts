// ============================================
// FILE: src/app/api/admin/logs/route.ts
// DAY 50: Admin Logs & Monitoring System
// ============================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis-upstash';
import { paginatedResponse, successResponse, errorResponse } from '@/utils/response.util';
import { validatePagination } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS, USER_ROLES } from '@/lib/constants';
import type { Prisma } from '@prisma/client';

/**
 * Log Types
 */
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
type LogCategory =
  | 'AUTH'
  | 'API'
  | 'DATABASE'
  | 'PAYMENT'
  | 'EMAIL'
  | 'SECURITY'
  | 'SYSTEM'
  | 'USER_ACTION';

/**
 * GET /api/admin/logs
 * Get system logs with filters
 */
async function getHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user || user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const validatedPagination = validatePagination(page, limit);

    // Filters
    const level = searchParams.get('level') as LogLevel | null;
    const category = searchParams.get('category') as LogCategory | null;
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const search = searchParams.get('search') || undefined;

    // Build where clause
    const where: Prisma.ActivityLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (validatedPagination.page - 1) * validatedPagination.limit;

    // Get logs
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: validatedPagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
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
      'Logs retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get logs', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * GET /api/admin/logs/stats
 * Get log statistics
 */
async function statsHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user || user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h'; // 24h, 7d, 30d

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '24h':
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const [totalLogs, logsByAction, logsByEntityType, recentErrors, topUsers] = await Promise.all([
      // Total logs in period
      prisma.activityLog.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),

      // Logs by action
      prisma.activityLog.groupBy({
        by: ['action'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: true,
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),

      // Logs by entity type
      prisma.activityLog.groupBy({
        by: ['entityType'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: true,
        orderBy: {
          _count: {
            entityType: 'desc',
          },
        },
        take: 10,
      }),

      // Recent errors (if you have error logs)
      prisma.activityLog.findMany({
        where: {
          createdAt: { gte: startDate },
          action: {
            contains: 'error',
            mode: 'insensitive',
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),

      // Top active users
      prisma.activityLog.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: true,
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Enrich top users with details
    const userIds = topUsers.map((u) => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const enrichedTopUsers = topUsers.map((u) => ({
      user: userMap.get(u.userId),
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
      'Log statistics retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get log statistics', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * GET /api/admin/logs/export
 * Export logs to CSV
 */
async function exportHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user || user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;

    // Build where clause
    const where: Prisma.ActivityLogWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get logs
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit export
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Convert to CSV
    const csv = convertLogsToCSV(logs);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="logs_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to export logs', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * DELETE /api/admin/logs/cleanup
 * Clean up old logs
 */
async function cleanupHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user || user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

    const body = await request.json();
    const { days = 90 } = body; // Default: delete logs older than 90 days

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // Log the cleanup action
    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'cleanup_logs',
        entityType: 'system',
        entityId: 'log_cleanup',
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
    return errorResponse('Failed to cleanup logs', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * GET /api/admin/logs/search
 * Advanced log search
 */
async function searchHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user || user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!query || query.length < 3) {
      return errorResponse('Search query must be at least 3 characters', HTTP_STATUS.BAD_REQUEST);
    }

    // Search across multiple fields
    const logs = await prisma.activityLog.findMany({
      where: {
        OR: [
          { action: { contains: query, mode: 'insensitive' } },
          { entityType: { contains: query, mode: 'insensitive' } },
          { entityId: { contains: query, mode: 'insensitive' } },
          { ipAddress: { contains: query, mode: 'insensitive' } },
          { userAgent: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
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
      'Search completed successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Search failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Helper: Convert logs to CSV
 */
function convertLogsToCSV(logs: any[]): string {
  const headers = [
    'Timestamp',
    'User',
    'Email',
    'Role',
    'Action',
    'Entity Type',
    'Entity ID',
    'IP Address',
    'User Agent',
  ];

  const rows = logs.map((log) => [
    log.createdAt.toISOString(),
    log.user?.name || 'Unknown',
    log.user?.email || 'N/A',
    log.user?.role || 'N/A',
    log.action,
    log.entityType || 'N/A',
    log.entityId || 'N/A',
    log.ipAddress || 'N/A',
    log.userAgent || 'N/A',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Apply middlewares
 */
async function authenticatedGetHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return getHandler(request);
}

async function authenticatedStatsHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return statsHandler(request);
}

async function authenticatedExportHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return exportHandler(request);
}

async function authenticatedCleanupHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return cleanupHandler(request);
}

async function authenticatedSearchHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return searchHandler(request);
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(authenticatedGetHandler)));

// ============================================
// FILE: src/app/api/admin/logs/stats/route.ts
// Get log statistics
// ============================================

export const GET_STATS = errorHandler(loggingMiddleware(corsMiddleware(authenticatedStatsHandler)));

// ============================================
// FILE: src/app/api/admin/logs/export/route.ts
// Export logs to CSV
// ============================================

export const GET_EXPORT = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedExportHandler))
);

// ============================================
// FILE: src/app/api/admin/logs/cleanup/route.ts
// Clean up old logs
// ============================================

export const DELETE_CLEANUP = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedCleanupHandler))
);

// ============================================
// FILE: src/app/api/admin/logs/search/route.ts
// Advanced log search
// ============================================

export const GET_SEARCH = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedSearchHandler))
);
