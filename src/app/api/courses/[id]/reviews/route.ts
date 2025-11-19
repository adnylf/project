import { NextRequest, NextResponse } from 'next/server';
import reviewService from '@/services/review.service';
import { createReviewSchema } from '@/lib/validation';
import {
  paginatedResponse,
  successResponse,
  validationErrorResponse,
  errorResponse,
} from '@/utils/response.util';
import { validateData, validatePagination } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

async function getHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await context.params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const validatedPagination = validatePagination(page, limit);

    const result = await reviewService.getCourseReviews(courseId, {
      page: validatedPagination.page,
      limit: validatedPagination.limit,
      sortBy,
      sortOrder,
    });

    // Fix: Create proper pagination meta type
    const paginationMeta = {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
    };

    // Add averageRating to response data instead of meta
    const responseData = {
      reviews: result.data,
      averageRating: result.meta.averageRating,
    };

    return paginatedResponse(result.data, paginationMeta, 'Reviews retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get reviews', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function postHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id: courseId } = await context.params;
    const body = await request.json();
    const dataWithCourseId = { ...body, courseId };

    const validation = await validateData(createReviewSchema, dataWithCourseId);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const review = await reviewService.createReview(user.userId, validation.data);

    return successResponse(review, 'Review added successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to add review', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function authenticatedPostHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return postHandler(request, context);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (request: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return getHandler(rq, context);
      })(r);
    })(request);
  })(req);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (request: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return authenticatedPostHandler(rq, context);
      })(r);
    })(request);
  })(req);
}
