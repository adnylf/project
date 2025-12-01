import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

async function handler(
  request: NextRequest,
  context: { user?: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Extract course ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const courseId = pathSegments[pathSegments.length - 2]; // Get ID from /api/courses/[id]/materials

    if (!courseId) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        status: true,
        is_free: true,
        price: true,
        sections: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            materials: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                duration: true,
                order: true,
                is_free: true,
                video_id: true,
                content: true,
                resources: {
                  select: {
                    id: true,
                    title: true,
                    file_url: true,
                    file_type: true,
                    file_size: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return errorResponse("Course not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check if user is enrolled
    let enrollment = null;
    if (user) {
      enrollment = await prisma.enrollment.findUnique({
        where: {
          user_id_course_id: {
            user_id: user.userId,
            course_id: courseId,
          },
        },
        select: {
          id: true,
          status: true,
          progress: true,
        },
      });
    }

    // Filter materials based on access
    const filteredSections = course.sections.map((section: any) => ({
      ...section,
      materials: section.materials.map((material: any) => {
        const hasAccess =
          material.is_free ||
          course.is_free ||
          (enrollment &&
            (enrollment.status === "ACTIVE" ||
              enrollment.status === "COMPLETED"));

        return {
          ...material,
          isLocked: !hasAccess,
          // Hide videoId and content if locked
          video_id: hasAccess ? material.video_id : null,
          content: hasAccess ? material.content : null,
          // Filter resources if locked
          resources: hasAccess ? material.resources : [],
        };
      }),
    }));

    return successResponse(
      {
        course: {
          id: course.id,
          title: course.title,
          status: course.status,
          is_free: course.is_free,
          price: course.price,
        },
        sections: filteredSections,
        enrollment,
      },
      "Course materials retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse(
      "Failed to get materials",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Handler dengan auth opsional - PERBAIKAN: panggil dengan context kosong
const optionalAuthHandler = async (request: NextRequest) => {
  try {
    // Coba dapatkan user, tapi tidak required
    const authHandler = requireAuth(handler);
    return authHandler(request);
  } catch {
    // Jika auth gagal, tetap lanjut tanpa user - PERBAIKAN: kirim context kosong
    return handler(request, {});
  }
};

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(optionalAuthHandler))
);
