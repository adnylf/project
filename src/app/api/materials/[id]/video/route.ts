import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import streamingService from '@/services/streaming.service';
import { errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';
import type { VideoQuality } from '@/types/video.types';

async function handler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);
    const { id: materialId } = await context.params;

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        video: true,
        section: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!material) {
      return errorResponse('Material not found', HTTP_STATUS.NOT_FOUND);
    }

    if (!material.video) {
      return errorResponse('No video associated with this material', HTTP_STATUS.NOT_FOUND);
    }

    if (material.video.status !== 'COMPLETED') {
      return errorResponse(
        `Video is still ${material.video.status.toLowerCase()}`,
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
    }

    if (!material.isFree) {
      if (!user) {
        return errorResponse('Authentication required', HTTP_STATUS.UNAUTHORIZED);
      }

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.userId,
            courseId: material.section.courseId,
          },
        },
      });

      if (!enrollment && user.role !== 'ADMIN') {
        return errorResponse('You must be enrolled to access this content', HTTP_STATUS.FORBIDDEN);
      }

      if (enrollment) {
        await prisma.progress.upsert({
          where: {
            enrollmentId_materialId: {
              enrollmentId: enrollment.id,
              materialId,
            },
          },
          update: {
            lastPosition: 0,
          },
          create: {
            enrollmentId: enrollment.id,
            materialId,
            userId: user.userId,
            isCompleted: false,
            watchedDuration: 0,
            lastPosition: 0,
          },
        });
      }
    }

    const { searchParams } = new URL(request.url);
    const quality = searchParams.get('quality') as VideoQuality | undefined;

    const rangeHeader = request.headers.get('range') || undefined;

    const streamInfo = await streamingService.streamVideo(material.video.id, quality, rangeHeader);

    const { headers, statusCode } = streamingService.getStreamResponse(streamInfo);

    // Get the stream from streamInfo - adjust based on your VideoStreamInfo type
    const nodeStream = (streamInfo as { stream?: NodeJS.ReadableStream }).stream;

    if (!nodeStream) {
      return errorResponse('Stream not available', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Convert Node.js Readable to Web ReadableStream
    const webStream = new ReadableStream({
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

    return new NextResponse(webStream, {
      status: statusCode,
      headers: {
        ...headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges',
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to stream video', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function optionalAuthHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  await authMiddleware(request);
  return handler(request, context);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (request: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return optionalAuthHandler(rq, context);
      })(r);
    })(request);
  })(req);
}
