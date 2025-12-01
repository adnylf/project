// services/enrollment.service.ts
import prisma from "@/lib/prisma";
import { NotFoundError, ConflictError, AppError } from "@/utils/error.util";
import { HTTP_STATUS, ENROLLMENT_STATUS, COURSE_STATUS } from "@/lib/constants";
import type { EnrollmentStatus } from "@/types/enrollment.types";

/**
 * Enrollment Service
 * Handles course enrollment and progress tracking
 */
export class EnrollmentService {
  /**
   * Enroll user in course
   */
  async enrollCourse(userId: string, courseId: string, transactionId?: string) {
    try {
      console.log("🎓 Starting enrollment process:", {
        userId,
        courseId,
        transactionId,
      });

      // Get course details
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        console.log("❌ Course not found:", courseId);
        throw new NotFoundError("Course not found");
      }

      // Check if course is published
      if (course.status !== COURSE_STATUS.PUBLISHED) {
        console.log("❌ Course not published:", course.status);
        throw new AppError(
          "Course is not available for enrollment",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Check if already enrolled
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          user_id_course_id: {
            user_id: userId,
            course_id: courseId,
          },
        },
      });

      if (existingEnrollment) {
        console.log("❌ User already enrolled:", { userId, courseId });
        throw new ConflictError("You are already enrolled in this course");
      }

