// services/notification.service.ts
import prisma from "@/lib/prisma";
import emailService from "./email.service";
import type { NotificationType, Notification } from "@prisma/client";
import type { Prisma } from "@prisma/client";

// Types berdasarkan schema Prisma yang ada
interface UserNotificationSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  courseUpdates: boolean;
  paymentNotifications: boolean;
  certificateNotifications: boolean;
  commentNotifications: boolean;
  reviewNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

interface EmailNotificationOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class NotificationService {
  /**
   * Create notification with user preferences check
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<Notification> {
    try {
      console.log(`📢 Creating notification for user ${userId}, type: ${type}`);

      // Check user notification settings
      const settings = await this.getUserNotificationSettings(userId);

      // Check if this type of notification is enabled
      if (settings && !this.isNotificationEnabled(settings, type)) {
        console.log(`📢 Notification type ${type} disabled for user ${userId}`);
        throw new Error(`Notification type ${type} is disabled`);
      }

      // Create notification in database
      console.log(`📢 Saving notification to database...`);
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data: (data || {}) as Prisma.JsonObject,
          status: "UNREAD",
        },
      });

      console.log(`✅ Notification created: ${notification.id}`);

      // Send email if enabled
      if (settings?.emailNotifications) {
        console.log(`📧 Sending email notification...`);
        await this.sendEmailNotification(userId, title, message);
      }

      return notification;
    } catch (error) {
      console.error("❌ Failed to create notification:", error);
      throw error;
    }
  }

  /**
   * Get user notification settings
   */
  private async getUserNotificationSettings(
    userId: string
  ): Promise<UserNotificationSettings | null> {
    try {
      // Try to find existing settings
      const settings = await prisma.userNotificationSettings.findUnique({
        where: { userId },
      });

      if (settings) {
        return settings;
      }

      // Create default settings if not exists
      console.log(
        `⚙️ Creating default notification settings for user ${userId}`
      );
      const defaultSettings = await prisma.userNotificationSettings.create({
        data: {
          userId,
          emailNotifications: true,
          pushNotifications: true,
          courseUpdates: true,
          paymentNotifications: true,
          certificateNotifications: true,
          commentNotifications: true,
          reviewNotifications: true,
        },
      });

      return defaultSettings;
    } catch (error) {
      console.error("❌ Failed to get user notification settings:", error);
      return null;
    }
  }

