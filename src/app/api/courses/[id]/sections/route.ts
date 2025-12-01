import { NextRequest } from "next/server";
import sectionService from "@/services/section.service";
import { createSectionSchema } from "@/lib/validation";
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
} from "@/utils/response.util";
import { validateData } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/courses/:id/sections
 * Get all sections for a course
 */
async function getHandler(request: NextRequest) {
  try {
    // Extract course ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const courseId = pathSegments[pathSegments.length - 2]; // Get ID from /api/courses/[id]/sections

    if (!courseId) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Get sections
    const sections = await sectionService.getCourseSections(courseId);

    return successResponse(sections, "Sections retrieved successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get sections",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * POST /api/courses/:id/sections
 * Create new section for a course
 */
async function postHandler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Extract course ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const courseId = pathSegments[pathSegments.length - 2]; // Get ID from /api/courses/[id]/sections

    if (!courseId) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", HTTP_STATUS.BAD_REQUEST);
    }

    // Add courseId to body
    const dataWithCourseId = { ...body, courseId };

    // Validate input
    const validation = await validateData(
      createSectionSchema,
      dataWithCourseId
    );

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Create section
    const section = await sectionService.createSection(
      user.userId,
      user.role,
      validation.data
    );

    return successResponse(
      section,
      "Section created successfully",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to create section",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Gunakan requireAuth untuk POST handler
const authenticatedPostHandler = requireAuth(postHandler);

export const GET = errorHandler(loggingMiddleware(corsMiddleware(getHandler)));

export const POST = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedPostHandler))
);
