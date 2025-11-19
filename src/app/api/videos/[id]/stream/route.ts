import { NextRequest, NextResponse } from 'next/server';
import streamingService from '@/services/streaming.service';
import { errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';
import type { VideoQuality } from '@/types/video.types';

/**
 * GET /api/videos/:id/stream
 * Direct video stream with quality parameter
 */
async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: videoId } = await params;
    const { searchParams } = new URL(request.url);

    // Get quality parameter
    const quality = searchParams.get('quality') as VideoQuality | undefined;

    // Get range header for seeking
    const rangeHeader = request.headers.get('range') || undefined;

    // Get connection speed for adaptive quality (optional)
    const connectionSpeed = searchParams.get('speed')
      ? parseFloat(searchParams.get('speed')!)
      : undefined;

    // Auto-select quality based on connection speed if not specified
    let selectedQuality = quality;
    if (!selectedQuality && connectionSpeed) {
      selectedQuality = await streamingService.getOptimalQuality(videoId, connectionSpeed);
    }

    // Stream video
    const streamInfo = await streamingService.streamVideo(videoId, selectedQuality, rangeHeader);

    const { headers, statusCode } = streamingService.getStreamResponse(streamInfo);

    // Get the stream from streamInfo - adjust based on your VideoStreamInfo type
    const nodeStream = (streamInfo as { stream?: NodeJS.ReadableStream }).stream;

    if (!nodeStream) {
      return errorResponse('Stream not available', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Create readable stream
    const stream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });

        nodeStream.on('end', () => {
          controller.close();
        });

        nodeStream.on('error', (error: Error) => {
          controller.error(error);
        });
      },
      cancel() {
        if ('destroy' in nodeStream && typeof nodeStream.destroy === 'function') {
          nodeStream.destroy();
        }
      },
    });

    return new NextResponse(stream, {
      status: statusCode,
      headers: {
        ...headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to stream video', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Properly typed export
export const GET = (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  errorHandler((req: NextRequest) =>
    loggingMiddleware((req2: NextRequest) =>
      corsMiddleware((req3: NextRequest) => handler(req3, context))(req2)
    )(req)
  )(request);
