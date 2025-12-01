// services/analytics.service.ts
import prisma from "@/lib/prisma";
import { logInfo, logError } from "@/utils/logger.util";
import type { Prisma } from "@prisma/client";

/**
 * Event Types
 */
export type AnalyticsEventType =
  | "page_view"
  | "course_view"
  | "video_watch"
  | "video_complete"
  | "search"
  | "enrollment"
  | "purchase"
  | "certificate_download"
  | "course_complete"
  | "material_access"
  | "comment_create"
  | "review_create"
  | "wishlist_add"
  | "custom";

/**
 * Analytics Event Data
 */
interface AnalyticsEvent {
  userId?: string;
  eventType: AnalyticsEventType;
  eventData: Record<string, unknown>;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  timestamp: Date;
}

/**
 * Course Analytics
 */
interface CourseAnalytics {
  courseId: string;
  views: number;
  uniqueVisitors: number;
  enrollments: number;
  completions: number;
  averageWatchTime: number;
  engagementRate: number;
  revenue?: number;
}

/**
 * User Behavior
 */
interface UserBehavior {
  userId: string;
  coursesViewed: string[];
  coursesEnrolled: string[];
  totalWatchTime: number;
  favoriteCategories: string[];
  averageSessionDuration: number;
  lastActive: Date;
  completedCourses: number;
  certificatesEarned: number;
}

/**
 * Platform Statistics
 */
interface PlatformStatistics {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  activeUsers: number;
  completionRate: number;
  popularCategories: Array<{ categoryId: string; name: string; count: number }>;
}

/**
 * Analytics Service
 * Handles event tracking and analytics processing without Redis
 */
export class AnalyticsService {
  /**
   * Track event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Store in database for analytics
      await prisma.activityLog.create({
        data: {
          user_id: event.userId || "anonymous",
          action: event.eventType.toUpperCase(),
          entity_type: this.extractEntityType(event.eventData),
          entity_id: this.extractEntityId(event.eventData),
          metadata: event.eventData as Prisma.JsonObject,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
        },
      });

      // Update specific counters based on event type
      await this.updateCounters(event);

      logInfo(`Event tracked: ${event.eventType}`, {
        userId: event.userId,
        eventData: event.eventData,
      });
    } catch (error) {
      logError("Failed to track event", error);
      throw error;
    }
  }

  /**
   * Track page view
   */
  async trackPageView(
    userId: string | undefined,
    url: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: "page_view",
      eventData: {
        url,
        ...metadata,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Track course view
   */
  async trackCourseView(
    userId: string | undefined,
    courseId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: "course_view",
      eventData: {
        courseId,
        ...metadata,
      },
      timestamp: new Date(),
    });

    // Increment course view count in database
    await prisma.course.update({
      where: { id: courseId },
      data: { total_views: { increment: 1 } },
    });
  }

  /**
   * Track video watch
   */
  async trackVideoWatch(
    userId: string,
    videoId: string,
    materialId: string,
    courseId: string,
    watchDuration: number,
    totalDuration: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const watchPercentage = (watchDuration / totalDuration) * 100;

    await this.trackEvent({
      userId,
      eventType: "video_watch",
      eventData: {
        videoId,
        materialId,
        courseId,
        watchDuration,
        totalDuration,
        watchPercentage,
        ...metadata,
      },
      timestamp: new Date(),
    });

    // Track completion if >= 90%
    if (watchPercentage >= 90) {
      await this.trackEvent({
        userId,
        eventType: "video_complete",
        eventData: {
          videoId,
          materialId,
          courseId,
          watchDuration,
          totalDuration,
        },
        timestamp: new Date(),
      });

      // Update progress in database
      await this.updateMaterialProgress(userId, materialId, true);
    } else {
      // Update progress without marking as completed
      await this.updateMaterialProgress(
        userId,
        materialId,
        false,
        watchDuration
      );
    }
  }

