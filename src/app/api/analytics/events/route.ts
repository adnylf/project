import { NextRequest } from 'next/server';
import analyticsService from '@/services/analytics.service';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * POST /api/analytics/events
 * Track custom events with flexible structure
 */
async function handler(request: NextRequest) {
  try {
    // Get user (optional)
    const user = getAuthenticatedUser(request);

    // Parse request body
    const body = await request.json();
    const { events } = body;

    // Validate events array
    if (!Array.isArray(events) || events.length === 0) {
      return validationErrorResponse({
        events: ['Events must be a non-empty array'],
      });
    }

    if (events.length > 100) {
      return errorResponse('Maximum 100 events per batch', HTTP_STATUS.BAD_REQUEST);
    }

    // Get request metadata
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    const referrer = request.headers.get('referer') || undefined;

    // Track all events
    const results = [];
    for (const event of events) {
      if (!event.eventType || !event.eventData) {
        results.push({
          success: false,
          error: 'eventType and eventData are required',
        });
        continue;
      }

      try {
        await analyticsService.trackEvent({
          userId: user?.userId,
          eventType: event.eventType,
          eventData: event.eventData,
          sessionId: event.sessionId,
          ipAddress,
          userAgent,
          referrer,
          timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        });

        results.push({
          success: true,
          eventType: event.eventType,
        });
      } catch (error) {
        results.push({
          success: false,
          eventType: event.eventType,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.length - successCount;

    return successResponse(
      {
        total: results.length,
        success: successCount,
        failed: failedCount,
        results,
      },
      `Tracked ${successCount} events successfully`
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to track events', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares (auth is optional)
async function optionalAuthHandler(request: NextRequest) {
  await authMiddleware(request);
  return handler(request);
}

export const POST = errorHandler(loggingMiddleware(corsMiddleware(optionalAuthHandler)));
