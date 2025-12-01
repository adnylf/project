import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  materials: Material[];
}

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  duration: number | null;
  order: number;
  is_free: boolean;
  video_id: string | null;
  document_url: string | null;
  resources: Resource[];
}

interface Resource {
  id: string;
  title: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
}

// Main handler function - PERBAIKAN: menerima context bukan user langsung
async function handler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  try {
    const { user } = context;

    if (user.role !== "ADMIN") {
      return errorResponse("Admin access required", HTTP_STATUS.FORBIDDEN);
    }

    // Extract courseId from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const courseId = pathSegments[pathSegments.length - 2]; // Get ID from /api/admin/courses/[id]/materials

    if (!courseId) {
      return errorResponse("Course ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Get course with sections and materials
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        status: true,
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
                document_url: true,
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

    // Admin can see all materials
    const sections = course.sections as Section[];

    return successResponse(
      {
        course: {
          id: course.id,
          title: course.title,
          status: course.status,
        },
        sections: sections.map((section: Section) => ({
          ...section,
          materials: section.materials.map((material: Material) => ({
            ...material,
            isLocked: false, // Admin sees everything unlocked
          })),
        })),
        totalSections: sections.length,
        totalMaterials: sections.reduce(
          (acc: number, s: Section) => acc + s.materials.length,
          0
        ),
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

// Apply authentication - PERBAIKAN: langsung gunakan requireAuth tanpa wrapper tambahan
const authenticatedHandler = requireAuth(handler);

// Export with proper middleware chain
export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
