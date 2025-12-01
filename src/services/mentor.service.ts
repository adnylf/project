// services/mentor.service.ts
import prisma from "@/lib/prisma";
import emailService from "./email.service";
import notificationService from "./notification.service";
import { AppError, NotFoundError, ConflictError } from "@/utils/error.util";
import {
  HTTP_STATUS,
  MENTOR_STATUS,
  USER_STATUS,
  USER_ROLES,
} from "@/lib/constants";
import type { MentorStatus, Prisma } from "@prisma/client";

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
  sortOrder?: "asc" | "desc";
}

/**
 * Mentor Statistics
 */
interface MentorStatistics {
  total_courses: number;
  total_students: number;
  total_revenue: number;
  recent_enrollments: number;
  average_rating: number;
  total_reviews: number;
}

/**
 * Mentor Service
 * Handles mentor application, management, and profile operations
 */
export class MentorService {
  /**
   * Apply to become a mentor
   */
  async applyAsMentor(
    userId: string,
    data: MentorApplicationData
  ): Promise<{ id: string; status: string; message: string }> {
    try {
      console.log(`👤 User ${userId} applying to become a mentor`);

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { mentorProfile: true },
      });

      if (!user) {
        console.log(`❌ User not found: ${userId}`);
        throw new NotFoundError("User not found");
      }

      // Check if already a mentor or has pending application
      if (user.mentorProfile) {
        if (user.mentorProfile.status === MENTOR_STATUS.APPROVED) {
          console.log(`❌ User ${userId} is already an approved mentor`);
          throw new ConflictError("You are already an approved mentor");
        }
        if (user.mentorProfile.status === MENTOR_STATUS.PENDING) {
          console.log(`❌ User ${userId} already has pending application`);
          throw new ConflictError(
            "You already have a pending mentor application"
          );
        }
      }

      console.log(`📝 Creating mentor application for user ${userId}`);

      // Create or update mentor profile
      const mentorProfile = await prisma.mentorProfile.upsert({
        where: { userId },
        update: {
          ...data,
          status: MENTOR_STATUS.PENDING,
          rejected_at: null,
          rejection_reason: null,
          updated_at: new Date(),
        },
        create: {
          userId,
          ...data,
          status: MENTOR_STATUS.PENDING,
          total_students: 0,
          total_courses: 0,
          average_rating: 0,
          total_reviews: 0,
          total_revenue: 0,
        },
      });

      console.log(`✅ Mentor application created: ${mentorProfile.id}`);

      // Send notification to admin
      const admins = await prisma.user.findMany({
        where: { role: USER_ROLES.ADMIN, status: USER_STATUS.ACTIVE },
      });

      console.log(
        `📢 Notifying ${admins.length} admins about new mentor application`
      );

      for (const admin of admins) {
        await notificationService.create(
          admin.id,
          "SYSTEM_ANNOUNCEMENT",
          "New Mentor Application",
          `${user.full_name} has applied to become a mentor`,
          {
            userId,
            mentorProfileId: mentorProfile.id,
            userName: user.full_name,
          }
        );
      }

      // Send confirmation email to user
      console.log(`📧 Sending application confirmation email to ${user.email}`);
      await this.sendMentorApplicationEmail(user.email, user.full_name);

