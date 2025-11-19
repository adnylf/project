import { NextRequest, NextResponse } from 'next/server';
import materialService from '@/services/material.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';
import uploadService from '@/services/upload.service';

async function getHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: materialId } = await context.params;

    const resources = await materialService.getMaterialResources(materialId);

    return successResponse(resources, 'Resources retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to get resources', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function postHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id: materialId } = await context.params;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | undefined;

    if (!file) {
      return errorResponse('No file provided', HTTP_STATUS.BAD_REQUEST);
    }

    if (!title) {
      return errorResponse('Resource title is required', HTTP_STATUS.BAD_REQUEST);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const multerFile = {
      fieldname: 'file',
      originalname: file.name,
      encoding: '7bit',
      mimetype: file.type,
      buffer: buffer,
      size: buffer.length,
    } as Express.Multer.File;

    const uploadResult = await uploadService.uploadDocument(multerFile);

    const resource = await materialService.addResource(materialId, user.userId, user.role, {
      title,
      description,
      fileUrl: uploadResult.url,
      fileType: uploadResult.mimetype,
      fileSize: uploadResult.size,
    });

    return successResponse(resource, 'Resource uploaded successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to upload resource', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

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