  /**
   * Track search
   */
  async trackSearch(
    userId: string | undefined,
    query: string,
    resultsCount: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: "search",
      eventData: {
        query,
        resultsCount,
        ...metadata,
      },
      timestamp: new Date(),
    });

    // Store search in database for analytics
    await prisma.searchLog.create({
      data: {
        user_id: userId || null,
        query,
        results_count: resultsCount,
        metadata: metadata as Prisma.JsonObject,
      },
    });
  }

  /**
   * Track enrollment
   */
  async trackEnrollment(
    userId: string,
    courseId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: "enrollment",
      eventData: {
        courseId,
        ...metadata,
      },
      timestamp: new Date(),
    });

    // Update course enrollment count
    await prisma.course.update({
      where: { id: courseId },
      data: { total_students: { increment: 1 } },
    });
  }

  /**
   * Track purchase
   */
  async trackPurchase(
    userId: string,
    courseId: string,
    amount: number,
    transactionId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: "purchase",
      eventData: {
        courseId,
        amount,
        transactionId,
        ...metadata,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Track course completion
   */
  async trackCourseCompletion(
    userId: string,
    courseId: string,
    enrollmentId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: "course_complete",
      eventData: {
        courseId,
        enrollmentId,
        ...metadata,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Get course analytics
   */
  async getCourseAnalytics(
    courseId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<CourseAnalytics> {
    const dateFilter: Prisma.ActivityLogWhereInput = {
      OR: [
        { entity_type: "COURSE", entity_id: courseId },
        { metadata: { path: ["courseId"], equals: courseId } },
      ],
    };

    if (dateFrom || dateTo) {
      dateFilter.created_at = {};
      if (dateFrom) dateFilter.created_at.gte = dateFrom;
      if (dateTo) dateFilter.created_at.lte = dateTo;
    }

    const [
      views,
      enrollments,
      completions,
      watchTimeData,
      course,
      uniqueVisitors,
      revenueData,
    ] = await Promise.all([
      // Total views from activity logs
      prisma.activityLog.count({
        where: {
          ...dateFilter,
          action: "COURSE_VIEW",
        },
      }),

      // Enrollments
      prisma.enrollment.count({
        where: {
          course_id: courseId,
          ...(dateFrom || dateTo
            ? {
                created_at: {
                  ...(dateFrom ? { gte: dateFrom } : {}),
                  ...(dateTo ? { lte: dateTo } : {}),
                },
              }
            : {}),
        },
      }),

      // Completions
      prisma.enrollment.count({
        where: {
          course_id: courseId,
          status: "COMPLETED",
          ...(dateFrom || dateTo
            ? {
                completed_at: {
                  ...(dateFrom ? { gte: dateFrom } : {}),
                  ...(dateTo ? { lte: dateTo } : {}),
                },
              }
            : {}),
        },
      }),

      // Watch time data
      prisma.activityLog.findMany({
        where: {
          action: "VIDEO_WATCH",
          metadata: {
            path: ["courseId"],
            equals: courseId,
          },
          ...(dateFrom || dateTo
            ? {
                created_at: {
                  ...(dateFrom ? { gte: dateFrom } : {}),
                  ...(dateTo ? { lte: dateTo } : {}),
                },
              }
            : {}),
        },
        select: {
          metadata: true,
        },
      }),

      // Course data
      prisma.course.findUnique({
        where: { id: courseId },
        select: {
          total_views: true,
          total_students: true,
          total_revenue: true,
        },
      }),

      // Unique visitors (distinct users who viewed the course)
      prisma.activityLog.findMany({
        where: {
          ...dateFilter,
          action: "COURSE_VIEW",
          NOT: { user_id: "anonymous" },
        },
        distinct: ["user_id"],
        select: {
          user_id: true,
        },
      }),

      // Revenue from transactions
      prisma.transaction.aggregate({
        where: {
          course_id: courseId,
          status: "PAID",
          ...(dateFrom || dateTo
            ? {
                paid_at: {
                  ...(dateFrom ? { gte: dateFrom } : {}),
                  ...(dateTo ? { lte: dateTo } : {}),
                },
              }
            : {}),
        },
        _sum: {
          total_amount: true,
        },
      }),
    ]);

    // Calculate average watch time
    let totalWatchTime = 0;
    let validWatchRecords = 0;

    watchTimeData.forEach((log: { metadata: Prisma.JsonValue }) => {
      const metadata = log.metadata as { watchDuration?: number };
      if (
        metadata.watchDuration &&
        typeof metadata.watchDuration === "number"
      ) {
        totalWatchTime += metadata.watchDuration;
        validWatchRecords++;
      }
    });

    const averageWatchTime =
      validWatchRecords > 0 ? totalWatchTime / validWatchRecords : 0;

    // Calculate engagement rate
    const engagementRate = views > 0 ? (enrollments / views) * 100 : 0;

    return {
      courseId,
      views: course?.total_views || views,
      uniqueVisitors: uniqueVisitors.length,
      enrollments,
      completions,
      averageWatchTime,
      engagementRate,
      revenue: revenueData._sum.total_amount?.toNumber() || 0,
    };
  }

  /**
   * Get user behavior
   */
  async getUserBehavior(userId: string): Promise<UserBehavior> {
    const [
      coursesViewed,
      enrollments,
      activityLogs,
      completedEnrollments,
      certificates,
    ] = await Promise.all([
      // Courses viewed
      prisma.activityLog.findMany({
        where: {
          user_id: userId,
          action: "COURSE_VIEW",
        },
        select: {
          entity_id: true,
        },
        distinct: ["entity_id"],
      }),

      // Courses enrolled
      prisma.enrollment.findMany({
        where: { user_id: userId },
        select: {
          course_id: true,
        },
      }),

      // Recent activity for session calculation
      prisma.activityLog.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: { created_at: "desc" },
        take: 1000,
      }),

      // Completed enrollments
      prisma.enrollment.findMany({
        where: {
          user_id: userId,
          status: "COMPLETED",
        },
        select: {
          course_id: true,
        },
      }),

      // Certificates earned
      prisma.certificate.count({
        where: {
          user_id: userId,
          status: "ISSUED",
        },
      }),
    ]);

    // Calculate total watch time from video watch events
    const watchEvents = await prisma.activityLog.findMany({
      where: {
        user_id: userId,
        action: "VIDEO_WATCH",
      },
      select: {
        metadata: true,
      },
    });

    let totalWatchTime = 0;
    watchEvents.forEach((event: { metadata: Prisma.JsonValue }) => {
      const metadata = event.metadata as { watchDuration?: number };
      if (
        metadata.watchDuration &&
        typeof metadata.watchDuration === "number"
      ) {
        totalWatchTime += metadata.watchDuration;
      }
    });

    // Get favorite categories
    const categoryCounts = new Map<string, number>();
    for (const log of activityLogs) {
      if (log.action === "COURSE_VIEW" && log.entity_id) {
        try {
          const course = await prisma.course.findUnique({
            where: { id: log.entity_id },
            select: { category_id: true },
          });
          if (course && course.category_id) {
            categoryCounts.set(
              course.category_id,
              (categoryCounts.get(course.category_id) || 0) + 1
            );
          }
        } catch (error) {
          // Skip if course not found
          continue;
        }
      }
    }

    const favoriteCategories = Array.from(categoryCounts.entries())
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 5)
      .map(([categoryId]) => categoryId);

    // Calculate average session duration
    const sessions = this.groupIntoSessions(activityLogs);
    const totalSessionDuration = sessions.reduce(
      (sum: number, session: { duration: number }) => sum + session.duration,
      0
    );
    const averageSessionDuration =
      sessions.length > 0 ? totalSessionDuration / sessions.length : 0;

    return {
      userId,
      coursesViewed: coursesViewed
        .map((log: { entity_id: string | null }) => log.entity_id!)
        .filter(Boolean),
      coursesEnrolled: enrollments.map(
        (e: { course_id: string }) => e.course_id
      ),
      totalWatchTime,
      favoriteCategories,
      averageSessionDuration,
      lastActive: activityLogs[0]?.created_at || new Date(),
      completedCourses: completedEnrollments.length,
      certificatesEarned: certificates,
    };
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(
    limit: number = 10
  ): Promise<Array<{ query: string; count: number }>> {
    const popularSearches = await prisma.searchLog.groupBy({
      by: ["query"],
      _count: {
        query: true,
      },
      orderBy: {
        _count: {
          query: "desc",
        },
      },
      take: limit,
    });

    return popularSearches.map(
      (search: { query: string; _count: { query: number } }) => ({
        query: search.query,
        count: search._count.query,
      })
    );
  }

  /**
   * Get trending courses
   */
  async getTrendingCourses(
    limit: number = 10,
    timeWindow: number = 7 * 24 * 60 * 60 * 1000 // 7 days
  ): Promise<
    Array<{
      courseId: string;
      title: string;
      score: number;
      views: number;
      enrollments: number;
    }>
  > {
    const since = new Date(Date.now() - timeWindow);

    const recentViews = await prisma.activityLog.groupBy({
      by: ["entity_id"],
      where: {
        action: "COURSE_VIEW",
        entity_type: "COURSE",
        created_at: { gte: since },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: limit * 2, // Get more to filter out nulls
    });

    // Get course details and enrollment counts
    const coursesWithDetails = await Promise.all(
      recentViews
        .filter((view: { entity_id: string | null }) => view.entity_id) // Filter out null entityIds
        .slice(0, limit)
        .map(async (view: { entity_id: string; _count: { id: number } }) => {
          const course = await prisma.course.findUnique({
            where: { id: view.entity_id! },
            select: {
              id: true,
              title: true,
              total_views: true,
              total_students: true,
            },
          });

          if (!course) return null;

          return {
            courseId: course.id,
            title: course.title,
            score: view._count.id,
            views: course.total_views,
            enrollments: course.total_students,
          };
        })
    );

    return coursesWithDetails.filter(Boolean) as Array<{
      courseId: string;
      title: string;
      score: number;
      views: number;
      enrollments: number;
    }>;
  }

  /**
   * Get platform statistics
   */
  async getPlatformStatistics(): Promise<PlatformStatistics> {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      activeUsers,
      completedEnrollments,
      categories,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total courses (only published)
      prisma.course.count({
        where: { status: "PUBLISHED" },
      }),

      // Total enrollments
      prisma.enrollment.count(),

      // Total revenue
      prisma.transaction.aggregate({
        where: { status: "PAID" },
        _sum: { total_amount: true },
      }),

      // Active users (last 30 days)
      prisma.user.count({
        where: {
          last_login: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Completed enrollments
      prisma.enrollment.count({
        where: { status: "COMPLETED" },
      }),

      // Popular categories
      prisma.course.groupBy({
        by: ["category_id"],
        where: { status: "PUBLISHED" },
        _count: { id: true },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 10,
      }),
    ]);

    // Get category names
    const popularCategories = await Promise.all(
      categories.map(
        async (category: { category_id: string; _count: { id: number } }) => {
          const categoryData = await prisma.category.findUnique({
            where: { id: category.category_id },
            select: { name: true },
          });

          return {
            categoryId: category.category_id,
            name: categoryData?.name || "Unknown",
            count: category._count.id,
          };
        }
      )
    );

    const completionRate =
      totalEnrollments > 0
        ? (completedEnrollments / totalEnrollments) * 100
        : 0;

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: totalRevenue._sum.total_amount?.toNumber() || 0,
      activeUsers,
      completionRate,
      popularCategories,
    };
  }

  /**
   * Get user learning statistics
   */
  async getUserLearningStatistics(userId: string): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    completedCourses: number;
    totalWatchTime: number;
    averageProgress: number;
    certificatesEarned: number;
    lastActive: Date;
  }> {
    const [
      enrollments,
      completedEnrollments,
      certificates,
      lastActivity,
      watchEvents,
    ] = await Promise.all([
      // All enrollments
      prisma.enrollment.findMany({
        where: { user_id: userId },
        select: {
          status: true,
          progress: true,
        },
      }),

      // Completed enrollments
      prisma.enrollment.count({
        where: {
          user_id: userId,
          status: "COMPLETED",
        },
      }),

      // Certificates
      prisma.certificate.count({
        where: {
          user_id: userId,
          status: "ISSUED",
        },
      }),

      // Last activity
      prisma.activityLog.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        select: { created_at: true },
      }),

      // Watch events for total watch time
      prisma.activityLog.findMany({
        where: {
          user_id: userId,
          action: "VIDEO_WATCH",
        },
        select: {
          metadata: true,
        },
      }),
    ]);

    // Calculate total watch time
    let totalWatchTime = 0;
    watchEvents.forEach((event: { metadata: Prisma.JsonValue }) => {
      const metadata = event.metadata as { watchDuration?: number };
      if (
        metadata.watchDuration &&
        typeof metadata.watchDuration === "number"
      ) {
        totalWatchTime += metadata.watchDuration;
      }
    });

    // Calculate average progress
    const totalProgress = enrollments.reduce(
      (sum: number, enrollment: { progress: number }) =>
        sum + enrollment.progress,
      0
    );
    const averageProgress =
      enrollments.length > 0 ? totalProgress / enrollments.length : 0;

    const activeEnrollments = enrollments.filter(
      (e: { status: string }) =>
        e.status === "ACTIVE" || e.status === "COMPLETED"
    ).length;

    return {
      totalEnrollments: enrollments.length,
      activeEnrollments,
      completedCourses: completedEnrollments,
      totalWatchTime,
      averageProgress,
      certificatesEarned: certificates,
      lastActive: lastActivity?.created_at || new Date(),
    };
  }

  /**
   * Update counters based on event type
   */
  private async updateCounters(event: AnalyticsEvent): Promise<void> {
    // Counters are now handled directly in database updates within specific track methods
    // This method is kept for future expansion if needed
  }

  /**
   * Update material progress
   */
  private async updateMaterialProgress(
    userId: string,
    materialId: string,
    isCompleted: boolean,
    watchedDuration?: number
  ): Promise<void> {
    try {
      // Find the enrollment for this material
      const material = await prisma.material.findUnique({
        where: { id: materialId },
        select: {
          section: {
            select: {
              course_id: true,
            },
          },
        },
      });

      if (!material) return;

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          user_id: userId,
          course_id: material.section.course_id,
        },
      });

      if (!enrollment) return;

      // Update or create progress record
      await prisma.progress.upsert({
        where: {
          enrollment_id_material_id: {
            enrollment_id: enrollment.id,
            material_id: materialId,
          },
        },
        create: {
          enrollment_id: enrollment.id,
          material_id: materialId,
          user_id: userId,
          is_completed: isCompleted,
          watched_duration: watchedDuration || 0,
          last_position: watchedDuration || 0,
          ...(isCompleted && { completed_at: new Date() }),
        },
        update: {
          is_completed: isCompleted,
          watched_duration: watchedDuration,
          last_position: watchedDuration,
          ...(isCompleted && !watchedDuration && { completed_at: new Date() }),
        },
      });

      // Update overall course progress
      await this.updateCourseProgress(enrollment.id);
    } catch (error) {
      logError("Failed to update material progress", error);
    }
  }

  /**
   * Update course progress
   */
  private async updateCourseProgress(enrollmentId: string): Promise<void> {
    try {
      const progressData = await prisma.progress.groupBy({
        by: ["enrollment_id"],
        where: { enrollment_id: enrollmentId },
        _count: {
          material_id: true,
        },
        _sum: {
          watched_duration: true,
        },
      });

      const completedMaterials = await prisma.progress.count({
        where: {
          enrollment_id: enrollmentId,
          is_completed: true,
        },
      });

      const totalMaterials = await prisma.material.count({
        where: {
          section: {
            course: {
              enrollments: {
                some: { id: enrollmentId },
              },
            },
          },
        },
      });

      const progress =
        totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;

      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          progress,
          ...(progress >= 90 && {
            status: "COMPLETED",
            completed_at: new Date(),
          }),
        },
      });
    } catch (error) {
      logError("Failed to update course progress", error);
    }
  }

  /**
   * Extract entity type from event data
   */
  private extractEntityType(
    eventData: Record<string, unknown>
  ): string | undefined {
    if (eventData.courseId) return "COURSE";
    if (eventData.materialId) return "MATERIAL";
    if (eventData.videoId) return "VIDEO";
    if (eventData.transactionId) return "TRANSACTION";
    return undefined;
  }

  /**
   * Extract entity ID from event data
   */
  private extractEntityId(
    eventData: Record<string, unknown>
  ): string | undefined {
    return (eventData.courseId ||
      eventData.materialId ||
      eventData.videoId ||
      eventData.transactionId) as string | undefined;
  }

  /**
   * Group activity logs into sessions
   */
  private groupIntoSessions(
    logs: Array<{ created_at: Date }>
  ): Array<{ duration: number }> {
    if (logs.length === 0) return [];

    const sessions: Array<{ duration: number }> = [];
    const sessionGap = 30 * 60 * 1000; // 30 minutes

    let sessionStart = logs[0].created_at.getTime();
    let lastActivity = sessionStart;

    for (let i = 1; i < logs.length; i++) {
      const currentTime = logs[i].created_at.getTime();
      const gap = currentTime - lastActivity;

      if (gap > sessionGap) {
        // End current session
        sessions.push({
          duration: lastActivity - sessionStart,
        });
        // Start new session
        sessionStart = currentTime;
      }

      lastActivity = currentTime;
    }

    // Add final session
    sessions.push({
      duration: lastActivity - sessionStart,
    });

    return sessions;
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
