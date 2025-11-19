import { NextRequest } from 'next/server';
import videoService from '@/services/video.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/videos/:id/status
 * Check video processing status
 */
async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get processing status
    const status = await videoService.getProcessingStatus(id);

    return successResponse(status, 'Processing status retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to get processing status', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Properly typed export
export const GET = (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  errorHandler((req: NextRequest) =>
    loggingMiddleware((req2: NextRequest) =>
      corsMiddleware((req3: NextRequest) => handler(req3, context))(req2)
    )(req)
  )(request);
