import { NextRequest, NextResponse } from 'next/server';
import sectionService from '@/services/section.service';
import { createSectionSchema } from '@/lib/validation';
import { successResponse, validationErrorResponse, errorResponse } from '@/utils/response.util';
import { validateData } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/courses/:id/sections
 * Get all sections for a course
 */
async function getHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await context.params;

    // Get sections
    const sections = await sectionService.getCourseSections(courseId);

    return successResponse(sections, 'Sections retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get sections', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * POST /api/courses/:id/sections
 * Create new section for a course
 */
async function postHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id: courseId } = await context.params;

    // Parse request body
    const body = await request.json();

    // Add courseId to body
    const dataWithCourseId = { ...body, courseId };

    // Validate input
    const validation = await validateData(createSectionSchema, dataWithCourseId);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Create section
    const section = await sectionService.createSection(user.userId, user.role, validation.data);

    return successResponse(section, 'Section created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to create section', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
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
