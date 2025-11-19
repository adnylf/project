import prisma from '@/lib/prisma';
import { NotFoundError, ForbiddenError, AppError } from '@/utils/error.util';
import { HTTP_STATUS, USER_ROLES } from '@/lib/constants';
import type { MaterialType } from '@prisma/client';

/**
 * Material Creation Data
 */
interface CreateMaterialData {
  sectionId: string;
  title: string;
  description?: string;
  type: MaterialType;
  content?: string;
  documentUrl?: string;
  duration?: number;
  order?: number;
  isFree?: boolean;
}

/**
 * Material Update Data
 */
interface UpdateMaterialData {
  title?: string;
  description?: string;
  content?: string;
  documentUrl?: string;
  duration?: number;
  order?: number;
  isFree?: boolean;
}

/**
 * Material Reorder Data
 */
interface ReorderMaterialData {
  id: string;
  order: number;
}

/**
 * Material Service
 * Handles course material operations
 */
export class MaterialService {
  /**
   * Create new material
   */
  async createMaterial(userId: string, userRole: string, data: CreateMaterialData) {
    // Check section ownership
    const section = await prisma.section.findUnique({
      where: { id: data.sectionId },
      include: {
        course: {
          include: { mentor: true },
        },
      },
    });

    if (!section) {
      throw new NotFoundError('Section not found');
    }

    // Check permission
    if (userRole !== USER_ROLES.ADMIN && section.course.mentor.userId !== userId) {
      throw new ForbiddenError('You do not have permission to add materials to this section');
    }

    // Get next order number if not provided
    let order = data.order;
    if (order === undefined) {
      const lastMaterial = await prisma.material.findFirst({
        where: { sectionId: data.sectionId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = (lastMaterial?.order ?? -1) + 1;
    }

    // Create material
    const material = await prisma.material.create({
      data: {
        sectionId: data.sectionId,
        title: data.title,
        description: data.description,
        type: data.type,
        content: data.content,
        documentUrl: data.documentUrl,
        duration: data.duration || 0,
        order,
        isFree: data.isFree || false,
      },
      include: {
        video: true,
        resources: true,
      },
    });

    // Update section duration
    await this.updateSectionDuration(data.sectionId);

    return material;
  }

  /**
   * Get material by ID
   */
  async getMaterialById(materialId: string) {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        section: {
          include: {
            course: {
              include: {
                mentor: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        profilePicture: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        video: {
          select: {
            id: true,
            filename: true,
            path: true,
            duration: true,
            thumbnail: true,
            status: true,
            qualities: {
              select: {
                quality: true,
                path: true,
                size: true,
                resolution: true,
              },
            },
          },
        },
        resources: true,
      },
    });

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    return material;
  }

  /**
   * Update material
   */
  async updateMaterial(
    materialId: string,
    userId: string,
    userRole: string,
    data: UpdateMaterialData
  ) {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        section: {
          include: {
            course: {
              include: { mentor: true },
            },
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    // Check permission
    if (userRole !== USER_ROLES.ADMIN && material.section.course.mentor.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this material');
    }

    const updated = await prisma.material.update({
      where: { id: materialId },
      data,
      include: {
        video: true,
        resources: true,
      },
    });

    // Update section duration if duration changed
    if (data.duration !== undefined) {
      await this.updateSectionDuration(material.sectionId);
    }

    return updated;
  }

  /**
   * Delete material
   */
  async deleteMaterial(materialId: string, userId: string, userRole: string) {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        section: {
          include: {
            course: {
              include: { mentor: true },
            },
          },
        },
        video: true,
        resources: true,
      },
    });

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    // Check permission
    if (userRole !== USER_ROLES.ADMIN && material.section.course.mentor.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this material');
    }

    // Delete associated video if exists
    if (material.video) {
      await prisma.video.delete({
        where: { id: material.video.id },
      });
    }

    // Delete associated resources
    if (material.resources.length > 0) {
      await prisma.resource.deleteMany({
        where: { materialId },
      });
    }

    // Delete material
    await prisma.material.delete({
      where: { id: materialId },
    });

    // Reorder remaining materials
    await this.reorderMaterialsAfterDelete(material.sectionId, material.order);

    // Update section duration
    await this.updateSectionDuration(material.sectionId);

    return { id: materialId, deleted: true };
  }

  /**
   * Reorder materials
   */
  async reorderMaterials(
    sectionId: string,
    userId: string,
    userRole: string,
    materials: ReorderMaterialData[]
  ) {
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
      throw new NotFoundError('Section not found');
    }

    // Check permission
    if (userRole !== USER_ROLES.ADMIN && section.course.mentor.userId !== userId) {
      throw new ForbiddenError('You do not have permission to reorder materials');
    }

    // Update material orders in transaction
    await prisma.$transaction(
      materials.map((material) =>
        prisma.material.update({
          where: { id: material.id },
          data: { order: material.order },
        })
      )
    );

    // Get updated materials
    return this.getSectionMaterials(sectionId);
  }

  /**
   * Get section materials
   */
  async getSectionMaterials(sectionId: string) {
    const materials = await prisma.material.findMany({
      where: { sectionId },
      orderBy: { order: 'asc' },
      include: {
        video: {
          select: {
            id: true,
            filename: true,
            duration: true,
            thumbnail: true,
            status: true,
          },
        },
        resources: true,
      },
    });

    return materials;
  }

  /**
   * Get material resources
   */
  async getMaterialResources(materialId: string) {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        resources: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    return material.resources;
  }

  /**
   * Add resource to material
   */
  async addResource(
    materialId: string,
    userId: string,
    userRole: string,
    data: {
      title: string;
      description?: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }
  ) {
    // Check material ownership
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        section: {
          include: {
            course: {
              include: { mentor: true },
            },
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    // Check permission
    if (userRole !== USER_ROLES.ADMIN && material.section.course.mentor.userId !== userId) {
      throw new ForbiddenError('You do not have permission to add resources');
    }

    const resource = await prisma.resource.create({
      data: {
        materialId,
        ...data,
      },
    });

    return resource;
  }

  /**
   * Delete resource
   */
  async deleteResource(resourceId: string, userId: string, userRole: string) {
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        material: {
          include: {
            section: {
              include: {
                course: {
                  include: { mentor: true },
                },
              },
            },
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    // Check permission
    if (
      userRole !== USER_ROLES.ADMIN &&
      resource.material.section.course.mentor.userId !== userId
    ) {
      throw new ForbiddenError('You do not have permission to delete this resource');
    }

    await prisma.resource.delete({
      where: { id: resourceId },
    });

    return { id: resourceId, deleted: true };
  }

  /**
   * Link video to material
   */
  async linkVideoToMaterial(materialId: string, videoId: string, userId: string, userRole: string) {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        section: {
          include: {
            course: {
              include: { mentor: true },
            },
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    // Check permission
    if (userRole !== USER_ROLES.ADMIN && material.section.course.mentor.userId !== userId) {
      throw new ForbiddenError('You do not have permission to link video');
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundError('Video not found');
    }

    // Update material with video
    const updated = await prisma.material.update({
      where: { id: materialId },
      data: {
        videoId,
        duration: video.duration || 0,
      },
      include: {
        video: true,
      },
    });

    // Update section duration
    await this.updateSectionDuration(material.sectionId);

    return updated;
  }

  /**
   * Reorder materials after deletion
   */
  private async reorderMaterialsAfterDelete(sectionId: string, deletedOrder: number) {
    await prisma.material.updateMany({
      where: {
        sectionId,
        order: { gt: deletedOrder },
      },
      data: {
        order: { decrement: 1 },
      },
    });
  }

  /**
   * Update section duration
   */
  private async updateSectionDuration(sectionId: string) {
    const materials = await prisma.material.findMany({
      where: { sectionId },
      select: { duration: true },
    });

    const totalDuration = materials.reduce((sum, material) => sum + material.duration, 0);

    await prisma.section.update({
      where: { id: sectionId },
      data: { duration: totalDuration },
    });

    return totalDuration;
  }
}

const materialService = new MaterialService();
export default materialService;
