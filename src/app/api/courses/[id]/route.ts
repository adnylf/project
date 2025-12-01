// app/api/courses/[id]/route.ts
import { NextRequest } from "next/server";
import courseService from "@/services/course.service";
import { updateCourseSchema } from "@/lib/validation";
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  noContentResponse,
} from "@/utils/response.util";
import { validateData } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import {
  requireAuth,
  requireAuthWithParams,
} from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/courses/:id
 * Get course details by ID
 */
async function getHandler(
  request: NextRequest,
  context: {
    params: { id: string };
    user?: { userId: string; email: string; role: string };
  }
) {
  try {
    const { params } = context;
    const id = params.id;

    if (!id) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Check if user is authenticated to see draft courses
    const includePrivate = !!context.user;

    // Get course
    const course = await courseService.getCourseById(id, includePrivate);

    return successResponse(course, "Course retrieved successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse(
      "Failed to get course",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * PUT /api/courses/:id
 * Update course
 */
async function putHandler(
  request: NextRequest,
  context: {
    params: { id: string };
    user: { userId: string; email: string; role: string };
  }
) {
  try {
    const { params, user } = context;
    const id = params.id;

    if (!id) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", HTTP_STATUS.BAD_REQUEST);
    }

    // Handle discount_price conversion from null to undefined
    const cleanedBody = {
      ...body,
      discountPrice:
        body.discountPrice === null ? undefined : body.discountPrice,
    };

    // Validate input
    const validation = await validateData(updateCourseSchema, cleanedBody);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Update course
    const course = await courseService.updateCourse(
      id,
      user.userId,
      user.role,
      validation.data
    );

    return successResponse(course, "Course updated successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to update course",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * DELETE /api/courses/:id
 * Delete course
 */
async function deleteHandler(
  request: NextRequest,
  context: {
    params: { id: string };
    user: { userId: string; email: string; role: string };
  }
) {
  try {
    const { params, user } = context;
    const id = params.id;

    if (!id) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Delete course
    await courseService.deleteCourse(id, user.userId, user.role);

    return noContentResponse();
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to delete course",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// PERBAIKAN: Buat wrapper function yang sesuai untuk setiap method
const getHandlerWrapper = async (
  request: NextRequest,
  context: { params: { id: string } }
) => {
  return getHandler(request, { ...context, user: undefined });
};

const putHandlerWrapper = async (
  request: NextRequest,
  context: { params: { id: string } }
) => {
  const authHandler = requireAuthWithParams(putHandler);
  return authHandler(request, context);
};

const deleteHandlerWrapper = async (
  request: NextRequest,
  context: { params: { id: string } }
) => {
  const authHandler = requireAuthWithParams(deleteHandler);
  return authHandler(request, context);
};

// PERBAIKAN: Alternatif lebih sederhana - gunakan requireAuth biasa dan extract params dari URL
async function authenticatedPutHandler(request: NextRequest) {
  const authHandler = requireAuth(
    async (request: NextRequest, { user }: { user: any }) => {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split("/");
      const id = pathSegments[pathSegments.length - 1];

      return putHandler(request, { params: { id }, user });
    }
  );

  return authHandler(request);
}

async function authenticatedDeleteHandler(request: NextRequest) {
  const authHandler = requireAuth(
    async (request: NextRequest, { user }: { user: any }) => {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split("/");
      const id = pathSegments[pathSegments.length - 1];

      return deleteHandler(request, { params: { id }, user });
    }
  );

  return authHandler(request);
}

async function getHandlerWithAuth(request: NextRequest) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/");
  const id = pathSegments[pathSegments.length - 1];

  return getHandler(request, { params: { id }, user: undefined });
}

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(getHandlerWithAuth))
);

export const PUT = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedPutHandler))
);

export const DELETE = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedDeleteHandler))
);
