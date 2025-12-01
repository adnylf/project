import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";
import type { Category } from "@prisma/client";

/**
 * GET /api/courses/categories
 * Get all course categories (hierarchical structure)
 */
async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Build where clause
    const where = includeInactive ? {} : { is_active: true };

    // Get all categories
    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        children: {
          where: includeInactive ? {} : { is_active: true },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    // Organize into parent-child structure
    const rootCategories = categories.filter((cat: Category) => !cat.parent_id);
    const organizedCategories = rootCategories.map((parent: Category) => ({
      ...parent,
      children: categories.filter(
        (cat: Category) => cat.parent_id === parent.id
      ),
    }));

    return successResponse(
      {
        categories: organizedCategories,
        total: categories.length,
        rootCount: rootCategories.length,
      },
      "Categories retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get categories",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(handler)));
