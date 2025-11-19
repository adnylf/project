import prisma from '@/lib/prisma';
import emailService from './email.service';
import notificationService from './notification.service';
import { AppError, NotFoundError, ConflictError } from '@/utils/error.util';
import { HTTP_STATUS, MENTOR_STATUS, USER_STATUS } from '@/lib/constants';
import type { MentorStatus, Prisma } from '@prisma/client';

/**
 * Mentor Application Data
 */
interface MentorApplicationData {
  expertise: string[];
  experience: number;
  education?: string;
  bio: string;
  headline: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  portfolio?: string;
}

/**
 * Mentor Profile Update Data
 */
interface MentorProfileUpdateData {
  expertise?: string[];
  experience?: number;
  education?: string;
  bio?: string;
  headline?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  portfolio?: string;
}

/**
 * Mentor List Filters
 */
interface MentorListFilters {
  page?: number;
  limit?: number;
  search?: string;
  expertise?: string;
  minRating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Mentor Service
 * Handles mentor application, management, and profile operations
 */
export class MentorService {
  /**
   * Apply to become a mentor
   */
  async applyAsMentor(userId: string, data: MentorApplicationData) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { mentorProfile: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if already a mentor or has pending application
    if (user.mentorProfile) {
      if (user.mentorProfile.status === MENTOR_STATUS.APPROVED) {
        throw new ConflictError('You are already an approved mentor');
      }
      if (user.mentorProfile.status === MENTOR_STATUS.PENDING) {
        throw new ConflictError('You already have a pending mentor application');
      }
    }

    // Create or update mentor profile
    const mentorProfile = await prisma.mentorProfile.upsert({
      where: { userId },
      update: {
        ...data,
        status: MENTOR_STATUS.PENDING,
        rejectedAt: null,
        rejectionReason: null,
      },
      create: {
        userId,
        ...data,
        status: MENTOR_STATUS.PENDING,
      },
    });

    // Send notification to admin
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: USER_STATUS.ACTIVE },
    });

    for (const admin of admins) {
      await notificationService.create(
        admin.id,
        'SYSTEM_ANNOUNCEMENT',
        'New Mentor Application',
        `${user.name} has applied to become a mentor`,
        { userId, mentorProfileId: mentorProfile.id }
      );
    }

    return {
      id: mentorProfile.id,
      status: mentorProfile.status,
      message: 'Your mentor application has been submitted successfully',
    };
  }

  /**
   * Get all mentors with filters
   */
  async getAllMentors(filters: MentorListFilters) {
    const {
      page = 1,
      limit = 10,
      search,
      expertise,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Build where clause
    const where: Prisma.MentorProfileWhereInput = {
      status: MENTOR_STATUS.APPROVED,
      user: { status: USER_STATUS.ACTIVE },
    };

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { headline: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (expertise) {
      where.expertise = { has: expertise };
    }

    if (minRating) {
      where.averageRating = { gte: minRating };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [mentors, total] = await Promise.all([
      prisma.mentorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          expertise: true,
          experience: true,
          headline: true,
          bio: true,
          averageRating: true,
          totalStudents: true,
          totalCourses: true,
          totalReviews: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
        },
      }),
      prisma.mentorProfile.count({ where }),
    ]);

    return {
      data: mentors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get mentor by ID with full details
   */
  async getMentorById(mentorId: string) {
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            bio: true,
            createdAt: true,
          },
        },
        courses: {
          where: { status: 'PUBLISHED' },
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            level: true,
            price: true,
            averageRating: true,
            totalStudents: true,
            createdAt: true,
          },
          take: 6,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!mentor) {
      throw new NotFoundError('Mentor not found');
    }

    return mentor;
  }

  /**
   * Get mentor profile by user ID
   */
  async getMentorByUserId(userId: string) {
    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    if (!mentor) {
      throw new NotFoundError('Mentor profile not found');
    }

    return mentor;
  }

  /**
   * Update mentor profile
   */
  async updateMentorProfile(userId: string, data: MentorProfileUpdateData) {
    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId },
    });

    if (!mentor) {
      throw new NotFoundError('Mentor profile not found');
    }

    if (mentor.status !== MENTOR_STATUS.APPROVED) {
      throw new AppError('Only approved mentors can update their profile', HTTP_STATUS.FORBIDDEN);
    }

    const updated = await prisma.mentorProfile.update({
      where: { userId },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Approve mentor application
   */
  async approveMentor(mentorId: string, adminId: string) {
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: { user: true },
    });

    if (!mentor) {
      throw new NotFoundError('Mentor application not found');
    }

    if (mentor.status !== MENTOR_STATUS.PENDING) {
      throw new AppError('Only pending applications can be approved', HTTP_STATUS.BAD_REQUEST);
    }

    // Update mentor status and user role
    await prisma.$transaction([
      prisma.mentorProfile.update({
        where: { id: mentorId },
        data: {
          status: MENTOR_STATUS.APPROVED,
          approvedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: mentor.userId },
        data: { role: 'MENTOR' },
      }),
    ]);

    // Send notification to user
    await notificationService.notifyMentorApproved(mentor.userId);

    // Send email
    await emailService.sendMentorApprovedEmail(mentor.user.email, mentor.user.name);

    return { id: mentorId, status: MENTOR_STATUS.APPROVED };
  }

  /**
   * Reject mentor application
   */
  async rejectMentor(mentorId: string, reason: string, adminId: string) {
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: { user: true },
    });

    if (!mentor) {
      throw new NotFoundError('Mentor application not found');
    }

    if (mentor.status !== MENTOR_STATUS.PENDING) {
      throw new AppError('Only pending applications can be rejected', HTTP_STATUS.BAD_REQUEST);
    }

    // Update mentor status
    await prisma.mentorProfile.update({
      where: { id: mentorId },
      data: {
        status: MENTOR_STATUS.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Send notification to user
    await notificationService.notifyMentorRejected(mentor.userId, reason);

    // Send email
    await emailService.sendMentorRejectedEmail(mentor.user.email, mentor.user.name, reason);

    return { id: mentorId, status: MENTOR_STATUS.REJECTED };
  }

  /**
   * Get mentor statistics
   */
  async getMentorStatistics(userId: string) {
    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId },
    });

    if (!mentor) {
      throw new NotFoundError('Mentor profile not found');
    }

    const [totalCourses, totalStudents, totalRevenue, recentEnrollments] = await Promise.all([
      prisma.course.count({
        where: { mentorId: mentor.id },
      }),
      prisma.enrollment.count({
        where: {
          course: { mentorId: mentor.id },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          status: 'PAID',
          course: { mentorId: mentor.id },
        },
        _sum: { totalAmount: true },
      }),
      prisma.enrollment.count({
        where: {
          course: { mentorId: mentor.id },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    return {
      totalCourses,
      totalStudents,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      recentEnrollments,
      averageRating: mentor.averageRating,
      totalReviews: mentor.totalReviews,
    };
  }

  /**
   * Get mentor reviews
   */
  async getMentorReviews(mentorId: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          course: { mentorId },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          comment: true,
          isAnonymous: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              profilePicture: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.review.count({
        where: {
          course: { mentorId },
        },
      }),
    ]);

    return {
      data: reviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

const mentorService = new MentorService();
export default mentorService;
