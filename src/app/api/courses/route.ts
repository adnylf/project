import { NextRequest } from 'next/server';
import courseService from '@/services/course.service';
import { createCourseSchema } from '@/lib/validation';
import {
  paginatedResponse,
  successResponse,
  validationErrorResponse,
  errorResponse,
} from '@/utils/response.util';
import { validateData, validatePagination, parseBoolean } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';
import type { CourseLevel, CourseStatus } from '@prisma/client';

/**
 * GET /api/courses
 * Get all courses with filters and search
 */
async function getHandler(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const level = searchParams.get('level') as CourseLevel | undefined;
    const minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined;
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined;
    const isFree = searchParams.get('isFree')
      ? parseBoolean(searchParams.get('isFree'))
      : undefined;
    const isPremium = searchParams.get('isPremium')
      ? parseBoolean(searchParams.get('isPremium'))
      : undefined;
    const status = searchParams.get('status') as CourseStatus | undefined;
    const mentorId = searchParams.get('mentorId') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Get courses
    const result = await courseService.getAllCourses({
      page: validatedPagination.page,
      limit: validatedPagination.limit,
      search,
      categoryId,
      level,
      minPrice,
      maxPrice,
      isFree,
      isPremium,
      status,
      mentorId,
      sortBy,
      sortOrder,
    });

    return paginatedResponse(result.data, result.meta, 'Courses retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get courses', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * POST /api/courses
 * Create new course (mentor only)
 */
async function postHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = await validateData(createCourseSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Handle null discountPrice - convert to undefined for service
    const courseData = {
      ...validation.data,
      discountPrice:
        validation.data.discountPrice === null ? undefined : validation.data.discountPrice,
    };

    // Create course
    const course = await courseService.createCourse(user.userId, courseData);

    return successResponse(course, 'Course created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to create course', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedPostHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return postHandler(request);
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(getHandler)));
export const POST = errorHandler(loggingMiddleware(corsMiddleware(authenticatedPostHandler)));
