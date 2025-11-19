import { NextRequest } from 'next/server';
import mentorService from '@/services/mentor.service';
import { paginatedResponse, errorResponse } from '@/utils/response.util';
import { validatePagination } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/mentors
 * Get all approved mentors with filters
 */
async function handler(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const expertise = searchParams.get('expertise') || undefined;
    const minRating = searchParams.get('minRating')
      ? parseFloat(searchParams.get('minRating')!)
      : undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Get mentors
    const result = await mentorService.getAllMentors({
      page: validatedPagination.page,
      limit: validatedPagination.limit,
      search,
      expertise,
      minRating,
      sortBy,
      sortOrder,
    });

    return paginatedResponse(result.data, result.meta, 'Mentors retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get mentors', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(handler)));