      return {
        id: mentorProfile.id,
        status: mentorProfile.status,
        message: "Your mentor application has been submitted successfully",
      };
    } catch (error) {
      console.error("❌ Failed to apply as mentor:", error);
      throw error;
    }
  }

  /**
   * Get all mentors with filters
   */
  async getAllMentors(
    filters: MentorListFilters
  ): Promise<{ data: any[]; meta: any }> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        expertise,
        minRating,
        sortBy = "created_at",
        sortOrder = "desc",
      } = filters;

      console.log(`🔍 Getting mentors with filters:`, filters);

      // Build where clause
      const where: Prisma.MentorProfileWhereInput = {
        status: MENTOR_STATUS.APPROVED,
        user: { status: USER_STATUS.ACTIVE },
      };

      if (search) {
        where.OR = [
          { user: { full_name: { contains: search, mode: "insensitive" } } },
          { headline: { contains: search, mode: "insensitive" } },
          { bio: { contains: search, mode: "insensitive" } },
        ];
      }

      if (expertise) {
        where.expertise = { has: expertise };
      }

      if (minRating) {
        where.average_rating = { gte: minRating };
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
            average_rating: true,
            total_students: true,
            total_courses: true,
            total_reviews: true,
            created_at: true,
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        }),
        prisma.mentorProfile.count({ where }),
      ]);

      console.log(`✅ Found ${mentors.length} mentors out of ${total} total`);

      return {
        data: mentors,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("❌ Failed to get mentors:", error);
      throw error;
    }
  }

  /**
   * Get mentor by ID with full details
   */
  async getMentorById(mentorId: string): Promise<any> {
    try {
      console.log(`🔍 Getting mentor by ID: ${mentorId}`);

      const mentor = await prisma.mentorProfile.findUnique({
        where: { id: mentorId },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar_url: true,
              bio: true,
              created_at: true,
            },
          },
          courses: {
            where: { status: "PUBLISHED" },
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              level: true,
              price: true,
              average_rating: true,
              total_students: true,
              created_at: true,
            },
            take: 6,
            orderBy: { created_at: "desc" },
          },
        },
      });

      if (!mentor) {
        console.log(`❌ Mentor not found: ${mentorId}`);
        throw new NotFoundError("Mentor not found");
      }

      console.log(`✅ Mentor found: ${mentor.user.full_name}`);
      return mentor;
    } catch (error) {
      console.error("❌ Failed to get mentor by ID:", error);
      throw error;
    }
  }

  /**
   * Get mentor profile by user ID
   */
  async getMentorByUserId(userId: string): Promise<any> {
    try {
      console.log(`🔍 Getting mentor by user ID: ${userId}`);

      const mentor = await prisma.mentorProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar_url: true,
            },
          },
        },
      });

      if (!mentor) {
        console.log(`❌ Mentor profile not found for user: ${userId}`);
        throw new NotFoundError("Mentor profile not found");
      }

      console.log(`✅ Mentor profile found: ${mentor.id}`);
      return mentor;
    } catch (error) {
      console.error("❌ Failed to get mentor by user ID:", error);
      throw error;
    }
  }

  /**
   * Update mentor profile
   */
  async updateMentorProfile(
    userId: string,
    data: MentorProfileUpdateData
  ): Promise<any> {
    try {
      console.log(`📝 Updating mentor profile for user: ${userId}`);

      const mentor = await prisma.mentorProfile.findUnique({
        where: { userId },
      });

      if (!mentor) {
        console.log(`❌ Mentor profile not found for user: ${userId}`);
        throw new NotFoundError("Mentor profile not found");
      }

      if (mentor.status !== MENTOR_STATUS.APPROVED) {
        console.log(`❌ User ${userId} is not an approved mentor`);
        throw new AppError(
          "Only approved mentors can update their profile",
          HTTP_STATUS.FORBIDDEN
        );
      }

      const updated = await prisma.mentorProfile.update({
        where: { userId },
        data: {
          ...data,
          updated_at: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar_url: true,
            },
          },
        },
      });

      console.log(`✅ Mentor profile updated: ${mentor.id}`);
      return updated;
    } catch (error) {
      console.error("❌ Failed to update mentor profile:", error);
      throw error;
    }
  }

  /**
   * Approve mentor application
   */
  async approveMentor(
    mentorId: string,
    adminId: string
  ): Promise<{ id: string; status: string }> {
    try {
      console.log(
        `✅ Approving mentor application: ${mentorId} by admin: ${adminId}`
      );

      const mentor = await prisma.mentorProfile.findUnique({
        where: { id: mentorId },
        include: { user: true },
      });

      if (!mentor) {
        console.log(`❌ Mentor application not found: ${mentorId}`);
        throw new NotFoundError("Mentor application not found");
      }

      if (mentor.status !== MENTOR_STATUS.PENDING) {
        console.log(`❌ Mentor application is not pending: ${mentor.status}`);
        throw new AppError(
          "Only pending applications can be approved",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Update mentor status and user role
      await prisma.$transaction([
        prisma.mentorProfile.update({
          where: { id: mentorId },
          data: {
            status: MENTOR_STATUS.APPROVED,
            approved_at: new Date(),
            updated_at: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: mentor.userId },
          data: { role: USER_ROLES.MENTOR },
        }),
      ]);

      console.log(`✅ Mentor application approved: ${mentorId}`);

      // Send notification to user
      await notificationService.notifyMentorApproved(mentor.userId);

      // Send email
      await this.sendMentorApprovedEmail(
        mentor.user.email,
        mentor.user.full_name
      );

      return { id: mentorId, status: MENTOR_STATUS.APPROVED };
    } catch (error) {
      console.error("❌ Failed to approve mentor:", error);
      throw error;
    }
  }

  /**
   * Reject mentor application
   */
  async rejectMentor(
    mentorId: string,
    reason: string,
    adminId: string
  ): Promise<{ id: string; status: string }> {
    try {
      console.log(
        `❌ Rejecting mentor application: ${mentorId} by admin: ${adminId}`
      );

      const mentor = await prisma.mentorProfile.findUnique({
        where: { id: mentorId },
        include: { user: true },
      });

      if (!mentor) {
        console.log(`❌ Mentor application not found: ${mentorId}`);
        throw new NotFoundError("Mentor application not found");
      }

      if (mentor.status !== MENTOR_STATUS.PENDING) {
        console.log(`❌ Mentor application is not pending: ${mentor.status}`);
        throw new AppError(
          "Only pending applications can be rejected",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Update mentor status
      await prisma.mentorProfile.update({
        where: { id: mentorId },
        data: {
          status: MENTOR_STATUS.REJECTED,
          rejected_at: new Date(),
          rejection_reason: reason,
          updated_at: new Date(),
        },
      });

      console.log(`✅ Mentor application rejected: ${mentorId}`);

      // Send notification to user
      await notificationService.notifyMentorRejected(mentor.userId, reason);

      // Send email
      await this.sendMentorRejectedEmail(
        mentor.user.email,
        mentor.user.full_name,
        reason
      );

      return { id: mentorId, status: MENTOR_STATUS.REJECTED };
    } catch (error) {
      console.error("❌ Failed to reject mentor:", error);
      throw error;
    }
  }

  /**
   * Get mentor statistics
   */
  async getMentorStatistics(userId: string): Promise<MentorStatistics> {
    try {
      console.log(`📊 Getting statistics for mentor user: ${userId}`);

      const mentor = await prisma.mentorProfile.findUnique({
        where: { userId },
      });

      if (!mentor) {
        console.log(`❌ Mentor profile not found for user: ${userId}`);
        throw new NotFoundError("Mentor profile not found");
      }

      const [total_courses, total_students, total_revenue, recent_enrollments] =
        await Promise.all([
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
              status: "PAID",
              course: { mentorId: mentor.id },
            },
            _sum: { total_amount: true },
          }),
          prisma.enrollment.count({
            where: {
              course: { mentorId: mentor.id },
              created_at: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          }),
        ]);

      const statistics: MentorStatistics = {
        total_courses,
        total_students,
        total_revenue: total_revenue._sum.total_amount || 0,
        recent_enrollments,
        average_rating: mentor.average_rating,
        total_reviews: mentor.total_reviews,
      };

      console.log(
        `✅ Statistics retrieved for mentor ${mentor.id}:`,
        statistics
      );
      return statistics;
    } catch (error) {
      console.error("❌ Failed to get mentor statistics:", error);
      throw error;
    }
  }

  /**
   * Get mentor reviews
   */
  async getMentorReviews(
    mentorId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ data: any[]; meta: any }> {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      console.log(
        `🔍 Getting reviews for mentor: ${mentorId}, page: ${page}, limit: ${limit}`
      );

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: {
            course: { mentorId },
          },
          skip,
          take: limit,
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            rating: true,
            comment: true,
            isAnonymous: true,
            created_at: true,
            user: {
              select: {
                full_name: true,
                avatar_url: true,
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

      console.log(`✅ Found ${reviews.length} reviews out of ${total} total`);

      return {
        data: reviews,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("❌ Failed to get mentor reviews:", error);
      throw error;
    }
  }

  /**
   * Get pending mentor applications
   */
  async getPendingApplications(
    options: { page?: number; limit?: number } = {}
  ): Promise<{ data: any[]; meta: any }> {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      console.log(
        `📋 Getting pending mentor applications, page: ${page}, limit: ${limit}`
      );

      const [applications, total] = await Promise.all([
        prisma.mentorProfile.findMany({
          where: { status: MENTOR_STATUS.PENDING },
          skip,
          take: limit,
          orderBy: { created_at: "desc" },
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
                avatar_url: true,
                created_at: true,
              },
            },
          },
        }),
        prisma.mentorProfile.count({
          where: { status: MENTOR_STATUS.PENDING },
        }),
      ]);

      console.log(
        `✅ Found ${applications.length} pending applications out of ${total} total`
      );

      return {
        data: applications,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("❌ Failed to get pending applications:", error);
      throw error;
    }
  }

  /**
   * Check if user is an approved mentor
   */
  async isUserApprovedMentor(userId: string): Promise<boolean> {
    try {
      const mentor = await prisma.mentorProfile.findUnique({
        where: { userId },
        select: { status: true },
      });

      return mentor?.status === MENTOR_STATUS.APPROVED;
    } catch (error) {
      console.error("❌ Failed to check mentor status:", error);
      return false;
    }
  }

  // ========================================
  // EMAIL TEMPLATE METHODS
  // ========================================

  /**
   * Send mentor application confirmation email
   */
  private async sendMentorApplicationEmail(
    to: string,
    userName: string
  ): Promise<void> {
    try {
      const subject = "Mentor Application Received - Course Online Disabilitas";
      const html = this.generateApplicationEmailTemplate(userName);

      await emailService.sendEmail({
        to,
        subject,
        html,
        text: `Hi ${userName},\n\nThank you for applying to become a mentor! Your application has been received and is under review. We will notify you once a decision has been made.\n\nBest regards,\nCourse Online Disabilitas Team`,
      });
    } catch (error) {
      console.error("❌ Failed to send mentor application email:", error);
    }
  }

  /**
   * Send mentor approved email
   */
  private async sendMentorApprovedEmail(
    to: string,
    userName: string
  ): Promise<void> {
    try {
      const subject = "Mentor Application Approved - Course Online Disabilitas";
      const html = this.generateApprovedEmailTemplate(userName);

      await emailService.sendEmail({
        to,
        subject,
        html,
        text: `Hi ${userName},\n\nCongratulations! Your mentor application has been approved. You can now create courses and start teaching on our platform.\n\nBest regards,\nCourse Online Disabilitas Team`,
      });
    } catch (error) {
      console.error("❌ Failed to send mentor approved email:", error);
    }
  }

  /**
   * Send mentor rejected email
   */
  private async sendMentorRejectedEmail(
    to: string,
    userName: string,
    reason: string
  ): Promise<void> {
    try {
      const subject = "Mentor Application Status - Course Online Disabilitas";
      const html = this.generateRejectedEmailTemplate(userName, reason);

      await emailService.sendEmail({
        to,
        subject,
        html,
        text: `Hi ${userName},\n\nThank you for your interest in becoming a mentor. Unfortunately, your application was not approved at this time.\n\nReason: ${reason}\n\nYou may reapply in the future if your circumstances change.\n\nBest regards,\nCourse Online Disabilitas Team`,
      });
    } catch (error) {
      console.error("❌ Failed to send mentor rejected email:", error);
    }
  }

  /**
   * Generate application email template
   */
  private generateApplicationEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mentor Application Received</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #4F46E5, #7E22CE); color: white; padding: 30px 20px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { padding: 30px; }
              .greeting { font-size: 18px; margin-bottom: 20px; color: #374151; }
              .message { margin-bottom: 25px; color: #6B7280; }
              .footer { padding: 20px; text-align: center; color: #9CA3AF; font-size: 14px; border-top: 1px solid #E5E7EB; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Mentor Application Received</h1>
              </div>
              <div class="content">
                  <div class="greeting">Hi ${userName},</div>
                  <div class="message">
                      Thank you for applying to become a mentor on Course Online Disabilitas! Your application has been received and is currently under review.
                  </div>
                  <div class="message">
                      Our team will carefully evaluate your application and get back to you within 3-5 business days. You will be notified via email once a decision has been made.
                  </div>
                  <div class="message">
                      In the meantime, feel free to explore our platform and get familiar with the features available to mentors.
                  </div>
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} Course Online Disabilitas. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate approved email template
   */
  private generateApprovedEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mentor Application Approved</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #059669, #10B981); color: white; padding: 30px 20px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { padding: 30px; }
              .greeting { font-size: 18px; margin-bottom: 20px; color: #374151; }
              .message { margin-bottom: 25px; color: #6B7280; }
              .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #059669, #10B981); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .footer { padding: 20px; text-align: center; color: #9CA3AF; font-size: 14px; border-top: 1px solid #E5E7EB; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Congratulations!</h1>
              </div>
              <div class="content">
                  <div class="greeting">Hi ${userName},</div>
                  <div class="message">
                      We're excited to inform you that your mentor application has been approved!
                  </div>
                  <div class="message">
                      You now have access to create and manage courses on our platform. Start sharing your knowledge with students today!
                  </div>
                  <div style="text-align: center;">
                      <a href="${
                        process.env.APP_URL
                      }/mentor/dashboard" class="button">Go to Mentor Dashboard</a>
                  </div>
                  <div class="message">
                      If you have any questions or need assistance, please don't hesitate to contact our support team.
                  </div>
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} Course Online Disabilitas. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate rejected email template
   */
  private generateRejectedEmailTemplate(
    userName: string,
    reason: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mentor Application Status</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #DC2626, #EF4444); color: white; padding: 30px 20px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { padding: 30px; }
              .greeting { font-size: 18px; margin-bottom: 20px; color: #374151; }
              .message { margin-bottom: 25px; color: #6B7280; }
              .reason { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; color: #dc2626; }
              .footer { padding: 20px; text-align: center; color: #9CA3AF; font-size: 14px; border-top: 1px solid #E5E7EB; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Mentor Application Update</h1>
              </div>
              <div class="content">
                  <div class="greeting">Hi ${userName},</div>
                  <div class="message">
                      Thank you for your interest in becoming a mentor on Course Online Disabilitas.
                  </div>
                  <div class="message">
                      After careful consideration, we regret to inform you that your application was not approved at this time.
                  </div>
                  <div class="reason">
                      <strong>Reason:</strong><br>
                      ${reason}
                  </div>
                  <div class="message">
                      We encourage you to gain more experience in your field and consider reapplying in the future. We appreciate your understanding.
                  </div>
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} Course Online Disabilitas. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  /**
   * Get service status
   */
  getServiceStatus(): any {
    return {
      emailService: emailService.getStatus(),
      notificationService: notificationService.getServiceStatus(),
      database: "Connected",
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
const mentorService = new MentorService();
export default mentorService;
