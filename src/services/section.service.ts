// src/services/section.service.ts
import prisma from "@/lib/prisma";
import { NotFoundError, ForbiddenError, AppError } from "@/utils/error.util";
import { HTTP_STATUS, USER_ROLES } from "@/lib/constants";

/**
 * Section Creation Data
 */
interface CreateSectionData {
  courseId: string;
  title: string;
  description?: string;
  order?: number;
}

/**
 * Section Update Data
 */
interface UpdateSectionData {
  title?: string;
  description?: string;
  order?: number;
}

/**
 * Section Reorder Data
 */
interface ReorderSectionData {
  id: string;
  order: number;
}

/**
 * Material Duration Type
 */
interface MaterialWithDuration {
  duration: number | null;
}

/**
 * Progress Record Type
 */
interface ProgressRecord {
  materialId: string;
  isCompleted: boolean;
  watchedDuration: number;
}

/**
 * Material with Progress Type
 */
interface MaterialWithProgress {
  id: string;
  title: string;
  type: string;
  duration: number;
  order: number;
  isFree: boolean;
  video?: any;
  progress: {
    isCompleted: boolean;
    watchedDuration: number;
  } | null;
}

/**
 * Section with Progress Type
 */
interface SectionWithProgress {
  id: string;
  title: string;
  description?: string;
  order: number;
  duration: number;
  courseId: string;
  materials: MaterialWithProgress[];
  _count?: {
    materials: number;
  };
  progress: {
    completedMaterials: number;
    totalMaterials: number;
    percentage: number;
  };
}

/**
 * Prisma Section Type
 */
interface PrismaSection {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  duration: number;
  courseId: string;
  materials: any[];
  _count?: {
    materials: number;
  };
}

/**
 * Section Service
 * Handles course section operations
 */
export class SectionService {
  /**
   * Create new section
   */
  async createSection(
    userId: string,
    userRole: string,
    data: CreateSectionData
  ) {
    console.log("📝 Creating section for course:", data.courseId);

    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      include: {
        mentor: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    // Check permission
    if (userRole !== USER_ROLES.ADMIN && course.mentor.userId !== userId) {
      throw new ForbiddenError(
        "You do not have permission to add sections to this course"
      );
    }

    // Get next order number if not provided
    let order = data.order;
    if (order === undefined) {
      const lastSection = await prisma.section.findFirst({
        where: { courseId: data.courseId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (lastSection?.order ?? -1) + 1;
    }

    // Create section
    const section = await prisma.section.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        order,
        duration: 0, // Default duration
      },
      include: {
        materials: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            type: true,
            duration: true,
            order: true,
            isFree: true,
          },
        },
      },
    });

