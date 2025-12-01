import { NextRequest, NextResponse } from "next/server";
import enrollmentService from "@/services/enrollment.service";
import certificateService from "@/services/certificate.service";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";
import prisma from "@/lib/prisma";

/**
 * POST /api/enrollments/:id/certificate
 * Generate certificate for completed enrollment
 */
async function postHandler(
  request: NextRequest,
  user: { userId: string; email: string; role: string },
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: enrollmentId } = await context.params;

    // Get enrollment with progress
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            total_duration: true, // Sesuai dengan model Prisma
            sections: {
              include: {
                materials: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        progress_records: {
          // Sesuai dengan model Prisma
          where: {
            is_completed: true, // Sesuai dengan model Prisma
          },
        },
      },
    });

    if (!enrollment) {
      return errorResponse("Enrollment not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check authorization
    if (enrollment.user_id !== user.userId) {
      // Sesuai dengan model Prisma
      return errorResponse("Forbidden", HTTP_STATUS.FORBIDDEN);
    }

    // Check if enrollment is active or completed
    if (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED") {
      return errorResponse("Enrollment is not active", HTTP_STATUS.BAD_REQUEST);
    }

    // Check if course is 100% completed
    const totalMaterials = enrollment.course.sections.reduce(
      (total: number, section: any) => total + section.materials.length,
      0
    );
    const completedMaterials = enrollment.progress_records.length;
    const progressPercentage =
      totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;

    if (progressPercentage < 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Course not completed",
          data: {
            progress: progressPercentage,
            message:
              "You must complete 100% of the course to request a certificate",
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Update enrollment status to completed if not already
    if (enrollment.status !== "COMPLETED") {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "COMPLETED",
          completed_at: new Date(), // Sesuai dengan model Prisma
        },
      });
    }

    // Check if certificate already exists
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        user_id: user.userId, // Sesuai dengan model Prisma
        course_id: enrollment.course_id, // Sesuai dengan model Prisma
      },
    });

    if (existingCertificate) {
      return successResponse(existingCertificate, "Certificate already issued");
    }

    // Generate certificate
    const certificate = await prisma.certificate.create({
      data: {
        user_id: user.userId, // Sesuai dengan model Prisma
        course_id: enrollment.course_id, // Sesuai dengan model Prisma
        certificate_number: `CERT-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        status: "ISSUED",
        issued_at: new Date(), // Sesuai dengan model Prisma
        metadata: {
          courseTitle: enrollment.course.title,
          completedAt: new Date().toISOString(),
        },
      },
    });

    // Update enrollment with certificate ID
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        certificate_id: certificate.id, // Sesuai dengan model Prisma
      },
    });

    return successResponse(
      certificate,
      "Certificate generated successfully",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to generate certificate",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * GET /api/enrollments/:id/certificate
 * Get certificate for enrollment
 */
async function getHandler(
  request: NextRequest,
  user: { userId: string; email: string; role: string },
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: enrollmentId } = await context.params;

    // Get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        certificate: true,
      },
    });

    if (!enrollment) {
      return errorResponse("Enrollment not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check authorization
    if (enrollment.user_id !== user.userId) {
      // Sesuai dengan model Prisma
      return errorResponse("Forbidden", HTTP_STATUS.FORBIDDEN);
    }

    if (!enrollment.certificate) {
      return successResponse(null, "No certificate issued yet");
    }

    return successResponse(
      enrollment.certificate,
      "Certificate retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to fetch certificate",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply middlewares
async function authenticatedPostHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  // PERBAIKAN: Langsung gunakan authResult sebagai user
  return postHandler(request, authResult, context);
}

async function authenticatedGetHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  // PERBAIKAN: Langsung gunakan authResult sebagai user
  return getHandler(request, authResult, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (req: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return authenticatedPostHandler(rq, context);
      })(r);
    })(req);
  })(request);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (req: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return authenticatedGetHandler(rq, context);
      })(r);
    })(req);
  })(request);
}
