import { NextRequest } from 'next/server';
import searchService from '@/services/search.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/search
 * Global search across courses and mentors
 */
async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';

    if (!query || query.trim().length < 2) {
      return errorResponse('Search query must be at least 2 characters', HTTP_STATUS.BAD_REQUEST);
    }

    const includeCoursesLimit = parseInt(searchParams.get('coursesLimit') || '5');
    const includeMentorsLimit = parseInt(searchParams.get('mentorsLimit') || '3');

    const results = await searchService.globalSearch(query, {
      includeCoursesLimit,
      includeMentorsLimit,
    });

    return successResponse(
      {
        query,
        results: {
          courses: {
            items: results.courses,
            total: results.totalCourses,
          },
          mentors: {
            items: results.mentors,
            total: results.totalMentors,
          },
        },
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

export const GET = errorHandler(loggingMiddleware(corsMiddleware(handler)));
