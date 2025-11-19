import { NextRequest } from 'next/server';
import searchService from '@/services/search.service';
import { paginatedResponse, successResponse, errorResponse } from '@/utils/response.util';
import { validatePagination, parseBoolean, parseInteger } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';
import type { CourseLevel } from '@prisma/client';

/**
 * GET /api/search/courses
 * Advanced course search with filters and facets
 */
async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract search parameters
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const categoryId = searchParams.get('categoryId') || undefined;
    const level = searchParams.get('level') as CourseLevel | undefined;
    const minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined;
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined;
    const minRating = searchParams.get('minRating')
      ? parseFloat(searchParams.get('minRating')!)
      : undefined;
    const isFree = searchParams.get('isFree')
      ? parseBoolean(searchParams.get('isFree'))
      : undefined;
    const isPremium = searchParams.get('isPremium')
      ? parseBoolean(searchParams.get('isPremium'))
      : undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const language = searchParams.get('language') || 'id';
    const page = parseInteger(searchParams.get('page') || '1', 1);
    const limit = parseInteger(searchParams.get('limit') || '12', 12);
    const sortBy =
      (searchParams.get('sortBy') as
        | 'relevance'
        | 'rating'
        | 'students'
        | 'price'
        | 'newest'
        | undefined) || 'relevance';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc' | undefined) || 'desc';

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Search courses
    const result = await searchService.searchCourses({
      query,
      categoryId,
      level,
      minPrice,
      maxPrice,
      minRating,
      isFree,
      isPremium,
      tags,
      language,
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
        categoryId,
        level,
        minPrice,
        maxPrice,
        minRating,
        isFree,
        isPremium,
        tags,
        language,
      },
      sortBy,
      sortOrder,
      facets: result.facets,
    };

    return paginatedResponse(result.courses, metadata, 'Courses found successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Course search failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(handler)));
