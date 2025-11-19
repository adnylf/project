import { NextRequest } from 'next/server';
import videoService from '@/services/video.service';
import uploadService from '@/services/upload.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * POST /api/videos
 * Upload video file
 */
async function handler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const materialId = formData.get('materialId') as string | undefined;

    if (!file) {
      return errorResponse('No file provided', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return errorResponse('Only video files are allowed', HTTP_STATUS.BAD_REQUEST);
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create multer-like file object
    const multerFile = {
      fieldname: 'file',
      originalname: file.name,
      encoding: '7bit',
      mimetype: file.type,
      buffer: buffer,
      size: buffer.length,
    } as Express.Multer.File;

    // Upload video
    const uploadResult = await uploadService.uploadVideo(multerFile);

    // Create video record in database
    const video = await videoService.createVideo(multerFile);

    // Link to material if provided
    if (materialId) {
      const materialService = (await import('@/services/material.service')).default;
      await materialService.linkVideoToMaterial(materialId, video.id, user.userId, user.role);
    }

    return successResponse(
      {
        id: video.id,
        filename: video.filename,
        path: video.path,
        size: video.size,
        status: video.status,
        uploadUrl: uploadResult.url,
      },
      'Video uploaded successfully. Processing will start shortly.',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to upload video', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Apply middlewares and export
async function authenticatedHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return handler(request);
}

export const POST = errorHandler(loggingMiddleware(corsMiddleware(authenticatedHandler)));
