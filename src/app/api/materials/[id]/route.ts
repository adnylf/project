import { NextRequest, NextResponse } from 'next/server';
import materialService from '@/services/material.service';
import { updateMaterialSchema } from '@/lib/validation';
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

async function getHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const material = await materialService.getMaterialById(id);

    return successResponse(material, 'Material retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to get material', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function putHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = await context.params;

    const body = await request.json();

    const validation = await validateData(updateMaterialSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const material = await materialService.updateMaterial(
      id,
      user.userId,
      user.role,
      validation.data
    );

    return successResponse(material, 'Material updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to update material', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function deleteHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = await context.params;

    await materialService.deleteMaterial(id, user.userId, user.role);

    return noContentResponse();
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to delete material', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

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
