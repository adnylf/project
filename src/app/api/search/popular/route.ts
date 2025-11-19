// ============================================
// PATH: src/app/api/search/popular/route.ts
// ============================================

import { NextRequest } from 'next/server';
import searchService from '@/services/search.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/search/popular
 * Get popular search terms and trending courses
 */
async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const [popularSearches, trendingCourses] = await Promise.all([
      searchService.getPopularSearches(limit),
      searchService.getTrendingCourses(limit),
    ]);

    return successResponse(
      {
        popularSearches,
        trendingCourses,
      },
      'Popular searches retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get popular searches', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(handler)));
