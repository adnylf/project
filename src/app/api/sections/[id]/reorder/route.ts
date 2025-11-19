import { NextRequest } from 'next/server';
import sectionService from '@/services/section.service';
import { reorderSectionsSchema } from '@/lib/validation';
import { successResponse, validationErrorResponse, errorResponse } from '@/utils/response.util';
import { validateData } from '@/utils/validation.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * PUT /api/sections/:id/reorder
 * Reorder sections for a course
 * Note: :id here is courseId, not sectionId
 */
async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id: courseId } = await params;

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = await validateData(reorderSectionsSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Reorder sections
    const sections = await sectionService.reorderSections(
      courseId,
      user.userId,
      user.role,
      validation.data.sections
    );

    return successResponse(sections, 'Sections reordered successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to reorder sections', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request, context);
}

// Properly typed export
export const PUT = (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  errorHandler((req: NextRequest) =>
    loggingMiddleware((req2: NextRequest) =>
      corsMiddleware((req3: NextRequest) => authenticatedHandler(req3, context))(req2)
    )(req)
  )(request);
