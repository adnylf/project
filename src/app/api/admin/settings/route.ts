// src/app/api/admin/settings/route.ts
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
} from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAdmin, AuthContext } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * Platform Settings Structure
 */
interface PlatformSettings {
  commission: {
    platformFeePercentage: number;
    mentorRevenuePercentage: number;
    paymentGatewayFee: number;
    minimumPayout: number;
  };
  limits: {
    maxCoursePrice: number;
    maxFileUploadSize: number;
    maxVideoUploadSize: number;
    maxImageUploadSize: number;
    maxCoursesPerMentor: number;
    maxStudentsPerCourse: number;
    maxEnrollmentsPerStudent: number;
  };
  features: {
    courseCreationEnabled: boolean;
    mentorApplicationEnabled: boolean;
    paymentEnabled: boolean;
    certificateEnabled: boolean;
    reviewsEnabled: boolean;
    commentsEnabled: boolean;
    wishlistEnabled: boolean;
    recommendationsEnabled: boolean;
    analyticsEnabled: boolean;
    emailNotificationsEnabled: boolean;
    maintenanceMode: boolean;
  };
  moderation: {
    autoModeration: boolean;
    requireCourseApproval: boolean;
    requireMentorApproval: boolean;
    profanityFilter: boolean;
    spamDetection: boolean;
  };
  email: {
    fromName: string;
    fromEmail: string;
    replyToEmail: string;
    welcomeEmailEnabled: boolean;
    enrollmentEmailEnabled: boolean;
    certificateEmailEnabled: boolean;
  };
  seo: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    socialImage: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    passwordMinLength: number;
    requireEmailVerification: boolean;
    maxLoginAttempts: number;
    loginLockoutDuration: number;
  };
  updatedAt: Date;
  updatedBy: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  commission: {
    platformFeePercentage: 10,
    mentorRevenuePercentage: 90,
    paymentGatewayFee: 2500,
    minimumPayout: 100000,
  },
  limits: {
    maxCoursePrice: 10000000,
    maxFileUploadSize: 50,
    maxVideoUploadSize: 500,
    maxImageUploadSize: 10,
    maxCoursesPerMentor: 50,
    maxStudentsPerCourse: 10000,
    maxEnrollmentsPerStudent: 100,
  },
  features: {
    courseCreationEnabled: true,
    mentorApplicationEnabled: true,
    paymentEnabled: true,
    certificateEnabled: true,
    reviewsEnabled: true,
    commentsEnabled: true,
    wishlistEnabled: true,
    recommendationsEnabled: true,
    analyticsEnabled: true,
    emailNotificationsEnabled: true,
    maintenanceMode: false,
  },
  moderation: {
    autoModeration: true,
    requireCourseApproval: false,
    requireMentorApproval: true,
    profanityFilter: true,
    spamDetection: true,
  },
  email: {
    fromName: "LMS Platform",
    fromEmail: "noreply@lms-platform.com",
    replyToEmail: "support@lms-platform.com",
    welcomeEmailEnabled: true,
    enrollmentEmailEnabled: true,
    certificateEmailEnabled: true,
  },
  seo: {
    siteName: "LMS Platform",
    siteDescription: "Learn from the best instructors",
    siteUrl: "https://lms-platform.com",
    socialImage: "https://lms-platform.com/og-image.png",
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 60,
    passwordMinLength: 8,
    requireEmailVerification: true,
    maxLoginAttempts: 5,
    loginLockoutDuration: 15,
  },
  updatedAt: new Date(),
  updatedBy: "system",
};

/**
 * GET /api/admin/settings
 * Get platform settings
 */
