import prisma from '@/lib/prisma';
import notificationService from './notification.service';
import { NotFoundError, ConflictError, AppError } from '@/utils/error.util';
import { HTTP_STATUS, ENROLLMENT_STATUS, COURSE_STATUS } from '@/lib/constants';
import type { EnrollmentStatus, Prisma } from '@prisma/client';

/**
 * Enrollment Service
 * Handles course enrollment and progress tracking
 */
export class EnrollmentService {
  /**
   * Enroll user in course
   */
  async enrollCourse(userId: string, courseId: string, transactionId?: string) {
    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check if course is published
    if (course.status !== COURSE_STATUS.PUBLISHED) {
      throw new AppError('Course is not available for enrollment', HTTP_STATUS.BAD_REQUEST);
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictError('You are already enrolled in this course');
    }

    // For paid courses, verify transaction
    if (!course.isFree) {
      if (!transactionId) {
        throw new AppError('Transaction ID required for paid courses', HTTP_STATUS.BAD_REQUEST);
      }

      // Verify transaction is paid
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction || transaction.status !== 'PAID') {
        throw new AppError('Valid payment required to enroll', HTTP_STATUS.PAYMENT_REQUIRED || 402);
      }

      if (transaction.userId !== userId || transaction.courseId !== courseId) {
        throw new AppError('Transaction does not match enrollment', HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Create enrollment
    const enrollment = await prisma.$transaction(async (tx) => {
      // Create enrollment record
      const newEnrollment = await tx.enrollment.create({
        data: {
          userId,
          courseId,
          status: ENROLLMENT_STATUS.ACTIVE,
          progress: 0,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
            },
          },
        },
      });

      // Update course total students
      await tx.course.update({
        where: { id: courseId },
        data: {
          totalStudents: { increment: 1 },
        },
      });

      return newEnrollment;
    });

    // Send notifications
    await notificationService.notifyCourseEnrollment(userId, course.title);

    return enrollment;
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
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = { userId };
    if (status) {
      where.status = status;
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              level: true,
              totalDuration: true,
              totalLectures: true,
              mentor: {
                select: {
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
          certificate: {
            select: {
              id: true,
              certificateNumber: true,
              issuedAt: true,
            },
          },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return {
      data: enrollments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get enrollment by ID
   */
  async getEnrollmentById(enrollmentId: string, userId?: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            sections: {
              orderBy: { order: 'asc' },
              include: {
                materials: {
                  orderBy: { order: 'asc' },
                },
              },
            },
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
        progressRecords: {
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
      throw new NotFoundError('Enrollment not found');
    }

    // Check permission
    if (userId && enrollment.userId !== userId) {
      throw new AppError('Access denied', HTTP_STATUS.FORBIDDEN);
    }

    return enrollment;
  }

  /**
   * Get detailed progress
   */
  async getEnrollmentProgress(enrollmentId: string, userId?: string) {
    const enrollment = await this.getEnrollmentById(enrollmentId, userId);

    // Calculate progress per section
    const sectionProgress = await Promise.all(
      enrollment.course.sections.map(async (section) => {
        const materials = section.materials;
        const totalMaterials = materials.length;

        const completedMaterials = await prisma.progress.count({
          where: {
            enrollmentId,
            materialId: { in: materials.map((m) => m.id) },
            isCompleted: true,
          },
        });

        return {
          sectionId: section.id,
          sectionTitle: section.title,
          totalMaterials,
          completedMaterials,
          progress: totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0,
        };
      })
    );

    return {
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      overallProgress: enrollment.progress,
      sections: sectionProgress,
      lastAccessedAt: enrollment.lastAccessedAt,
    };
  }

  /**
   * Check enrollment status
   */
  async checkEnrollmentStatus(userId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      select: {
        id: true,
        status: true,
        progress: true,
        completedAt: true,
      },
    });

    return {
      isEnrolled: !!enrollment,
      enrollment: enrollment || null,
    };
  }

  /**
   * Update enrollment progress
   */
  async updateEnrollmentProgress(enrollmentId: string) {
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
      throw new NotFoundError('Enrollment not found');
    }

    // Count total and completed materials
    const allMaterialIds = enrollment.course.sections.flatMap((section) =>
      section.materials.map((m) => m.id)
    );

    const totalMaterials = allMaterialIds.length;

    const completedMaterials = await prisma.progress.count({
      where: {
        enrollmentId,
        materialId: { in: allMaterialIds },
        isCompleted: true,
      },
    });

    const progress = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;

    // Update enrollment
    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progress,
        status: progress >= 100 ? ENROLLMENT_STATUS.COMPLETED : ENROLLMENT_STATUS.ACTIVE,
        completedAt: progress >= 100 ? new Date() : null,
      },
    });

    // Issue certificate if completed
    if (progress >= 100 && !enrollment.certificateId) {
      // Queue certificate generation
      const { queueCertificateGeneration } = await import('@/workers/certificate.worker');
      await queueCertificateGeneration(enrollmentId, enrollment.userId, enrollment.courseId);
    }

    return updated;
  }

  /**
   * Cancel enrollment
   */
  async cancelEnrollment(enrollmentId: string, userId?: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    // Check permission
    if (userId && enrollment.userId !== userId) {
      throw new AppError('Access denied', HTTP_STATUS.FORBIDDEN);
    }

    // Update status
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: ENROLLMENT_STATUS.CANCELLED },
    });

    return { id: enrollmentId, cancelled: true };
  }
}

const enrollmentService = new EnrollmentService();
export default enrollmentService;
