import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, validationErrorResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { authMiddleware, getAuthenticatedUser } from '@/middlewares/auth.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';
import type { NotificationType } from '@prisma/client';

async function reportReviewHandler(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const body = await request.json();
    const { reviewId, reason, details } = body;

    if (!reviewId || !reason) {
      return validationErrorResponse({
        reviewId: !reviewId ? ['Review ID is required'] : [],
        reason: !reason ? ['Reason is required'] : [],
      });
    }

    const validReasons = ['SPAM', 'OFFENSIVE', 'INAPPROPRIATE', 'FALSE_INFORMATION', 'OTHER'];

    if (!validReasons.includes(reason)) {
      return errorResponse('Invalid reason', HTTP_STATUS.BAD_REQUEST);
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        courseId: true,
        rating: true,
        comment: true,
      },
    });

    if (!review) {
      return errorResponse('Review not found', HTTP_STATUS.NOT_FOUND);
    }

    // For this implementation, we'll log the report in activity logs
    // since CommentReport model may not exist in the schema
    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'report_review',
        entityType: 'REVIEW',
        entityId: reviewId,
        metadata: {
          reason,
          details: details || null,
          reportedReview: {
            id: review.id,
            rating: review.rating,
          },
        },
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    const notificationType: NotificationType = 'SYSTEM';

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: notificationType,
        title: 'Review Reported',
        message: `A review has been reported for: ${reason}`,
        data: { reviewId, reason },
        status: 'UNREAD',
      })),
    });

    return successResponse(
      {
        status: 'PENDING',
        message: 'Report submitted successfully',
      },
      'Review reported successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to report review', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function authenticatedReportHandler(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;
  return reportReviewHandler(request);
}

export const POST = errorHandler(loggingMiddleware(corsMiddleware(authenticatedReportHandler)));