  /**
   * Check if notification type is enabled
   */
  private isNotificationEnabled(
    settings: UserNotificationSettings,
    type: NotificationType
  ): boolean {
    const typeMap: Record<NotificationType, keyof UserNotificationSettings> = {
      COURSE_ENROLLMENT: "courseUpdates",
      COURSE_UPDATE: "courseUpdates",
      PAYMENT_SUCCESS: "paymentNotifications",
      PAYMENT_FAILED: "paymentNotifications",
      CERTIFICATE_ISSUED: "certificateNotifications",
      COMMENT_REPLY: "commentNotifications",
      REVIEW_RECEIVED: "reviewNotifications",
      MENTOR_APPROVED: "courseUpdates",
      MENTOR_REJECTED: "courseUpdates",
      SYSTEM_ANNOUNCEMENT: "emailNotifications",
    };

    const settingKey = typeMap[type];
    return settingKey ? Boolean(settings[settingKey]) : true;
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    userId: string,
    title: string,
    message: string
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, full_name: true },
      });

      if (!user) {
        console.log(`❌ User not found: ${userId}`);
        return;
      }

      const emailOptions: EmailNotificationOptions = {
        to: user.email,
        subject: title,
        html: this.generateEmailTemplate(title, message, user.full_name),
        text: `${title}\n\n${message}\n\nBest regards,\nCourse Online Disabilitas Team`,
      };

      const result = await emailService.sendEmail(emailOptions);

      if (!result.success) {
        console.error("❌ Failed to send email notification:", result.error);
      } else {
        console.log(`✅ Email notification sent to ${user.email}`);
      }
    } catch (error) {
      console.error("❌ Error sending email notification:", error);
      // Don't throw error, just log it
    }
  }

  /**
   * Generate email template for notifications
   */
  private generateEmailTemplate(
    title: string,
    message: string,
    userName: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 0;
                  background-color: #f9fafb;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: #ffffff;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                  background: linear-gradient(135deg, #4F46E5, #7E22CE);
                  color: white;
                  padding: 30px 20px;
                  text-align: center;
              }
              .header h1 {
                  margin: 0;
                  font-size: 24px;
                  font-weight: 600;
              }
              .content {
                  padding: 30px;
              }
              .greeting {
                  font-size: 18px;
                  margin-bottom: 20px;
                  color: #374151;
              }
              .message {
                  margin-bottom: 25px;
                  color: #6B7280;
                  background: #f8f9fa;
                  padding: 20px;
                  border-radius: 6px;
                  border-left: 4px solid #4F46E5;
              }
              .footer {
                  padding: 20px;
                  text-align: center;
                  color: #9CA3AF;
                  font-size: 14px;
                  border-top: 1px solid #E5E7EB;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Course Online Disabilitas</h1>
              </div>
              <div class="content">
                  <div class="greeting">Hi ${userName},</div>
                  
                  <div class="message">
                      <strong>${title}</strong><br><br>
                      ${message}
                  </div>

                  <div style="color: #6B7280; font-size: 14px;">
                      This is an automated notification from Course Online Disabilitas.
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
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: "UNREAD" | "READ" | "ARCHIVED";
    } = {}
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;

      const whereClause: any = { userId };
      if (options.status) {
        whereClause.status = options.status;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.notification.count({
          where: whereClause,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      console.log(
        `📢 Retrieved ${notifications.length} notifications for user ${userId}`
      );

      return {
        notifications,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error("❌ Failed to get user notifications:", error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      console.log(`📢 Marking notification as read: ${notificationId}`);

      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: "READ",
          readAt: new Date(),
        },
      });

      console.log(`✅ Notification marked as read: ${notificationId}`);
      return notification;
    } catch (error) {
      console.error("❌ Failed to mark notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    try {
      console.log(`📢 Marking all notifications as read for user: ${userId}`);

      const result = await prisma.notification.updateMany({
        where: {
          userId,
          status: "UNREAD",
        },
        data: {
          status: "READ",
          readAt: new Date(),
        },
      });

      console.log(
        `✅ Marked ${result.count} notifications as read for user ${userId}`
      );
      return { count: result.count };
    } catch (error) {
      console.error("❌ Failed to mark all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Archive notification
   */
  async archiveNotification(notificationId: string): Promise<Notification> {
    try {
      console.log(`📢 Archiving notification: ${notificationId}`);

      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: "ARCHIVED",
        },
      });

      console.log(`✅ Notification archived: ${notificationId}`);
      return notification;
    } catch (error) {
      console.error("❌ Failed to archive notification:", error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      console.log(`📢 Deleting notification: ${notificationId}`);

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      console.log(`✅ Notification deleted: ${notificationId}`);
    } catch (error) {
      console.error("❌ Failed to delete notification:", error);
      throw error;
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          status: "UNREAD",
        },
      });

      console.log(`📢 User ${userId} has ${count} unread notifications`);
      return count;
    } catch (error) {
      console.error("❌ Failed to get unread count:", error);
      throw error;
    }
  }

  /**
   * Update user notification settings
   */
  async updateNotificationSettings(
    userId: string,
    settings: Partial<
      Omit<
        UserNotificationSettings,
        "id" | "userId" | "createdAt" | "updatedAt"
      >
    >
  ): Promise<UserNotificationSettings> {
    try {
      console.log(`⚙️ Updating notification settings for user: ${userId}`);

      const updatedSettings = await prisma.userNotificationSettings.upsert({
        where: { userId },
        update: {
          ...settings,
          updatedAt: new Date(),
        },
        create: {
          userId,
          ...settings,
        },
      });

      console.log(`✅ Notification settings updated for user: ${userId}`);
      return updatedSettings;
    } catch (error) {
      console.error("❌ Failed to update notification settings:", error);
      throw error;
    }
  }

  /**
   * Get user notification settings
   */
  async getUserSettings(userId: string): Promise<UserNotificationSettings> {
    try {
      console.log(`⚙️ Getting notification settings for user: ${userId}`);

      let settings = await prisma.userNotificationSettings.findUnique({
        where: { userId },
      });

      if (!settings) {
        console.log(`⚙️ Creating default settings for user: ${userId}`);
        settings = await prisma.userNotificationSettings.create({
          data: {
            userId,
            emailNotifications: true,
            pushNotifications: true,
            courseUpdates: true,
            paymentNotifications: true,
            certificateNotifications: true,
            commentNotifications: true,
            reviewNotifications: true,
          },
        });
      }

      console.log(`✅ Retrieved notification settings for user: ${userId}`);
      return settings;
    } catch (error) {
      console.error("❌ Failed to get notification settings:", error);
      throw error;
    }
  }

  /**
   * Clean old notifications (older than specified days)
   */
  async cleanOldNotifications(
    days: number = 90
  ): Promise<{ deletedCount: number }> {
    try {
      console.log(`🧹 Cleaning notifications older than ${days} days`);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          status: {
            in: ["READ", "ARCHIVED"],
          },
        },
      });

      console.log(`✅ Cleaned ${result.count} old notifications`);
      return { deletedCount: result.count };
    } catch (error) {
      console.error("❌ Failed to clean old notifications:", error);
      throw error;
    }
  }

  // ========================================
  // CONVENIENCE METHODS FOR COMMON NOTIFICATIONS
  // ========================================

  /**
   * Notify course enrollment
   */
  async notifyCourseEnrollment(
    userId: string,
    courseName: string,
    courseId: string
  ): Promise<Notification> {
    return this.create(
      userId,
      "COURSE_ENROLLMENT",
      "Course Enrollment Successful",
      `You have successfully enrolled in "${courseName}". You can now start learning!`,
      { courseName, courseId, action: "VIEW_COURSE" }
    );
  }

  /**
   * Notify payment success
   */
  async notifyPaymentSuccess(
    userId: string,
    courseName: string,
    amount: number,
    transactionId: string
  ): Promise<Notification> {
    return this.create(
      userId,
      "PAYMENT_SUCCESS",
      "Payment Successful",
      `Your payment of Rp ${amount.toLocaleString(
        "id-ID"
      )} for "${courseName}" was successful.`,
      { courseName, amount, transactionId, action: "VIEW_COURSE" }
    );
  }

  /**
   * Notify payment failed
   */
  async notifyPaymentFailed(
    userId: string,
    courseName: string,
    amount: number,
    reason: string
  ): Promise<Notification> {
    return this.create(
      userId,
      "PAYMENT_FAILED",
      "Payment Failed",
      `Your payment of Rp ${amount.toLocaleString(
        "id-ID"
      )} for "${courseName}" failed. Reason: ${reason}`,
      { courseName, amount, reason, action: "RETRY_PAYMENT" }
    );
  }

  /**
   * Notify certificate issued
   */
  async notifyCertificateIssued(
    userId: string,
    courseName: string,
    certificateId: string
  ): Promise<Notification> {
    return this.create(
      userId,
      "CERTIFICATE_ISSUED",
      "Certificate Ready",
      `Congratulations! Your certificate for "${courseName}" is now available.`,
      { courseName, certificateId, action: "VIEW_CERTIFICATE" }
    );
  }

  /**
   * Notify mentor application approved
   */
  async notifyMentorApproved(userId: string): Promise<Notification> {
    return this.create(
      userId,
      "MENTOR_APPROVED",
      "Mentor Application Approved",
      "Congratulations! Your mentor application has been approved. You can now create and manage courses.",
      { action: "VIEW_DASHBOARD" }
    );
  }

  /**
   * Notify mentor application rejected
   */
  async notifyMentorRejected(
    userId: string,
    reason: string
  ): Promise<Notification> {
    return this.create(
      userId,
      "MENTOR_REJECTED",
      "Mentor Application Status",
      `Your mentor application was not approved at this time. Reason: ${reason}`,
      { reason, action: "VIEW_PROFILE" }
    );
  }

  /**
   * Notify course update
   */
  async notifyCourseUpdate(
    userId: string,
    courseName: string,
    updateDescription: string,
    courseId: string
  ): Promise<Notification> {
    return this.create(
      userId,
      "COURSE_UPDATE",
      "Course Updated",
      `The course "${courseName}" has been updated: ${updateDescription}`,
      { courseName, updateDescription, courseId, action: "VIEW_COURSE" }
    );
  }

  /**
   * Notify comment reply
   */
  async notifyCommentReply(
    userId: string,
    commenterName: string,
    materialTitle: string,
    materialId: string
  ): Promise<Notification> {
    return this.create(
      userId,
      "COMMENT_REPLY",
      "New Reply to Your Comment",
      `${commenterName} replied to your comment in "${materialTitle}"`,
      { commenterName, materialTitle, materialId, action: "VIEW_MATERIAL" }
    );
  }

  /**
   * Notify new review
   */
  async notifyReviewReceived(
    userId: string,
    reviewerName: string,
    courseName: string,
    rating: number,
    courseId: string
  ): Promise<Notification> {
    return this.create(
      userId,
      "REVIEW_RECEIVED",
      "New Course Review",
      `${reviewerName} gave your course "${courseName}" a ${rating}-star rating`,
      { reviewerName, courseName, rating, courseId, action: "VIEW_REVIEWS" }
    );
  }

  /**
   * System announcement
   */
  async notifySystemAnnouncement(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<Notification> {
    return this.create(userId, "SYSTEM_ANNOUNCEMENT", title, message, data);
  }

  /**
   * Get service status
   */
  getServiceStatus(): any {
    return {
      emailService: emailService.getStatus(),
      database: "Connected",
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
