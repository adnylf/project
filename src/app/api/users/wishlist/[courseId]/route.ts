import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { noContentResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * DELETE /api/users/wishlist/:courseId
 * Remove course from wishlist
 */
async function handler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Extract courseId from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const courseId = pathSegments[pathSegments.length - 1];

    if (!courseId) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Check if exists in wishlist
    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        user_id_course_id: {
          user_id: user.userId,
          course_id: courseId,
        },
      },
    });

    if (!wishlistItem) {
      return errorResponse("Course not in wishlist", HTTP_STATUS.NOT_FOUND);
    }

    // Remove from wishlist
    await prisma.wishlist.delete({
      where: { id: wishlistItem.id },
    });

    return noContentResponse();
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to remove from wishlist",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply authentication
const authenticatedHandler = requireAuth(handler);

export const DELETE = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
