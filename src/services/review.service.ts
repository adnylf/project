import prisma from '@/lib/prisma';
import { NotFoundError, ConflictError, ForbiddenError, AppError } from '@/utils/error.util';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * Review Creation Data
 */
interface CreateReviewData {
  courseId: string;
  rating: number;
  comment?: string;
  isAnonymous?: boolean;
}

/**
 * Review Update Data
 */
interface UpdateReviewData {
  rating?: number;
  comment?: string;
  isAnonymous?: boolean;
}

/**
 * Review Service
 * Handles course reviews and ratings
 */
export class ReviewService {
  /**
   * Create review
   */
  async createReview(userId: string, data: CreateReviewData) {
    const { courseId, rating, comment, isAnonymous } = data;

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenError('You must be enrolled to review this course');
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictError('You have already reviewed this course');
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        courseId,
        rating,
        comment,
        isAnonymous: isAnonymous || false,
      },
      include: {
        user: {
          select: {
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    // Update course rating
    await this.updateCourseRating(courseId);

    return review;
  }

  /**
   * Get course reviews
   */
  async getCourseReviews(
    courseId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const [reviews, total, averageRating] = await Promise.all([
      prisma.review.findMany({
        where: { courseId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              name: true,
              profilePicture: true,
            },
          },
        },
      }),
      prisma.review.count({ where: { courseId } }),
      prisma.review.aggregate({
        where: { courseId },
        _avg: { rating: true },
      }),
    ]);

    // Hide user info for anonymous reviews
    const sanitizedReviews = reviews.map((review) => ({
      ...review,
      user: review.isAnonymous ? { name: 'Anonymous', profilePicture: null } : review.user,
    }));

    return {
      data: sanitizedReviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        averageRating: averageRating._avg.rating || 0,
      },
    };
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
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
            slug: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Hide user info if anonymous
    if (review.isAnonymous) {
      review.user = { name: 'Anonymous', profilePicture: null };
    }

    return review;
  }

  /**
   * Update review
   */
  async updateReview(reviewId: string, userId: string, data: UpdateReviewData) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check ownership
    if (review.userId !== userId) {
      throw new ForbiddenError('You can only update your own reviews');
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data,
      include: {
        user: {
          select: {
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    // Update course rating if rating changed
    if (data.rating !== undefined) {
      await this.updateCourseRating(review.courseId);
    }

    return updated;
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId: string, userId: string, userRole: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check permission (owner or admin)
    if (review.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You can only delete your own reviews');
    }

    const courseId = review.courseId;

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Update course rating
    await this.updateCourseRating(courseId);

    return { id: reviewId, deleted: true };
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: { increment: 1 },
      },
    });

    return updated;
  }

  /**
   * Report review
   */
  async reportReview(reviewId: string, userId: string, reason: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // In production, create a report record
    // For now, just log it
    console.log('Review reported:', {
      reviewId,
      reportedBy: userId,
      reason,
    });

    return {
      reviewId,
      reported: true,
      message: 'Review has been reported and will be reviewed by moderators',
    };
  }

  /**
   * Update course rating
   */
  private async updateCourseRating(courseId: string) {
    const [avgRating, totalReviews] = await Promise.all([
      prisma.review.aggregate({
        where: { courseId },
        _avg: { rating: true },
      }),
      prisma.review.count({ where: { courseId } }),
    ]);

    await prisma.course.update({
      where: { id: courseId },
      data: {
        averageRating: avgRating._avg.rating || 0,
        totalReviews,
      },
    });
  }

  /**
   * Get rating distribution
   */
  async getRatingDistribution(courseId: string) {
    const reviews = await prisma.review.findMany({
      where: { courseId },
      select: { rating: true },
    });

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    return distribution;
  }
}

const reviewService = new ReviewService();
export default reviewService;
