import { NextRequest, NextResponse } from "next/server";
import sectionService from "@/services/section.service";
import { createMaterialSchema } from "@/lib/validation";
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
} from "@/utils/response.util";
import { validateData } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { ForbiddenError } from "@/utils/error.util";
import { USER_ROLES } from "@/lib/constants";

/**
 * GET /api/sections/:id/materials
 * Get all materials in a section
 */
async function getHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await context.params;

    // Get materials
    const materials = await sectionService.getSectionMaterials(sectionId);

    return successResponse(materials, "Materials retrieved successfully");
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

/**
 * POST /api/sections/:id/materials
 * Add new material to section
 */
async function postHandler(
  request: NextRequest,
  user: any,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await context.params;

    // Check section ownership
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          include: { mentor: true },
        },
      },
    });

    if (!section) {
      return errorResponse("Section not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check permission
    if (
      user.role !== USER_ROLES.ADMIN &&
      section.course.mentor.userId !== user.userId
    ) {
      throw new ForbiddenError(
        "You do not have permission to add materials to this section"
      );
    }

    // Parse request body
    const body = await request.json();

    // Add sectionId to body
    const dataWithSectionId = { ...body, sectionId };

    // Validate input
    const validation = await validateData(
      createMaterialSchema,
      dataWithSectionId
    );

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Get next order number if not provided
    let order = validation.data.order;
    if (order === undefined) {
      const lastMaterial = await prisma.material.findFirst({
        where: { sectionId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (lastMaterial?.order ?? -1) + 1;
    }

    // Create material
    const material = await prisma.material.create({
      data: {
        ...validation.data,
        order,
      },
      include: {
        resources: true,
      },
    });

    // Update section duration
    await sectionService.updateSectionDuration(sectionId);

    return successResponse(
      material,
      "Material created successfully",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to create material",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply middlewares and export
async function authenticatedPostHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  return postHandler(request, authResult, context);
}

// Properly typed exports
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (req: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return getHandler(rq, context);
      })(r);
    })(req);
  })(request);
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