async function getHandler(request: NextRequest, context: AuthContext) {
  try {
    const { user } = context;

    const settingsRecord = await prisma.platformSettings.findFirst({
      orderBy: { updated_at: "desc" },
    });

    let settings: PlatformSettings;

    if (!settingsRecord) {
      settings = DEFAULT_SETTINGS;
      // Create default settings if not exists
      await prisma.platformSettings.create({
        data: {
          settings: settings as any,
          updated_by: user.userId,
        },
      });
    } else {
      settings = {
        ...(settingsRecord.settings as Partial<PlatformSettings>),
        updatedAt: settingsRecord.updated_at,
        updatedBy: settingsRecord.updated_by,
      } as PlatformSettings;
    }

    return successResponse(settings, "Settings retrieved successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get settings",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * PUT /api/admin/settings
 * Update platform settings
 */
async function putHandler(request: NextRequest, context: AuthContext) {
  try {
    const { user } = context;

    const body = await request.json();

    const validationErrors = validateSettings(body);
    if (Object.keys(validationErrors).length > 0) {
      return validationErrorResponse(validationErrors);
    }

    const currentSettings = await getCurrentSettings();

    const updatedSettings: PlatformSettings = {
      commission: { ...currentSettings.commission, ...(body.commission || {}) },
      limits: { ...currentSettings.limits, ...(body.limits || {}) },
      features: { ...currentSettings.features, ...(body.features || {}) },
      moderation: { ...currentSettings.moderation, ...(body.moderation || {}) },
      email: { ...currentSettings.email, ...(body.email || {}) },
      seo: { ...currentSettings.seo, ...(body.seo || {}) },
      security: { ...currentSettings.security, ...(body.security || {}) },
      updatedAt: new Date(),
      updatedBy: user.userId,
    };

    // Save to database
    await prisma.platformSettings.create({
      data: {
        settings: updatedSettings as any,
        updated_by: user.userId,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        user_id: user.userId,
        action: "update_settings",
        entity_type: "platform_setting",
        entity_id: "global",
        metadata: { changes: body },
      },
    });

    return successResponse(updatedSettings, "Settings updated successfully");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to update settings",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * POST /api/admin/settings/reset
 * Reset settings to default
 */
async function resetHandler(request: NextRequest, context: AuthContext) {
  try {
    const { user } = context;

    const settings = {
      ...DEFAULT_SETTINGS,
      updatedAt: new Date(),
      updatedBy: user.userId,
    };

    await prisma.platformSettings.create({
      data: {
        settings: settings as any,
        updated_by: user.userId,
      },
    });

    await prisma.activityLog.create({
      data: {
        user_id: user.userId,
        action: "reset_settings",
        entity_type: "platform_setting",
        entity_id: "global",
        metadata: {},
      },
    });

    return successResponse(settings, "Settings reset to default");
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to reset settings",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * GET /api/admin/settings/history
 * Get settings history
 */
async function historyHandler(request: NextRequest, context: AuthContext) {
  try {
    const { user } = context;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.platformSettings.findMany({
        select: {
          id: true,
          updated_at: true,
          updated_by: true,
          created_at: true,
        },
        orderBy: { updated_at: "desc" },
        take: limit,
        skip,
      }),
      prisma.platformSettings.count(),
    ]);

    const userIds = [...new Set(history.map((h: any) => h.updated_by))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, full_name: true, email: true },
    });

    const userMap = new Map(users.map((u: any) => [u.id, u]));

    const enrichedHistory = history.map((h: any) => ({
      ...h,
      updatedByUser: userMap.get(h.updated_by),
    }));

    return successResponse(
      {
        history: enrichedHistory,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Settings history retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get settings history",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Helper functions
async function getCurrentSettings(): Promise<PlatformSettings> {
  const settingsRecord = await prisma.platformSettings.findFirst({
    orderBy: { updated_at: "desc" },
  });

  if (!settingsRecord) {
    return DEFAULT_SETTINGS;
  }

  return {
    ...(settingsRecord.settings as Partial<PlatformSettings>),
    updatedAt: settingsRecord.updated_at,
    updatedBy: settingsRecord.updated_by,
  } as PlatformSettings;
}

function validateSettings(
  settings: Record<string, unknown>
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  if (settings.commission && typeof settings.commission === "object") {
    const commission = settings.commission as Record<string, unknown>;
    if (
      typeof commission.platformFeePercentage === "number" &&
      (commission.platformFeePercentage < 0 ||
        commission.platformFeePercentage > 100)
    ) {
      errors["commission.platformFeePercentage"] = [
        "Must be between 0 and 100",
      ];
    }

    if (
      typeof commission.mentorRevenuePercentage === "number" &&
      (commission.mentorRevenuePercentage < 0 ||
        commission.mentorRevenuePercentage > 100)
    ) {
      errors["commission.mentorRevenuePercentage"] = [
        "Must be between 0 and 100",
      ];
    }
  }

  if (settings.limits && typeof settings.limits === "object") {
    const limits = settings.limits as Record<string, unknown>;
    if (
      typeof limits.maxCoursePrice === "number" &&
      limits.maxCoursePrice < 0
    ) {
      errors["limits.maxCoursePrice"] = ["Must be positive"];
    }

    if (
      typeof limits.maxFileUploadSize === "number" &&
      limits.maxFileUploadSize < 1
    ) {
      errors["limits.maxFileUploadSize"] = ["Must be at least 1 MB"];
    }
  }

  if (settings.security && typeof settings.security === "object") {
    const security = settings.security as Record<string, unknown>;
    if (
      typeof security.passwordMinLength === "number" &&
      security.passwordMinLength < 6
    ) {
      errors["security.passwordMinLength"] = ["Must be at least 6 characters"];
    }

    if (
      typeof security.maxLoginAttempts === "number" &&
      security.maxLoginAttempts < 1
    ) {
      errors["security.maxLoginAttempts"] = ["Must be at least 1"];
    }
  }

  return errors;
}

// Apply middlewares
const authenticatedGetHandler = requireAdmin(getHandler);
const authenticatedPutHandler = requireAdmin(putHandler);
const authenticatedResetHandler = requireAdmin(resetHandler);
const authenticatedHistoryHandler = requireAdmin(historyHandler);

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedGetHandler))
);
export const PUT = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedPutHandler))
);

// Route untuk reset (harus dipisah ke file terpisah: src/app/api/admin/settings/reset/route.ts)
export async function POST_RESET(request: NextRequest) {
  const handler = errorHandler(
    loggingMiddleware(corsMiddleware(authenticatedResetHandler))
  );
  return handler(request);
}

// Route untuk history (harus dipisah ke file terpisah: src/app/api/admin/settings/history/route.ts)
export async function GET_HISTORY(request: NextRequest) {
  const handler = errorHandler(
    loggingMiddleware(corsMiddleware(authenticatedHistoryHandler))
  );
  return handler(request);
}
