import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

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
  isFree: boolean;
  videoId: string | null;
  contentUrl: string | null;
  resources: Resource[];
}

interface Resource {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
}

async function adminMaterialsHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request);
    const { id: courseId } = await context.params;

    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Admin access required', HTTP_STATUS.FORBIDDEN);
    }

    // Get course with sections and materials
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        status: true,
        sections: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            materials: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                duration: true,
                order: true,
                isFree: true,
                videoId: true,
                contentUrl: true,
                resources: {
                  select: {
                    id: true,
                    title: true,
                    fileUrl: true,
                    fileType: true,
                    fileSize: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return errorResponse('Course not found', HTTP_STATUS.NOT_FOUND);
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
        totalMaterials: sections.reduce((acc: number, s: Section) => acc + s.materials.length, 0),
      },
      'Course materials retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to get materials', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function authenticatedAdminMaterialsHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return adminMaterialsHandler(request, context);
}

export const GET = (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  errorHandler((req: NextRequest) =>
    loggingMiddleware((req2: NextRequest) =>
      corsMiddleware((req3: NextRequest) => authenticatedAdminMaterialsHandler(req3, context))(req2)
    )(req)
  )(request);
