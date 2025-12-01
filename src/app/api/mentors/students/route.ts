import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import mentorService from "@/services/mentor.service";
import { paginatedResponse, errorResponse } from "@/utils/response.util";
import { validatePagination } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";
import type { Prisma, EnrollmentStatus } from "@prisma/client";

/**
 * GET /api/mentors/students
 * Get all students enrolled in mentor's courses
 */
async function handler(request: NextRequest, user: any) {
  try {
    // Get mentor profile
    const mentor = await mentorService.getMentorByUserId(user.userId);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") as EnrollmentStatus | undefined;
    const courseId = searchParams.get("courseId") || undefined;
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Build where clause
    const where: Prisma.EnrollmentWhereInput = {
      course: {
        mentor_id: mentor.id,
      },
    };

    if (status) {
      where.status = status;
    }

    if (courseId) {
      where.course_id = courseId;
    }

    if (search) {
      where.user = {
        OR: [
          { full_name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Calculate skip
    const skip = (validatedPagination.page - 1) * validatedPagination.limit;

    // Get enrollments
    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: validatedPagination.limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          status: true,
          progress: true,
          completed_at: true,
          last_accessed_at: true,
          created_at: true,
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar_url: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
            },
          },
          certificate: {
            select: {
              id: true,
              certificate_number: true,
              issued_at: true,
            },
          },
          _count: {
            select: {
              progress_records: true,
            },
          },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return paginatedResponse(
      enrollments,
      {
        page: validatedPagination.page,
        limit: validatedPagination.limit,
        total,
      },
      "Students retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get students",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply middlewares and export
async function authenticatedHandler(
  request: NextRequest
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  return handler(request, authResult);
}

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
