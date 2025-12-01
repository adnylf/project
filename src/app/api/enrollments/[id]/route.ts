import { NextRequest, NextResponse } from "next/server";
import enrollmentService from "@/services/enrollment.service";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

async function handler(
  request: NextRequest,
  user: { userId: string; email: string; role: string },
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: enrollmentId } = await context.params;

    const enrollment = await enrollmentService.getEnrollmentById(
      enrollmentId,
      user.userId
    );

    return successResponse(enrollment, "Enrollment retrieved successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse(
      "Failed to get enrollment",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

async function authenticatedHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  // PERBAIKAN: Langsung gunakan authResult sebagai user
  return handler(request, authResult, context);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (req: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return authenticatedHandler(rq, context);
      })(r);
    })(req);
  })(request);
}
