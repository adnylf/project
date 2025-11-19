// ============================================
// PATH: src/app/api/search/mentors/route.ts
// ============================================

import { NextRequest } from 'next/server';
import searchService from '@/services/search.service';
import { paginatedResponse, errorResponse } from '@/utils/response.util';
import { validatePagination, parseInteger } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/search/mentors
 * Mentor search with expertise and experience filters
 */
async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract search parameters
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const expertise = searchParams.get('expertise')?.split(',').filter(Boolean);
    const minRating = searchParams.get('minRating')
      ? parseFloat(searchParams.get('minRating')!)
      : undefined;
    const minExperience = searchParams.get('minExperience')
      ? parseInteger(searchParams.get('minExperience')!)
      : undefined;
    const page = parseInteger(searchParams.get('page') || '1', 1);
    const limit = parseInteger(searchParams.get('limit') || '12', 12);
    const sortBy =
      (searchParams.get('sortBy') as 'relevance' | 'rating' | 'students' | 'courses' | undefined) ||
      'relevance';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc' | undefined) || 'desc';

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Search mentors
    const result = await searchService.searchMentors({
      query,
      expertise,
      minRating,
      minExperience,
      page: validatedPagination.page,
      limit: validatedPagination.limit,
      sortBy,
      sortOrder,
    });

    // Build metadata with filters applied
    const metadata = {
      page: validatedPagination.page,
      limit: validatedPagination.limit,
      total: result.total,
      query,
      filters: {
        expertise,
        minRating,
        minExperience,
      },
      sortBy,
      sortOrder,
      facets: result.facets,
    };

    return paginatedResponse(result.mentors, metadata, 'Mentors found successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Mentor search failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(handler)));
