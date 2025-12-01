// services/material.service.ts
import prisma from "@/lib/prisma";
import { NotFoundError, ForbiddenError, AppError } from "@/utils/error.util";
import { HTTP_STATUS, USER_ROLES, MATERIAL_TYPE } from "@/lib/constants";
import type { MaterialType } from "@prisma/client";

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
  type?: MaterialType; // Ditambahkan untuk mengatasi error
}

/**
 * Material Reorder Data
 */
interface ReorderMaterialData {
  id: string;
  order: number;
}

/**
 * Resource Creation Data
 */
interface CreateResourceData {
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

/**
 * Material Service
 * Handles course material operations
 */
export class MaterialService {
  /**
   * Create new material
   */
  async createMaterial(
    userId: string,
    userRole: string,
    data: CreateMaterialData
  ) {
    try {
      console.log("📝 Creating material for section:", data.sectionId);

      // Check section ownership
      const section = await prisma.section.findUnique({
        where: { id: data.sectionId },
        include: {
          course: true,
        },
      });

      if (!section) {
        throw new NotFoundError("Section not found");
      }

      // Check permission - mentor must own the course or be admin
      if (userRole !== USER_ROLES.ADMIN && section.course.mentorId !== userId) {
        throw new ForbiddenError(
          "You do not have permission to add materials to this section"
        );
      }

      // Get next order number if not provided
      let order = data.order;
      if (order === undefined) {
        const lastMaterial = await prisma.material.findFirst({
          where: { sectionId: data.sectionId },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        order = (lastMaterial?.order ?? -1) + 1;
      }

      // Validate material type specific requirements
      this.validateMaterialData(data);

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
          resources: {
            orderBy: { createdAt: "asc" },
          },
          section: {
            include: {
              course: {
                include: {
                  mentor: {
                    select: {
                      id: true,
                      user: {
                        select: {
                          name: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Update section duration
      await this.updateSectionDuration(data.sectionId);

      // Update course total duration and lectures count
      await this.updateCourseContentStats(section.courseId);

      console.log("✅ Material created successfully:", material.id);

      return material;
    } catch (error) {
      console.error("❌ Failed to create material:", error);
      throw error;
    }
  }

  /**
   * Get material by ID
   */
  async getMaterialById(materialId: string) {
    try {
      console.log("🔍 Getting material by ID:", materialId);

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
          resources: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!material) {
        throw new NotFoundError("Material not found");
      }

      console.log("✅ Material retrieved successfully:", materialId);

      return material;
    } catch (error) {
      console.error("❌ Failed to get material:", error);
      throw error;
    }
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
    try {
      console.log("📝 Updating material:", materialId);

      const material = await prisma.material.findUnique({
        where: { id: materialId },
        include: {
          section: {
            include: {
              course: true,
            },
          },
        },
      });

      if (!material) {
        throw new NotFoundError("Material not found");
      }

      // Check permission
      if (
        userRole !== USER_ROLES.ADMIN &&
        material.section.course.mentorId !== userId
      ) {
        throw new ForbiddenError(
          "You do not have permission to update this material"
        );
      }

      // Validate material type specific requirements if type is being changed
      if (data.type) {
        this.validateMaterialData({
          ...material,
          ...data,
        } as CreateMaterialData);
      }

      const updated = await prisma.material.update({
        where: { id: materialId },
        data,
        include: {
          video: true,
          resources: {
            orderBy: { createdAt: "asc" },
          },
          section: {
            include: {
              course: true,
            },
          },
        },
      });

      // Update section duration if duration changed
      if (data.duration !== undefined) {
        await this.updateSectionDuration(material.sectionId);
        await this.updateCourseContentStats(material.section.courseId);
      }

      console.log("✅ Material updated successfully:", materialId);

      return updated;
    } catch (error) {
      console.error("❌ Failed to update material:", error);
      throw error;
    }
  }

  /**
   * Delete material
   */
  async deleteMaterial(materialId: string, userId: string, userRole: string) {
    try {
      console.log("🗑️ Deleting material:", materialId);

      const material = await prisma.material.findUnique({
        where: { id: materialId },
        include: {
          section: {
            include: {
              course: true,
            },
          },
          video: true,
          resources: true,
        },
      });

      if (!material) {
        throw new NotFoundError("Material not found");
      }

      // Check permission
      if (
        userRole !== USER_ROLES.ADMIN &&
        material.section.course.mentorId !== userId
      ) {
        throw new ForbiddenError(
          "You do not have permission to delete this material"
        );
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
      await this.reorderMaterialsAfterDelete(
        material.sectionId,
        material.order
      );

      // Update section duration and course stats
      await this.updateSectionDuration(material.sectionId);
      await this.updateCourseContentStats(material.section.courseId);

      console.log("✅ Material deleted successfully:", materialId);

      return { id: materialId, deleted: true };
    } catch (error) {
      console.error("❌ Failed to delete material:", error);
      throw error;
    }
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
    try {
      console.log("🔄 Reordering materials for section:", sectionId);

      // Check section ownership
      const section = await prisma.section.findUnique({
        where: { id: sectionId },
        include: {
          course: true,
        },
      });

      if (!section) {
        throw new NotFoundError("Section not found");
      }

      // Check permission
      if (userRole !== USER_ROLES.ADMIN && section.course.mentorId !== userId) {
        throw new ForbiddenError(
          "You do not have permission to reorder materials"
        );
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
      const updatedMaterials = await this.getSectionMaterials(sectionId);

      console.log(
        "✅ Materials reordered successfully for section:",
        sectionId
      );

      return updatedMaterials;
    } catch (error) {
      console.error("❌ Failed to reorder materials:", error);
      throw error;
    }
  }

  /**
   * Get section materials
   */
  async getSectionMaterials(sectionId: string) {
    try {
      console.log("🔍 Getting materials for section:", sectionId);

      const materials = await prisma.material.findMany({
        where: { sectionId },
        orderBy: { order: "asc" },
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
          resources: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      console.log(
        "✅ Retrieved materials for section:",
        sectionId,
        "count:",
        materials.length
      );

      return materials;
    } catch (error) {
      console.error("❌ Failed to get section materials:", error);
      throw error;
    }
  }

  /**
   * Get material resources
   */
  async getMaterialResources(materialId: string) {
    try {
      console.log("🔍 Getting resources for material:", materialId);

      const material = await prisma.material.findUnique({
        where: { id: materialId },
        include: {
          resources: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!material) {
        throw new NotFoundError("Material not found");
      }

      console.log(
        "✅ Retrieved resources for material:",
        materialId,
        "count:",
        material.resources.length
      );

      return material.resources;
    } catch (error) {
      console.error("❌ Failed to get material resources:", error);
      throw error;
    }
  }

  /**
   * Add resource to material
   */
  async addResource(
    materialId: string,
    userId: string,
    userRole: string,
    data: CreateResourceData
  ) {
    try {
      console.log("📎 Adding resource to material:", materialId);

      // Check material ownership
      const material = await prisma.material.findUnique({
        where: { id: materialId },
        include: {
          section: {
            include: {
              course: true,
            },
          },
        },
      });

      if (!material) {
        throw new NotFoundError("Material not found");
      }

      // Check permission
      if (
        userRole !== USER_ROLES.ADMIN &&
        material.section.course.mentorId !== userId
      ) {
        throw new ForbiddenError("You do not have permission to add resources");
      }

      const resource = await prisma.resource.create({
        data: {
          materialId,
          ...data,
        },
      });

      console.log("✅ Resource added successfully:", resource.id);

      return resource;
    } catch (error) {
      console.error("❌ Failed to add resource:", error);
      throw error;
    }
  }

  /**
   * Delete resource
   */
  async deleteResource(resourceId: string, userId: string, userRole: string) {
    try {
      console.log("🗑️ Deleting resource:", resourceId);

      const resource = await prisma.resource.findUnique({
        where: { id: resourceId },
        include: {
          material: {
            include: {
              section: {
                include: {
                  course: true,
                },
              },
            },
          },
        },
      });

      if (!resource) {
        throw new NotFoundError("Resource not found");
      }

      // Check permission
      if (
        userRole !== USER_ROLES.ADMIN &&
        resource.material.section.course.mentorId !== userId
      ) {
        throw new ForbiddenError(
          "You do not have permission to delete this resource"
        );
      }

      await prisma.resource.delete({
        where: { id: resourceId },
      });

      console.log("✅ Resource deleted successfully:", resourceId);

      return { id: resourceId, deleted: true };
    } catch (error) {
      console.error("❌ Failed to delete resource:", error);
      throw error;
    }
  }

  /**
   * Link video to material
   */
  async linkVideoToMaterial(
    materialId: string,
    videoId: string,
    userId: string,
    userRole: string
  ) {
    try {
      console.log("🔗 Linking video to material:", { materialId, videoId });

      const material = await prisma.material.findUnique({
        where: { id: materialId },
        include: {
          section: {
            include: {
              course: true,
            },
          },
        },
      });

      if (!material) {
        throw new NotFoundError("Material not found");
      }

      // Check permission
      if (
        userRole !== USER_ROLES.ADMIN &&
        material.section.course.mentorId !== userId
      ) {
        throw new ForbiddenError("You do not have permission to link video");
      }

      // Verify video exists
      const video = await prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!video) {
        throw new NotFoundError("Video not found");
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
          resources: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      // Update section duration and course stats
      await this.updateSectionDuration(material.sectionId);
      await this.updateCourseContentStats(material.section.courseId);

      console.log("✅ Video linked to material successfully");

      return updated;
    } catch (error) {
      console.error("❌ Failed to link video to material:", error);
      throw error;
    }
  }

  /**
   * Validate material data based on type
   */
  private validateMaterialData(data: CreateMaterialData): void {
    if (
      data.type === MATERIAL_TYPE.VIDEO &&
      !data.content &&
      !data.documentUrl
    ) {
      throw new AppError(
        "Video materials require either content or document URL",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (data.type === MATERIAL_TYPE.DOCUMENT && !data.documentUrl) {
      throw new AppError(
        "Document materials require a document URL",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (data.type === MATERIAL_TYPE.QUIZ && !data.content) {
      throw new AppError(
        "Quiz materials require content",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (data.type === MATERIAL_TYPE.ASSIGNMENT && !data.content) {
      throw new AppError(
        "Assignment materials require content",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (data.duration && data.duration < 0) {
      throw new AppError(
        "Duration cannot be negative",
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  /**
   * Reorder materials after deletion
   */
  private async reorderMaterialsAfterDelete(
    sectionId: string,
    deletedOrder: number
  ): Promise<void> {
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
  private async updateSectionDuration(sectionId: string): Promise<number> {
    const materials = await prisma.material.findMany({
      where: { sectionId },
      select: { duration: true },
    });

    const totalDuration = materials.reduce(
      (sum: number, material: { duration: number | null }) => {
        return sum + (material.duration || 0);
      },
      0
    );

    await prisma.section.update({
      where: { id: sectionId },
      data: { duration: totalDuration },
    });

    return totalDuration;
  }

  /**
   * Update course content statistics
   */
  private async updateCourseContentStats(courseId: string): Promise<void> {
    // Get all sections for the course
    const sections = await prisma.section.findMany({
      where: { courseId },
      include: {
        materials: {
          select: {
            duration: true,
            type: true,
          },
        },
      },
    });

    // Calculate total duration and lectures count
    let totalDuration = 0;
    let totalLectures = 0;

    sections.forEach(
      (section: { duration: number | null; materials: any[] }) => {
        totalDuration += section.duration || 0;
        totalLectures += section.materials.length;
      }
    );

    // Update course
    await prisma.course.update({
      where: { id: courseId },
      data: {
        totalDuration,
        totalLectures,
      },
    });
  }

  /**
   * Get materials with progress for a specific user
   */
  async getMaterialsWithProgress(sectionId: string, userId: string) {
    try {
      console.log("🔍 Getting materials with progress for user:", {
        sectionId,
        userId,
      });

      const materials = await prisma.material.findMany({
        where: { sectionId },
        orderBy: { order: "asc" },
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
          resources: {
            orderBy: { createdAt: "asc" },
          },
          progress: {
            where: { userId },
            select: {
              isCompleted: true,
              watchedDuration: true,
              lastPosition: true,
              completedAt: true,
            },
          },
        },
      });

      // Format response with progress information
      const materialsWithProgress = materials.map((material: any) => ({
        ...material,
        userProgress: material.progress[0] || null,
        progress: material.progress[0]
          ? {
              isCompleted: material.progress[0].isCompleted,
              watchedDuration: material.progress[0].watchedDuration,
              lastPosition: material.progress[0].lastPosition,
              completedAt: material.progress[0].completedAt,
            }
          : null,
      }));

      console.log(
        "✅ Retrieved materials with progress for user:",
        userId,
        "count:",
        materialsWithProgress.length
      );

      return materialsWithProgress;
    } catch (error) {
      console.error("❌ Failed to get materials with progress:", error);
      throw error;
    }
  }
}

const materialService = new MaterialService();
export default materialService;
