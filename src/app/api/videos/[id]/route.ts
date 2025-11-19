import { NextRequest } from 'next/server';
import videoService from '@/services/video.service';
import { successResponse, errorResponse, noContentResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/videos/:id
 * Get video metadata
 */
async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get video
    const video = await videoService.getVideoById(id);

    if (!video) {
      return errorResponse('Video not found', HTTP_STATUS.NOT_FOUND);
    }

    return successResponse(video, 'Video metadata retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to get video', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * DELETE /api/videos/:id
 * Delete video and all related files
 */
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = await params;

    // Delete video
    await videoService.deleteVideo(id);

    return noContentResponse();
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to delete video', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedDeleteHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return deleteHandler(request, context);
}

// Properly typed exports
export const GET = (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  errorHandler((req: NextRequest) =>
    loggingMiddleware((req2: NextRequest) =>
      corsMiddleware((req3: NextRequest) => getHandler(req3, context))(req2)
    )(req)
  )(request);

export const DELETE = (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  errorHandler((req: NextRequest) =>
    loggingMiddleware((req2: NextRequest) =>
      corsMiddleware((req3: NextRequest) => authenticatedDeleteHandler(req3, context))(req2)
    )(req)
  )(request);
