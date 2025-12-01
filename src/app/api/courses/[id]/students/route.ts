// app/api/courses/[id]/students/route.ts
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response.util"; // PERBAIKAN: Gunakan successResponse bukan paginatedResponse
import { validatePagination } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS, USER_ROLES } from "@/lib/constants";

async function handler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Extract course ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const courseId = pathSegments[pathSegments.length - 2]; // Get ID from /api/courses/[id]/students

    if (!courseId) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        mentor: {
          select: {
            user_id: true, // PERBAIKAN: Gunakan snake_case
          },
        },
      },
    });

    if (!course) {
      return errorResponse("Course not found", HTTP_STATUS.NOT_FOUND);
    }

    if (
      user.role !== USER_ROLES.ADMIN &&
      course.mentor.user_id !== user.userId // PERBAIKAN: Gunakan snake_case
    ) {
      return errorResponse(
        "Only course mentor or admin can view students",
        HTTP_STATUS.FORBIDDEN
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const validatedPagination = validatePagination(page, limit);

    const where: any = { course_id: courseId }; // PERBAIKAN: Gunakan snake_case

    if (status) {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { full_name: { contains: search, mode: "insensitive" } }, // PERBAIKAN: Gunakan snake_case
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const skip = (validatedPagination.page - 1) * validatedPagination.limit;

    const [enrollments, total, stats] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: validatedPagination.limit,
        orderBy: { created_at: "desc" }, // PERBAIKAN: Gunakan snake_case
        include: {
          user: {
            select: {
              id: true,
              full_name: true, // PERBAIKAN: Gunakan snake_case
              email: true,
              avatar_url: true, // PERBAIKAN: Gunakan snake_case
            },
          },
          certificate: {
            select: {
              id: true,
              certificate_number: true, // PERBAIKAN: Gunakan snake_case
              issued_at: true, // PERBAIKAN: Gunakan snake_case
            },
          },
        },
      }),
      prisma.enrollment.count({ where }),
      prisma.enrollment.groupBy({
        by: ["status"],
        where: { course_id: courseId }, // PERBAIKAN: Gunakan snake_case
        _count: true,
        _avg: { progress: true },
      }),
    ]);

    // Enrich enrollments with progress data
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const completedMaterials = await prisma.progress.count({
          where: {
            enrollment_id: enrollment.id, // PERBAIKAN: Gunakan snake_case
            is_completed: true, // PERBAIKAN: Gunakan snake_case
          },
        });

        const lastProgress = await prisma.progress.findFirst({
          where: { enrollment_id: enrollment.id }, // PERBAIKAN: Gunakan snake_case
          orderBy: { updated_at: "desc" }, // PERBAIKAN: Gunakan snake_case
          include: {
            material: {
              select: {
                title: true,
                type: true,
              },
            },
          },
        });

        return {
          ...enrollment,
          completedMaterials,
          lastAccessedMaterial: lastProgress?.material || null,
        };
      })
    );

    const enrollmentStats = {
      total,
      byStatus: Object.fromEntries(
        stats.map((stat: any) => [
          stat.status,
          { count: stat._count, avgProgress: stat._avg.progress || 0 },
        ])
      ),
    };

    // PERBAIKAN: Kembalikan data menggunakan successResponse bukan paginatedResponse
    return successResponse(
      {
        enrollments: enrichedEnrollments,
        stats: enrollmentStats,
        pagination: {
          page: validatedPagination.page,
          limit: validatedPagination.limit,
          total,
          totalPages: Math.ceil(total / validatedPagination.limit),
        },
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

// Gunakan requireAuth untuk wrap handler
const authenticatedHandler = requireAuth(handler);

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