    console.log("✅ Section created successfully:", section.id);
    return section;
  }

  /**
   * Get all sections for a course
   */
  async getCourseSections(courseId: string) {
    console.log("📚 Getting sections for course:", courseId);

    const sections = await prisma.section.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: {
        materials: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            type: true,
            duration: true,
            order: true,
            isFree: true,
            video: {
              select: {
                id: true,
                filename: true,
                status: true,
                thumbnail: true,
              },
            },
          },
        },
        _count: {
          select: {
            materials: true,
          },
        },
      },
    });

    console.log(`✅ Found ${sections.length} sections for course:`, courseId);
    return sections;
  }

  /**
   * Get section by ID
   */
  async getSectionById(sectionId: string) {
    console.log("🔍 Getting section by ID:", sectionId);

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          include: {
            mentor: {
              select: {
                id: true,
                userId: true,
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
        materials: {
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
              select: {
                id: true,
                title: true,
                fileUrl: true,
                fileType: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundError("Section not found");
    }

    console.log("✅ Section found:", sectionId);
    return section;
  }

  /**
   * Update section
   */
  async updateSection(
    sectionId: string,
    userId: string,
    userRole: string,
    data: UpdateSectionData
  ) {
    console.log("✏️ Updating section:", sectionId);

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          include: {
            mentor: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundError("Section not found");
    }

    // Check permission
    if (
      userRole !== USER_ROLES.ADMIN &&
      section.course.mentor.userId !== userId
    ) {
      throw new ForbiddenError(
        "You do not have permission to update this section"
      );
    }

    const updated = await prisma.section.update({
      where: { id: sectionId },
      data,
      include: {
        materials: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            type: true,
            duration: true,
            order: true,
            isFree: true,
          },
        },
      },
    });

    console.log("✅ Section updated successfully:", sectionId);
    return updated;
  }

  /**
   * Delete section
   */
  async deleteSection(sectionId: string, userId: string, userRole: string) {
    console.log("🗑️ Deleting section:", sectionId);

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          include: {
            mentor: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        },
        materials: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundError("Section not found");
    }

    // Check permission
    if (
      userRole !== USER_ROLES.ADMIN &&
      section.course.mentor.userId !== userId
    ) {
      throw new ForbiddenError(
        "You do not have permission to delete this section"
      );
    }

    // Check if section has materials
    if (section.materials.length > 0) {
      throw new AppError(
        "Cannot delete section with materials. Delete materials first.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.section.delete({
      where: { id: sectionId },
    });

    // Reorder remaining sections
    await this.reorderSectionsAfterDelete(section.courseId, section.order);

    console.log("✅ Section deleted successfully:", sectionId);
    return { id: sectionId, deleted: true };
  }

  /**
   * Reorder sections
   */
  async reorderSections(
    courseId: string,
    userId: string,
    userRole: string,
    sections: ReorderSectionData[]
  ) {
    console.log("🔄 Reordering sections for course:", courseId);

    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        mentor: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    // Check permission
    if (userRole !== USER_ROLES.ADMIN && course.mentor.userId !== userId) {
      throw new ForbiddenError(
        "You do not have permission to reorder sections"
      );
    }

    // Update section orders in transaction
    await prisma.$transaction(
      sections.map((section) =>
        prisma.section.update({
          where: { id: section.id },
          data: { order: section.order },
        })
      )
    );

    // Get updated sections
    const updatedSections = await this.getCourseSections(courseId);
    console.log("✅ Sections reordered successfully");
    return updatedSections;
  }

  /**
   * Reorder sections after deletion
   */
  private async reorderSectionsAfterDelete(
    courseId: string,
    deletedOrder: number
  ) {
    console.log("🔄 Reordering sections after deletion for course:", courseId);

    await prisma.section.updateMany({
      where: {
        courseId,
        order: { gt: deletedOrder },
      },
      data: {
        order: { decrement: 1 },
      },
    });

    console.log("✅ Sections reordered after deletion");
  }

  /**
   * Get section materials
   */
  async getSectionMaterials(sectionId: string) {
    console.log("📖 Getting materials for section:", sectionId);

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        materials: {
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
              select: {
                id: true,
                title: true,
                description: true,
                fileUrl: true,
                fileType: true,
                fileSize: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundError("Section not found");
    }

    console.log(
      `✅ Found ${section.materials.length} materials for section:`,
      sectionId
    );
    return section.materials;
  }

  /**
   * Calculate section duration
   */
  async calculateSectionDuration(sectionId: string): Promise<number> {
    console.log("⏱️ Calculating section duration:", sectionId);

    const materials = await prisma.material.findMany({
      where: { sectionId },
      select: { duration: true },
    });

    const totalDuration = materials.reduce(
      (total: number, material: MaterialWithDuration) => {
        return total + (material.duration || 0);
      },
      0
    );

    console.log(`✅ Section duration calculated: ${totalDuration} minutes`);
    return totalDuration;
  }

  /**
   * Update section duration
   */
  async updateSectionDuration(sectionId: string) {
    console.log("⏱️ Updating section duration:", sectionId);

    const duration = await this.calculateSectionDuration(sectionId);

    await prisma.section.update({
      where: { id: sectionId },
      data: { duration },
    });

    console.log("✅ Section duration updated:", duration);
    return duration;
  }

  /**
   * Get section with course info
   */
  async getSectionWithCourse(sectionId: string) {
    console.log("🔍 Getting section with course info:", sectionId);

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            mentor: {
              select: {
                id: true,
                userId: true,
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
    });

    if (!section) {
      throw new NotFoundError("Section not found");
    }

    return section;
  }

  /**
   * Check if user can access section
   */
  async canUserAccessSection(
    sectionId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    try {
      const section = await this.getSectionWithCourse(sectionId);

      // Admin can access any section
      if (userRole === USER_ROLES.ADMIN) {
        return true;
      }

      // Mentor can access their own course sections
      if (
        userRole === USER_ROLES.MENTOR &&
        section.course.mentor.userId === userId
      ) {
        return true;
      }

      // Students need to be enrolled in the course
      if (userRole === USER_ROLES.STUDENT) {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            userId,
            courseId: section.courseId,
            status: "ACTIVE",
          },
        });
        return !!enrollment;
      }

      return false;
    } catch (error) {
      console.error("Error checking section access:", error);
      return false;
    }
  }

  /**
   * Get sections with progress for enrolled student
   */
  async getSectionsWithProgress(
    courseId: string,
    userId: string
  ): Promise<SectionWithProgress[]> {
    console.log("📊 Getting sections with progress for user:", userId);

    const sections = await this.getCourseSections(courseId);

    // Get user progress for all materials in this course
    const progressRecords = await prisma.progress.findMany({
      where: {
        userId,
        material: {
          section: {
            courseId,
          },
        },
      },
      select: {
        materialId: true,
        isCompleted: true,
        watchedDuration: true,
      },
    });

    // Create a map for quick lookup
    const progressMap = new Map<string, ProgressRecord>(
      progressRecords.map((record: ProgressRecord) => [
        record.materialId,
        record,
      ])
    );

    // Enhance sections with progress information
    const sectionsWithProgress: SectionWithProgress[] = sections.map(
      (section: PrismaSection) => {
        const materialsWithProgress: MaterialWithProgress[] =
          section.materials.map((material: any) => {
            const progress: ProgressRecord | undefined = progressMap.get(
              material.id
            );
            return {
              ...material,
              progress: progress
                ? {
                    isCompleted: progress.isCompleted,
                    watchedDuration: progress.watchedDuration,
                  }
                : null,
            };
          });

        const completedMaterials = materialsWithProgress.filter(
          (material: MaterialWithProgress) => material.progress?.isCompleted
        ).length;

        const progressPercentage =
          section.materials.length > 0
            ? Math.round((completedMaterials / section.materials.length) * 100)
            : 0;

        return {
          ...section,
          materials: materialsWithProgress,
          progress: {
            completedMaterials,
            totalMaterials: section.materials.length,
            percentage: progressPercentage,
          },
        };
      }
    );

    return sectionsWithProgress;
  }

  /**
   * Get sections count for a course
   */
  async getSectionsCount(courseId: string): Promise<number> {
    const count = await prisma.section.count({
      where: { courseId },
    });
    return count;
  }

  /**
   * Get total duration for a course
   */
  async getCourseTotalDuration(courseId: string): Promise<number> {
    const sections = await prisma.section.findMany({
      where: { courseId },
      select: { duration: true },
    });

    const totalDuration = sections.reduce(
      (total: number, section: { duration: number }) => {
        return total + (section.duration || 0);
      },
      0
    );

    return totalDuration;
  }

  /**
   * Bulk update section durations for a course
   */
  async updateAllSectionDurations(courseId: string): Promise<void> {
    console.log("⏱️ Updating all section durations for course:", courseId);

    const sections = await prisma.section.findMany({
      where: { courseId },
      select: { id: true },
    });

    for (const section of sections) {
      await this.updateSectionDuration(section.id);
    }

    console.log("✅ All section durations updated for course:", courseId);
  }
}

const sectionService = new SectionService();
export default sectionService;
