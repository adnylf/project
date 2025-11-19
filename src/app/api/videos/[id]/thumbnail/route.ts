import { NextRequest, NextResponse } from 'next/server';
import videoService from '@/services/video.service';
import { storage } from '@/lib/storage';
import { errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';
import path from 'path';

/**
 * GET /api/videos/:id/thumbnail
 * Get video thumbnail image
 */
async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get video
    const video = await videoService.getVideoById(id);

    if (!video || !video.thumbnail) {
      return errorResponse('Thumbnail not found', HTTP_STATUS.NOT_FOUND);
    }

    // Get thumbnail file
    const thumbnailPath = video.thumbnail;
    const fileBuffer = await storage.get(thumbnailPath);

    // Determine content type
    const ext = path.extname(thumbnailPath).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

    // Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(fileBuffer);

    // Return image
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to get thumbnail', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Properly typed export
export const GET = (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  errorHandler((req: NextRequest) =>
    loggingMiddleware((req2: NextRequest) =>
      corsMiddleware((req3: NextRequest) => handler(req3, context))(req2)
    )(req)
  )(request);
