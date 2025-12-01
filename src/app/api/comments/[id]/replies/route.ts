import { NextRequest, NextResponse } from "next/server";
import commentService from "@/services/comment.service";
import { createCommentSchema } from "@/lib/validation";
import {
  paginatedResponse,
  successResponse,
  validationErrorResponse,
  errorResponse,
} from "@/utils/response.util";
import { validateData, validatePagination } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/comments/:id/replies
 * Get all replies for a comment
 */
async function getHandler(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const { id: commentId } = params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const validatedPagination = validatePagination(page, limit);

    const result = await commentService.getCommentReplies(commentId, {
      page: validatedPagination.page,
      limit: validatedPagination.limit,
    });

    return paginatedResponse(
      result.data,
      result.meta,
      "Replies retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get replies",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * POST /api/comments/:id/replies
 * Reply to a comment
 */
async function postHandler(
  request: NextRequest,
  context: {
    user: { userId: string; email: string; role: string };
    params: { id: string };
  }
) {
  try {
    const { user, params } = context;
    const { id: parentId } = params;

    // Get parent comment to get material_id
    const parentComment = await commentService.getCommentById(parentId);

    const body = await request.json();
    // Perbaikan: gunakan material_id yang benar dari parent comment
    const dataWithParent = {
      ...body,
      materialId: parentComment.material_id, // Use material_id from the comment
      parentId,
    };

    const validation = await validateData(createCommentSchema, dataWithParent);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const reply = await commentService.createComment(
      user.userId,
      validation.data
    );

    return successResponse(
      reply,
      "Reply added successfully",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to add reply",
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

// Handler untuk POST dengan params
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const handlerWithParams = async (req: NextRequest) => {
    const authHandler = requireAuth(async (req: NextRequest, context: any) =>
      postHandler(req, { ...context, params })
    );
    return authHandler(request);
  };

  return errorHandler(loggingMiddleware(corsMiddleware(handlerWithParams)))(
    request
  );
}
