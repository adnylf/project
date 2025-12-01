import { NextRequest, NextResponse } from "next/server";
import commentService from "@/services/comment.service";
import { updateCommentSchema } from "@/lib/validation";
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  noContentResponse,
} from "@/utils/response.util";
import { validateData } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/comments/:id
 * Get comment by ID
 */
async function getHandler(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const { id } = params;

    const comment = await commentService.getCommentById(id);

    return successResponse(comment, "Comment retrieved successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse(
      "Failed to get comment",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * PUT /api/comments/:id
 * Update comment
 */
async function putHandler(
  request: NextRequest,
  context: {
    user: { userId: string; email: string; role: string };
    params: { id: string };
  }
) {
  try {
    const { user, params } = context;
    const { id } = params;
    const body = await request.json();

    const validation = await validateData(updateCommentSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const comment = await commentService.updateComment(
      id,
      user.userId,
      user.role,
      validation.data
    );

    return successResponse(comment, "Comment updated successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to update comment",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * DELETE /api/comments/:id
 * Delete comment
 */
async function deleteHandler(
  request: NextRequest,
  context: {
    user: { userId: string; email: string; role: string };
    params: { id: string };
  }
) {
  try {
    const { user, params } = context;
    const { id } = params;

    await commentService.deleteComment(id, user.userId, user.role);

    return noContentResponse();
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to delete comment",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Handler untuk GET dengan params
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const handlerWithParams = async (req: NextRequest) =>
    getHandler(req, { params });

  return errorHandler(loggingMiddleware(corsMiddleware(handlerWithParams)))(
    request
  );
}

// Handler untuk PUT dengan params
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const handlerWithParams = async (req: NextRequest) => {
    const authHandler = requireAuth(async (req: NextRequest, context: any) =>
      putHandler(req, { ...context, params })
    );
    return authHandler(request);
  };

  return errorHandler(loggingMiddleware(corsMiddleware(handlerWithParams)))(
    request
  );
}

// Handler untuk DELETE dengan params
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const handlerWithParams = async (req: NextRequest) => {
    const authHandler = requireAuth(async (req: NextRequest, context: any) =>
      deleteHandler(req, { ...context, params })
    );
    return authHandler(request);
  };

  return errorHandler(loggingMiddleware(corsMiddleware(handlerWithParams)))(
    request
  );
}
