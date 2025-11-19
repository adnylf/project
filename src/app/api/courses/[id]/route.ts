import { NextRequest, NextResponse } from 'next/server';
import courseService from '@/services/course.service';
import { updateCourseSchema } from '@/lib/validation';
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  noContentResponse,
} from '@/utils/response.util';
import { validateData } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/courses/:id
 * Get course details by ID
 */
async function getHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Check if user is authenticated to see draft courses
    const user = getAuthenticatedUser(request);
    const includePrivate = !!user;

    // Get course
    const course = await courseService.getCourseById(id, includePrivate);

    return successResponse(course, 'Course retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to get course', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * PUT /api/courses/:id
 * Update course
 */
async function putHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = await context.params;

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = await validateData(updateCourseSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Handle null discountPrice - convert to undefined for service
    const updateData = {
      ...validation.data,
      discountPrice:
        validation.data.discountPrice === null ? undefined : validation.data.discountPrice,
    };

    // Update course
    const course = await courseService.updateCourse(id, user.userId, user.role, updateData);

    return successResponse(course, 'Course updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to update course', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * DELETE /api/courses/:id
 * Delete course
 */
async function deleteHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = await context.params;

    // Delete course
    await courseService.deleteCourse(id, user.userId, user.role);

    return noContentResponse();
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to delete course', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedPutHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return putHandler(request, context);
}

async function authenticatedDeleteHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return deleteHandler(request, context);
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

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (request: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return authenticatedPutHandler(rq, context);
      })(r);
    })(request);
  })(req);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (request: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return authenticatedDeleteHandler(rq, context);
      })(r);
    })(request);
  })(req);
}
