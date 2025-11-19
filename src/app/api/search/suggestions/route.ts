// ============================================
// PATH: src/app/api/search/suggestions/route.ts
// ============================================

import { NextRequest } from 'next/server';
import searchService from '@/services/search.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/search/suggestions
 * Get search suggestions for autocomplete
 */
async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!query || query.trim().length < 2) {
      return successResponse(
        {
          courses: [],
          mentors: [],
          tags: [],
        },
        'Query too short for suggestions'
      );
    }

    const suggestions = await searchService.getSearchSuggestions(query, limit);

    return successResponse(suggestions, 'Suggestions retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get suggestions', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(handler)));
