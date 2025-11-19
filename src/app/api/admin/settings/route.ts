// ============================================
// FILE: src/app/api/admin/settings/route.ts
// Fixed version - Admin Settings & Configuration Management
// ============================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis-upstash';
import { successResponse, validationErrorResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS, USER_ROLES } from '@/lib/constants';

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

interface SettingsRecord {
  id: string;
  settings: Record<string, unknown>;
  updatedBy: string;
  updatedAt: Date;
  createdAt: Date;
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
    fromName: 'LMS Platform',
    fromEmail: 'noreply@lms-platform.com',
    replyToEmail: 'support@lms-platform.com',
    welcomeEmailEnabled: true,
    enrollmentEmailEnabled: true,
    certificateEmailEnabled: true,
  },
  seo: {
    siteName: 'LMS Platform',
    siteDescription: 'Learn from the best instructors',
    siteUrl: 'https://lms-platform.com',
    socialImage: 'https://lms-platform.com/og-image.png',
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
  updatedBy: 'system',
};

const SETTINGS_CACHE_KEY = 'platform:settings';
const SETTINGS_CACHE_TTL = 3600;

async function getHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user || user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

    const cachedSettings = await redis.get(SETTINGS_CACHE_KEY);
    if (cachedSettings) {
      return successResponse(JSON.parse(cachedSettings as string), 'Settings retrieved from cache');
    }

    // Use raw query to handle missing table
    const settingsRecords = await prisma.$queryRaw<SettingsRecord[]>`
      SELECT * FROM platform_settings 
      ORDER BY updated_at DESC 
      LIMIT 1
    `.catch(() => [] as SettingsRecord[]);

    let settings: PlatformSettings;

    if (settingsRecords.length === 0) {
      settings = DEFAULT_SETTINGS;
      await saveToDatabaseAndCache(settings, user.userId).catch(() => {
        // If table doesn't exist, just return default settings
        console.warn('platform_settings table not found, using default settings');
      });
    } else {
      const record = settingsRecords[0];
      settings = {
        ...(record.settings as Partial<PlatformSettings>),
        updatedAt: record.updatedAt,
        updatedBy: record.updatedBy,
      } as PlatformSettings;
    }

    await redis.setex(SETTINGS_CACHE_KEY, SETTINGS_CACHE_TTL, JSON.stringify(settings));

    return successResponse(settings, 'Settings retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get settings', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function putHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user || user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

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

    await saveToDatabaseAndCache(updatedSettings, user.userId);

    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'update_settings',
        entityType: 'platform_setting',
        entityId: 'global',
        metadata: { changes: body },
      },
    });

    return successResponse(updatedSettings, 'Settings updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to update settings', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function resetHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user || user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

    const settings = {
      ...DEFAULT_SETTINGS,
      updatedAt: new Date(),
      updatedBy: user.userId,
    };

    await saveToDatabaseAndCache(settings, user.userId);

    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'reset_settings',
        entityType: 'platform_setting',
        entityId: 'global',
        metadata: {},
      },
    });

    return successResponse(settings, 'Settings reset to default');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to reset settings', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function getCurrentSettings(): Promise<PlatformSettings> {
  const cachedSettings = await redis.get(SETTINGS_CACHE_KEY);
  if (cachedSettings) {
    return JSON.parse(cachedSettings as string);
  }

  const settingsRecords = await prisma.$queryRaw<SettingsRecord[]>`
    SELECT * FROM platform_settings 
    ORDER BY updated_at DESC 
    LIMIT 1
  `.catch(() => [] as SettingsRecord[]);

  if (settingsRecords.length === 0) {
    return DEFAULT_SETTINGS;
  }

  const record = settingsRecords[0];
  return {
    ...(record.settings as Partial<PlatformSettings>),
    updatedAt: record.updatedAt,
    updatedBy: record.updatedBy,
  } as PlatformSettings;
}

async function saveToDatabaseAndCache(settings: PlatformSettings, userId: string): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO platform_settings (settings, updated_by, created_at, updated_at)
    VALUES (${JSON.stringify(settings)}::jsonb, ${userId}, NOW(), NOW())
  `;

  await redis.setex(SETTINGS_CACHE_KEY, SETTINGS_CACHE_TTL, JSON.stringify(settings));
}

function validateSettings(settings: Record<string, unknown>): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  if (settings.commission && typeof settings.commission === 'object') {
    const commission = settings.commission as Record<string, unknown>;
    if (
      typeof commission.platformFeePercentage === 'number' &&
      (commission.platformFeePercentage < 0 || commission.platformFeePercentage > 100)
    ) {
      errors['commission.platformFeePercentage'] = ['Must be between 0 and 100'];
    }

    if (
      typeof commission.mentorRevenuePercentage === 'number' &&
      (commission.mentorRevenuePercentage < 0 || commission.mentorRevenuePercentage > 100)
    ) {
      errors['commission.mentorRevenuePercentage'] = ['Must be between 0 and 100'];
    }
  }

  if (settings.limits && typeof settings.limits === 'object') {
    const limits = settings.limits as Record<string, unknown>;
    if (typeof limits.maxCoursePrice === 'number' && limits.maxCoursePrice < 0) {
      errors['limits.maxCoursePrice'] = ['Must be positive'];
    }

    if (typeof limits.maxFileUploadSize === 'number' && limits.maxFileUploadSize < 1) {
      errors['limits.maxFileUploadSize'] = ['Must be at least 1 MB'];
    }
  }

  if (settings.security && typeof settings.security === 'object') {
    const security = settings.security as Record<string, unknown>;
    if (typeof security.passwordMinLength === 'number' && security.passwordMinLength < 6) {
      errors['security.passwordMinLength'] = ['Must be at least 6 characters'];
    }

    if (typeof security.maxLoginAttempts === 'number' && security.maxLoginAttempts < 1) {
      errors['security.maxLoginAttempts'] = ['Must be at least 1'];
    }
  }

  return errors;
}

async function historyHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user || user.role !== USER_ROLES.ADMIN) {
      return errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.$queryRaw<SettingsRecord[]>`
        SELECT id, updated_at, updated_by, created_at
        FROM platform_settings
        ORDER BY updated_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `.catch(() => [] as SettingsRecord[]),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM platform_settings
      `
        .then((result) => Number(result[0]?.count || 0))
        .catch(() => 0),
    ]);

    const userIds = [...new Set(history.map((h) => h.updatedBy))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedHistory = history.map((h) => ({
      ...h,
      updatedByUser: userMap.get(h.updatedBy),
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
      'Settings history retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get settings history', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function authenticatedGetHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return getHandler(request);
}

async function authenticatedPutHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return putHandler(request);
}

async function authenticatedResetHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return resetHandler(request);
}

async function authenticatedHistoryHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return historyHandler(request);
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(authenticatedGetHandler)));
export const PUT = errorHandler(loggingMiddleware(corsMiddleware(authenticatedPutHandler)));