      // For paid courses, verify transaction
      if (!course.is_free) {
        if (!transactionId) {
          throw new AppError(
            "Transaction ID required for paid courses",
            HTTP_STATUS.BAD_REQUEST
          );
        }

        // Verify transaction is paid
        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId },
        });

        if (!transaction || transaction.status !== "PAID") {
          throw new AppError(
            "Valid payment required to enroll",
            HTTP_STATUS.PAYMENT_REQUIRED
          );
        }

        if (
          transaction.user_id !== userId ||
          transaction.course_id !== courseId
        ) {
          throw new AppError(
            "Transaction does not match enrollment",
            HTTP_STATUS.BAD_REQUEST
          );
        }
      }

      // Create enrollment
      console.log("📝 Creating enrollment record...");
      const enrollment = await prisma.$transaction(async (tx: any) => {
        // Create enrollment record
        const newEnrollment = await tx.enrollment.create({
          data: {
            user_id: userId,
            course_id: courseId,
            status: ENROLLMENT_STATUS.ACTIVE,
            progress: 0,
            last_accessed_at: new Date(),
          },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
                slug: true,
                total_duration: true,
                total_lectures: true,
              },
            },
          },
        });

        // Update course total students
        console.log("📈 Updating course student count...");
        await tx.course.update({
          where: { id: courseId },
          data: {
            total_students: { increment: 1 },
          },
        });

        return newEnrollment;
      });

      console.log("✅ Enrollment created successfully:", enrollment.id);

      return {
        enrollment: {
          id: enrollment.id,
          userId: enrollment.user_id, // PERBAIKAN: camelCase
          courseId: enrollment.course_id, // PERBAIKAN: camelCase
          status: enrollment.status,
          progress: enrollment.progress,
          completedAt: enrollment.completed_at, // PERBAIKAN: camelCase
          lastAccessedAt: enrollment.last_accessed_at, // PERBAIKAN: camelCase
          createdAt: enrollment.created_at, // PERBAIKAN: camelCase
          updatedAt: enrollment.updated_at, // PERBAIKAN: camelCase
          course: enrollment.course,
        },
      };
    } catch (error) {
      console.error("❌ Enrollment failed:", error);
      throw error;
    }
  }

  /**
   * Get user enrollments
   */
  async getUserEnrollments(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: EnrollmentStatus;
    } = {}
  ) {
    try {
      console.log("📚 Getting user enrollments:", { userId, options });

      const { page = 1, limit = 10, status } = options;
      const skip = (page - 1) * limit;

      const where: any = { user_id: userId };
      if (status) {
        where.status = status;
      }

      const [enrollments, total] = await Promise.all([
        prisma.enrollment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: "desc" },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
                level: true,
                total_duration: true,
                total_lectures: true,
                mentor: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        full_name: true,
                        avatar_url: true,
                      },
                    },
                  },
                },
              },
            },
            certificate: {
              select: {
                id: true,
                certificate_number: true,
                issued_at: true,
              },
            },
          },
        }),
        prisma.enrollment.count({ where }),
      ]);

      // Define interface for enrollment data dengan camelCase
      interface EnrollmentData {
        id: string;
        userId: string; // PERBAIKAN: camelCase
        courseId: string; // PERBAIKAN: camelCase
        status: EnrollmentStatus;
        progress: number;
        completedAt: Date | null; // PERBAIKAN: camelCase
        lastAccessedAt: Date | null; // PERBAIKAN: camelCase
        createdAt: Date; // PERBAIKAN: camelCase
        updatedAt: Date; // PERBAIKAN: camelCase
        course: any;
        certificate: any;
      }

      const result = {
        data: enrollments.map(
          (enrollment: any): EnrollmentData => ({
            id: enrollment.id,
            userId: enrollment.user_id, // PERBAIKAN: camelCase
            courseId: enrollment.course_id, // PERBAIKAN: camelCase
            status: enrollment.status,
            progress: enrollment.progress,
            completedAt: enrollment.completed_at, // PERBAIKAN: camelCase
            lastAccessedAt: enrollment.last_accessed_at, // PERBAIKAN: camelCase
            createdAt: enrollment.created_at, // PERBAIKAN: camelCase
            updatedAt: enrollment.updated_at, // PERBAIKAN: camelCase
            course: enrollment.course,
            certificate: enrollment.certificate,
          })
        ),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      console.log("✅ Found enrollments:", result.data.length);
      return result;
    } catch (error) {
      console.error("❌ Get user enrollments failed:", error);
      throw error;
    }
  }

  /**
   * Get enrollment by ID
   */
  async getEnrollmentById(enrollmentId: string, userId?: string) {
    try {
      console.log("🔍 Getting enrollment by ID:", { enrollmentId, userId });

      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          course: {
            include: {
              sections: {
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
                      is_free: true,
                    },
                  },
                },
              },
              mentor: {
                include: {
                  user: {
                    select: {
                      id: true,
                      full_name: true,
                      avatar_url: true,
                    },
                  },
                },
              },
            },
          },
          progress_records: {
            include: {
              material: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  duration: true,
                },
              },
            },
          },
          certificate: true,
        },
      });

      if (!enrollment) {
        console.log("❌ Enrollment not found:", enrollmentId);
        throw new NotFoundError("Enrollment not found");
      }

      // Check permission
      if (userId && enrollment.user_id !== userId) {
        console.log("❌ Access denied for user:", userId);
        throw new AppError("Access denied", HTTP_STATUS.FORBIDDEN);
      }

      console.log("✅ Enrollment found:", enrollment.id);
      return enrollment;
    } catch (error) {
      console.error("❌ Get enrollment by ID failed:", error);
      throw error;
    }
  }

  /**
   * Get detailed progress
   */
  async getEnrollmentProgress(enrollmentId: string, userId?: string) {
    try {
      console.log("📊 Getting enrollment progress:", { enrollmentId, userId });

      const enrollment = await this.getEnrollmentById(enrollmentId, userId);

      // Calculate progress per section
      const sectionProgress = await Promise.all(
        enrollment.course.sections.map(async (section: any) => {
          const materials = section.materials;
          const totalMaterials = materials.length;

          const completedMaterials = await prisma.progress.count({
            where: {
              enrollment_id: enrollmentId,
              material_id: { in: materials.map((m: any) => m.id) },
              is_completed: true,
            },
          });

          return {
            sectionId: section.id,
            sectionTitle: section.title,
            totalMaterials,
            completedMaterials,
            progress:
              totalMaterials > 0
                ? (completedMaterials / totalMaterials) * 100
                : 0,
          };
        })
      );

      // Calculate total watched duration
      const totalWatchedDuration = await prisma.progress.aggregate({
        where: { enrollment_id: enrollmentId },
        _sum: { watched_duration: true },
      });

      const result = {
        enrollmentId: enrollment.id,
        courseId: enrollment.course_id,
        overallProgress: enrollment.progress,
        totalWatchedDuration: totalWatchedDuration._sum.watched_duration || 0,
        totalDuration: enrollment.course.total_duration,
        sections: sectionProgress,
        lastAccessedAt: enrollment.last_accessed_at,
      };

      console.log("✅ Progress calculated:", result.overallProgress);
      return result;
    } catch (error) {
      console.error("❌ Get enrollment progress failed:", error);
      throw error;
    }
  }

  /**
   * Check enrollment status
   */
  async checkEnrollmentStatus(userId: string, courseId: string) {
    try {
      console.log("🔍 Checking enrollment status:", { userId, courseId });

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          user_id_course_id: {
            user_id: userId,
            course_id: courseId,
          },
        },
        select: {
          id: true,
          status: true,
          progress: true,
          completed_at: true,
          last_accessed_at: true,
        },
      });

      const result = {
        isEnrolled: !!enrollment,
        enrollment: enrollment
          ? {
              id: enrollment.id,
              status: enrollment.status,
              progress: enrollment.progress,
              completedAt: enrollment.completed_at, // PERBAIKAN: camelCase
              lastAccessedAt: enrollment.last_accessed_at, // PERBAIKAN: camelCase
            }
          : null,
      };

      console.log("✅ Enrollment status:", result.isEnrolled);
      return result;
    } catch (error) {
      console.error("❌ Check enrollment status failed:", error);
      throw error;
    }
  }

  /**
   * Update enrollment progress
   */
  async updateEnrollmentProgress(enrollmentId: string) {
    try {
      console.log("🔄 Updating enrollment progress:", enrollmentId);

      // Get all materials in course
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          course: {
            include: {
              sections: {
                include: {
                  materials: true,
                },
              },
            },
          },
        },
      });

      if (!enrollment) {
        throw new NotFoundError("Enrollment not found");
      }

      // Count total and completed materials
      const allMaterialIds = enrollment.course.sections.flatMap(
        (section: any) => section.materials.map((m: any) => m.id)
      );

      const totalMaterials = allMaterialIds.length;

      const completedMaterials = await prisma.progress.count({
        where: {
          enrollment_id: enrollmentId,
          material_id: { in: allMaterialIds },
          is_completed: true,
        },
      });

      const progress =
        totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;

      // Update enrollment
      const updatedEnrollment = await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          progress,
          status:
            progress >= 100
              ? ENROLLMENT_STATUS.COMPLETED
              : ENROLLMENT_STATUS.ACTIVE,
          completed_at: progress >= 100 ? new Date() : null,
          last_accessed_at: new Date(),
        },
      });

      console.log("✅ Progress updated:", progress);

      // Issue certificate if completed
      if (progress >= 100 && !enrollment.certificate_id) {
        console.log("🎓 Course completed, queuing certificate generation...");
        // In a real implementation, you would queue certificate generation here
      }

      return updatedEnrollment;
    } catch (error) {
      console.error("❌ Update enrollment progress failed:", error);
      throw error;
    }
  }

  /**
   * Update material progress
   */
  async updateMaterialProgress(
    enrollmentId: string,
    materialId: string,
    data: {
      watchedDuration?: number;
      lastPosition?: number;
      isCompleted?: boolean;
    }
  ) {
    try {
      console.log("📝 Updating material progress:", {
        enrollmentId,
        materialId,
        data,
      });

      const {
        watchedDuration = 0,
        lastPosition = 0,
        isCompleted = false,
      } = data;

      // Find or create progress record
      const progress = await prisma.progress.upsert({
        where: {
          enrollment_id_material_id: {
            enrollment_id: enrollmentId,
            material_id: materialId,
          },
        },
        create: {
          enrollment_id: enrollmentId,
          material_id: materialId,
          user_id: (await this.getEnrollmentById(enrollmentId)).user_id,
          watched_duration: watchedDuration,
          last_position: lastPosition,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date() : null,
        },
        update: {
          watched_duration: watchedDuration,
          last_position: lastPosition,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date() : null,
          updated_at: new Date(),
        },
      });

      // Update enrollment progress
      await this.updateEnrollmentProgress(enrollmentId);

      console.log("✅ Material progress updated");
      return progress;
    } catch (error) {
      console.error("❌ Update material progress failed:", error);
      throw error;
    }
  }

  /**
   * Cancel enrollment
   */
  async cancelEnrollment(enrollmentId: string, userId?: string) {
    try {
      console.log("❌ Canceling enrollment:", { enrollmentId, userId });

      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
      });

      if (!enrollment) {
        throw new NotFoundError("Enrollment not found");
      }

      // Check permission
      if (userId && enrollment.user_id !== userId) {
        throw new AppError("Access denied", HTTP_STATUS.FORBIDDEN);
      }

      // Update status
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: ENROLLMENT_STATUS.CANCELLED,
          updated_at: new Date(),
        },
      });

      console.log("✅ Enrollment cancelled successfully");
      return { id: enrollmentId, cancelled: true };
    } catch (error) {
      console.error("❌ Cancel enrollment failed:", error);
      throw error;
    }
  }

  /**
   * Get course progress summary
   */
  async getCourseProgressSummary(userId: string, courseId: string) {
    try {
      console.log("📈 Getting course progress summary:", { userId, courseId });

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          user_id_course_id: {
            user_id: userId,
            course_id: courseId,
          },
        },
        include: {
          progress_records: {
            include: {
              material: {
                select: {
                  id: true,
                  duration: true,
                },
              },
            },
          },
          course: {
            select: {
              total_duration: true,
              sections: {
                include: {
                  materials: {
                    select: {
                      id: true,
                      duration: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!enrollment) {
        throw new NotFoundError("Enrollment not found");
      }

      const totalMaterials = enrollment.course.sections.reduce(
        (total: number, section: any) => total + section.materials.length,
        0
      );

      const completedMaterials = enrollment.progress_records.filter(
        (record: any) => record.is_completed
      ).length;

      const totalWatchedDuration = enrollment.progress_records.reduce(
        (total: number, record: any) => total + (record.watched_duration || 0),
        0
      );

      const progress =
        totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;

      const result = {
        courseId,
        totalMaterials,
        completedMaterials,
        progress,
        totalDuration: enrollment.course.total_duration,
        watchedDuration: totalWatchedDuration,
        lastAccessedAt: enrollment.last_accessed_at,
      };

      console.log("✅ Course progress summary calculated");
      return result;
    } catch (error) {
      console.error("❌ Get course progress summary failed:", error);
      throw error;
    }
  }

  /**
   * Get learning statistics for user
   */
  async getLearningStatistics(userId: string) {
    try {
      console.log("📊 Getting learning statistics for user:", userId);

      const [
        totalEnrollments,
        activeEnrollments,
        completedCourses,
        totalWatchTime,
        certificatesEarned,
      ] = await Promise.all([
        // Total enrollments
        prisma.enrollment.count({
          where: { user_id: userId },
        }),

        // Active enrollments
        prisma.enrollment.count({
          where: {
            user_id: userId,
            status: ENROLLMENT_STATUS.ACTIVE,
          },
        }),

        // Completed courses
        prisma.enrollment.count({
          where: {
            user_id: userId,
            status: ENROLLMENT_STATUS.COMPLETED,
          },
        }),

        // Total watch time
        prisma.progress.aggregate({
          where: {
            enrollment: { user_id: userId },
          },
          _sum: { watched_duration: true },
        }),

        // Certificates earned
        prisma.certificate.count({
          where: {
            enrollment: { user_id: userId },
            status: "ISSUED",
          },
        }),
      ]);

      // Calculate average progress
      const enrollments = await prisma.enrollment.findMany({
        where: { user_id: userId },
        select: { progress: true },
      });

      const averageProgress =
        enrollments.length > 0
          ? enrollments.reduce((sum: number, e: any) => sum + e.progress, 0) /
            enrollments.length
          : 0;

      const result = {
        totalEnrollments,
        activeEnrollments,
        completedCourses,
        totalWatchTime: totalWatchTime._sum.watched_duration || 0,
        averageProgress: Math.round(averageProgress),
        certificatesEarned,
      };

      console.log("✅ Learning statistics retrieved");
      return result;
    } catch (error) {
      console.error("❌ Get learning statistics failed:", error);
      throw error;
    }
  }
}

const enrollmentService = new EnrollmentService();
export default enrollmentService;
