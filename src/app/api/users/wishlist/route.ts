import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  paginatedResponse,
  errorResponse,
} from "@/utils/response.util";
import { validatePagination } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/users/wishlist
 * Get user wishlist
 */
async function getHandler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Calculate skip
    const skip = (validatedPagination.page - 1) * validatedPagination.limit;

    // Get wishlist
    const [wishlist, total] = await Promise.all([
      prisma.wishlist.findMany({
        where: { user_id: user.userId },
        skip,
        take: validatedPagination.limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          created_at: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              short_description: true,
              level: true,
              price: true,
              discount_price: true,
              is_free: true,
              average_rating: true,
              total_students: true,
              mentor: {
                select: {
                  user: {
                    select: {
                      full_name: true,
                      avatar_url: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.wishlist.count({ where: { user_id: user.userId } }),
    ]);

    return paginatedResponse(
      wishlist,
      {
        page: validatedPagination.page,
        limit: validatedPagination.limit,
        total,
      },
      "Wishlist retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get wishlist",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * POST /api/users/wishlist
 * Add course to wishlist
 */
async function postHandler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(
        "Invalid JSON in request body",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const { courseId } = body;

    if (!courseId) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return errorResponse("Course not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check if already in wishlist
    const existingWishlist = await prisma.wishlist.findUnique({
      where: {
        user_id_course_id: {
          user_id: user.userId,
          course_id: courseId,
        },
      },
    });

    if (existingWishlist) {
      return errorResponse("Course already in wishlist", HTTP_STATUS.CONFLICT);
    }

    // Check if already enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        user_id_course_id: {
          user_id: user.userId,
          course_id: courseId,
        },
      },
    });

    if (enrollment) {
      return errorResponse(
        "You are already enrolled in this course",
        HTTP_STATUS.CONFLICT
      );
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlist.create({
      data: {
        user_id: user.userId,
        course_id: courseId,
      },
      select: {
        id: true,
        created_at: true,
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            price: true,
          },
        },
      },
    });

    return successResponse(
      wishlistItem,
      "Course added to wishlist",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to add to wishlist",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply authentication
const authenticatedGetHandler = requireAuth(getHandler);
const authenticatedPostHandler = requireAuth(postHandler);

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedGetHandler))
);
export const POST = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedPostHandler))
);
