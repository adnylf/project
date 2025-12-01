// app/api/courses/route.ts
import { NextRequest } from "next/server";
import courseService from "@/services/course.service";
import { createCourseSchema } from "@/lib/validation";
import type { CreateCourseInput } from "@/lib/validation";
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
 * GET /api/courses
 * Get all courses with filters and search
 */
async function getHandler(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const level = searchParams.get("level") || undefined;
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined;
    const isFree = searchParams.get("isFree")
      ? searchParams.get("isFree") === "true"
      : undefined;
    const isPremium = searchParams.get("isPremium")
      ? searchParams.get("isPremium") === "true"
      : undefined;
    const status = searchParams.get("status") || undefined;
    const mentorId = searchParams.get("mentorId") || undefined;
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Get courses
    const result = await courseService.getAllCourses({
      page: validatedPagination.page,
      limit: validatedPagination.limit,
      search,
      categoryId,
      level: level as any,
      minPrice,
      maxPrice,
      isFree,
      isPremium,
      status: status as any,
      mentorId,
      sortBy,
      sortOrder,
    });

    return paginatedResponse(
      result.data,
      result.meta,
      "Courses retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get courses",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * POST /api/courses
 * Create new course (mentor only)
 */
async function postHandler(request: NextRequest, { user }: { user: any }) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", HTTP_STATUS.BAD_REQUEST);
    }

    // Validate input
    const validation = await validateData(createCourseSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // PERBAIKAN: Pastikan semua field boolean memiliki nilai default
    const courseData: CreateCourseInput = {
      ...validation.data,
      language: validation.data.language || "id",
      isFree: validation.data.isFree ?? false,
      isPremium: validation.data.isPremium ?? false, // PERBAIKAN: Tambah default untuk isPremium
      requirements: validation.data.requirements || [],
      whatYouWillLearn: validation.data.whatYouWillLearn || [],
      targetAudience: validation.data.targetAudience || [],
      tags: validation.data.tags || [],
    };

    // Create course
    const course = await courseService.createCourse(user.userId, courseData);

    return successResponse(
      course,
      "Course created successfully",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to create course",
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
