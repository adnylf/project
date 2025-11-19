import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

interface Resource {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
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
  content: string | null;
  resources: Resource[];
}

interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  materials: Material[];
}

async function materialsHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request);
    const { id: courseId } = await context.params;

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
                content: true,
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

    const sections = course.sections as unknown as Section[];

    if (user) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.userId,
            courseId,
          },
        },
        select: {
          id: true,
          status: true,
          progress: true,
        },
      });

      const filteredSections = sections.map((section) => ({
        ...section,
        materials: section.materials.map((material) => {
          const isAccessible =
            material.isFree ||
            enrollment?.status === 'ACTIVE' ||
            enrollment?.status === 'COMPLETED';

          return {
            ...material,
            isLocked: !isAccessible,
            videoId: isAccessible ? material.videoId : null,
            content: isAccessible ? material.content : null,
          };
        }),
      }));

      return successResponse(
        {
          course: {
            id: course.id,
            title: course.title,
            status: course.status,
          },
          sections: filteredSections,
          enrollment,
        },
        'Course materials retrieved successfully'
      );
    }

    const filteredSections = sections.map((section) => ({
      ...section,
      materials: section.materials.map((material) => ({
        ...material,
        isLocked: !material.isFree,
        videoId: material.isFree ? material.videoId : null,
        content: material.isFree ? material.content : null,
      })),
    }));

    return successResponse(
      {
        course: {
          id: course.id,
          title: course.title,
          status: course.status,
        },
        sections: filteredSections,
        enrollment: null,
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

async function optionalAuthMaterialsHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await authMiddleware(request);
  return materialsHandler(request, context);
}

export const GET = (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  errorHandler((req: NextRequest) =>
    loggingMiddleware((req2: NextRequest) =>
      corsMiddleware((req3: NextRequest) => optionalAuthMaterialsHandler(req3, context))(req2)
    )(req)
  )(request);
