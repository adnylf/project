import { NextRequest } from 'next/server';
import analyticsService from '@/services/analytics.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

interface EventData {
  url?: string;
  courseId?: string;
  videoId?: string;
  materialId?: string;
  watchDuration?: number;
  totalDuration?: number;
  query?: string;
  resultsCount?: number;
  sessionId?: string;
  [key: string]: unknown;
}

async function handler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    const body = await request.json();
    const { eventType, eventData, sessionId } = body as {
      eventType: string;
      eventData: EventData;
      sessionId?: string;
    };

    if (!eventType) {
      return errorResponse('Event type is required', HTTP_STATUS.BAD_REQUEST);
    }

    if (!eventData || typeof eventData !== 'object') {
      return errorResponse('Event data must be an object', HTTP_STATUS.BAD_REQUEST);
    }

    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    const referrer = request.headers.get('referer') || undefined;

    switch (eventType) {
      case 'page_view':
        if (!eventData.url) {
          return errorResponse('URL is required for page_view event', HTTP_STATUS.BAD_REQUEST);
        }
        await analyticsService.trackPageView(user?.userId, eventData.url, {
          ...eventData,
          sessionId,
        });
        break;

      case 'course_view':
        if (!eventData.courseId) {
          return errorResponse(
            'Course ID is required for course_view event',
            HTTP_STATUS.BAD_REQUEST
          );
        }
        await analyticsService.trackCourseView(user?.userId, eventData.courseId, {
          ...eventData,
          sessionId,
        });
        break;

      case 'video_watch':
        if (!user) {
          return errorResponse(
            'Authentication required for video tracking',
            HTTP_STATUS.UNAUTHORIZED
          );
        }
        if (!eventData.videoId || !eventData.materialId) {
          return errorResponse('Video ID and Material ID are required', HTTP_STATUS.BAD_REQUEST);
        }
        await analyticsService.trackVideoWatch(
          user.userId,
          eventData.videoId,
          eventData.materialId,
          eventData.watchDuration || 0,
          eventData.totalDuration || 0,
          { ...eventData, sessionId }
        );
        break;

      case 'search':
        if (!eventData.query) {
          return errorResponse('Search query is required', HTTP_STATUS.BAD_REQUEST);
        }
        await analyticsService.trackSearch(
          user?.userId,
          eventData.query,
          eventData.resultsCount || 0,
          { ...eventData, sessionId }
        );
        break;

      case 'enrollment':
        if (!user) {
          return errorResponse(
            'Authentication required for enrollment tracking',
            HTTP_STATUS.UNAUTHORIZED
          );
        }
        if (!eventData.courseId) {
          return errorResponse('Course ID is required', HTTP_STATUS.BAD_REQUEST);
        }
        await analyticsService.trackEnrollment(user.userId, eventData.courseId, {
          ...eventData,
          sessionId,
        });
        break;

      default:
        await analyticsService.trackEvent({
          userId: user?.userId,
          eventType: eventType as
            | 'page_view'
            | 'course_view'
            | 'video_watch'
            | 'search'
            | 'enrollment',
          eventData,
          sessionId,
          ipAddress,
          userAgent,
          referrer,
          timestamp: new Date(),
        });
    }

    return successResponse(
      {
        tracked: true,
        eventType,
        timestamp: new Date().toISOString(),
      },
      'Event tracked successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to track event', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function optionalAuthHandler(request: NextRequest) {
  await authMiddleware(request);
  return handler(request);
}

export const POST = errorHandler(loggingMiddleware(corsMiddleware(optionalAuthHandler)));
