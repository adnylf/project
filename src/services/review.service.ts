// src/services/review.service.ts
import prisma from "@/lib/prisma";
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  AppError,
} from "@/utils/error.util";
import { HTTP_STATUS } from "@/lib/constants";

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
 * Review Response Interface
 */
interface ReviewResponse {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment?: string | null;
  isAnonymous: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name: string;
    profilePicture?: string | null;
  };
}

/**
 * Review Pagination Response
 */
interface ReviewPaginationResponse {
  data: ReviewResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    averageRating: number;
  };
}

/**
 * Rating Distribution
 */
interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

/**
 * Review from Prisma with User
 */
interface ReviewWithUser {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string | null;
  isAnonymous: boolean;
  helpfulCount: number;
  created_at: Date;
  updated_at: Date;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
}

/**
 * Review from Prisma (basic)
 */
interface ReviewBasic {
  rating: number;
}

/**
 * Review Service
 * Handles course reviews and ratings
 */
export class ReviewService {
  /**
   * Create review
   */
  async createReview(
    userId: string,
    data: CreateReviewData
  ): Promise<ReviewResponse> {
    const { courseId, rating, comment, isAnonymous = false } = data;

    console.log("📝 Creating review for course:", courseId, "by user:", userId);

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      console.log("❌ Course not found:", courseId);
      throw new NotFoundError("Course not found");
    }

    // Check if user is enrolled and has completed the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      console.log("❌ User not enrolled in course:", { userId, courseId });
      throw new ForbiddenError("You must be enrolled to review this course");
    }

    if (enrollment.status !== "COMPLETED") {
      console.log("❌ Course not completed:", { userId, courseId });
      throw new ForbiddenError("You must complete the course before reviewing");
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
      console.log("❌ User already reviewed this course:", {
        userId,
        courseId,
      });
      throw new ConflictError("You have already reviewed this course");
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new AppError(
        "Rating must be between 1 and 5",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create review
    console.log("💾 Creating review in database...");
    const review = await prisma.review.create({
      data: {
        userId,
        courseId,
        rating,
        comment: comment || null,
        isAnonymous,
        helpfulCount: 0,
      },
      include: {
        user: {
          select: {
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    // Update course rating
    console.log("📊 Updating course rating...");
    await this.updateCourseRating(courseId);

    console.log("✅ Review created successfully:", review.id);

    return {
      id: review.id,
      userId: review.userId,
      courseId: review.courseId,
      rating: review.rating,
      comment: review.comment,
      isAnonymous: review.isAnonymous,
      helpfulCount: review.helpfulCount,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      user: {
        name: review.user.full_name,
        profilePicture: review.user.avatar_url,
      },
    };
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
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<ReviewPaginationResponse> {
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options;
    const skip = (page - 1) * limit;

    console.log(
      "🔍 Getting reviews for course:",
      courseId,
      "with options:",
      options
    );

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    const [reviews, total, averageRating] = await Promise.all([
      prisma.review.findMany({
        where: { courseId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              full_name: true,
              avatar_url: true,
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
    const sanitizedReviews: ReviewResponse[] = reviews.map(
      (review: ReviewWithUser) => ({
        id: review.id,
        userId: review.userId,
        courseId: review.courseId,
        rating: review.rating,
        comment: review.comment,
        isAnonymous: review.isAnonymous,
        helpfulCount: review.helpfulCount,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        user: review.isAnonymous
          ? { name: "Anonymous", profilePicture: null }
          : {
              name: review.user.full_name,
              profilePicture: review.user.avatar_url,
            },
      })
    );

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
  async getReviewById(reviewId: string): Promise<ReviewResponse> {
    console.log("🔍 Getting review by ID:", reviewId);

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
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
            slug: true,
          },
        },
      },
    });

    if (!review) {
      console.log("❌ Review not found:", reviewId);
      throw new NotFoundError("Review not found");
    }

    // Cast to ReviewWithUser type
    const reviewWithUser = review as ReviewWithUser;

    // Hide user info if anonymous
    const userInfo = reviewWithUser.isAnonymous
      ? { name: "Anonymous", profilePicture: null }
      : {
          name: reviewWithUser.user.full_name,
          profilePicture: reviewWithUser.user.avatar_url,
        };

    return {
      id: reviewWithUser.id,
      userId: reviewWithUser.userId,
      courseId: reviewWithUser.courseId,
      rating: reviewWithUser.rating,
      comment: reviewWithUser.comment,
      isAnonymous: reviewWithUser.isAnonymous,
      helpfulCount: reviewWithUser.helpfulCount,
      createdAt: reviewWithUser.created_at,
      updatedAt: reviewWithUser.updated_at,
      user: userInfo,
    };
  }

  /**
   * Update review
   */
  async updateReview(
    reviewId: string,
    userId: string,
    data: UpdateReviewData
  ): Promise<ReviewResponse> {
    console.log("📝 Updating review:", reviewId, "by user:", userId);

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      console.log("❌ Review not found:", reviewId);
      throw new NotFoundError("Review not found");
    }

    // Check ownership
    if (review.userId !== userId) {
      console.log("❌ User not authorized to update review:", {
        userId,
        reviewOwner: review.userId,
      });
      throw new ForbiddenError("You can only update your own reviews");
    }

    // Validate rating if provided
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new AppError(
        "Rating must be between 1 and 5",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        user: {
          select: {
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    // Cast to ReviewWithUser type
    const updatedWithUser = updated as ReviewWithUser;

    // Update course rating if rating changed
    if (data.rating !== undefined) {
      console.log("📊 Updating course rating due to rating change...");
      await this.updateCourseRating(review.courseId);
    }

    console.log("✅ Review updated successfully:", reviewId);

    return {
      id: updatedWithUser.id,
      userId: updatedWithUser.userId,
      courseId: updatedWithUser.courseId,
      rating: updatedWithUser.rating,
      comment: updatedWithUser.comment,
      isAnonymous: updatedWithUser.isAnonymous,
      helpfulCount: updatedWithUser.helpfulCount,
      createdAt: updatedWithUser.created_at,
      updatedAt: updatedWithUser.updated_at,
      user: {
        name: updatedWithUser.user.full_name,
        profilePicture: updatedWithUser.user.avatar_url,
      },
    };
  }

  /**
   * Delete review
   */
  async deleteReview(
    reviewId: string,
    userId: string,
    userRole: string
  ): Promise<{ id: string; deleted: boolean }> {
    console.log(
      "🗑️ Deleting review:",
      reviewId,
      "by user:",
      userId,
      "with role:",
      userRole
    );

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      console.log("❌ Review not found:", reviewId);
      throw new NotFoundError("Review not found");
    }

    // Check permission (owner or admin)
    if (review.userId !== userId && userRole !== "ADMIN") {
      console.log("❌ User not authorized to delete review:", {
        userId,
        reviewOwner: review.userId,
        userRole,
      });
      throw new ForbiddenError("You can only delete your own reviews");
    }

    const courseId = review.courseId;

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Update course rating
    console.log("📊 Updating course rating after deletion...");
    await this.updateCourseRating(courseId);

    console.log("✅ Review deleted successfully:", reviewId);

    return { id: reviewId, deleted: true };
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId: string): Promise<ReviewResponse> {
    console.log("👍 Marking review as helpful:", reviewId);

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      console.log("❌ Review not found:", reviewId);
      throw new NotFoundError("Review not found");
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: { increment: 1 },
        updated_at: new Date(),
      },
      include: {
        user: {
          select: {
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    // Cast to ReviewWithUser type
    const updatedWithUser = updated as ReviewWithUser;

    console.log(
      "✅ Review marked as helpful:",
      reviewId,
      "new count:",
      updatedWithUser.helpfulCount
    );

    return {
      id: updatedWithUser.id,
      userId: updatedWithUser.userId,
      courseId: updatedWithUser.courseId,
      rating: updatedWithUser.rating,
      comment: updatedWithUser.comment,
      isAnonymous: updatedWithUser.isAnonymous,
      helpfulCount: updatedWithUser.helpfulCount,
      createdAt: updatedWithUser.created_at,
      updatedAt: updatedWithUser.updated_at,
      user: {
        name: updatedWithUser.user.full_name,
        profilePicture: updatedWithUser.user.avatar_url,
      },
    };
  }

  /**
   * Report review
   */
  async reportReview(
    reviewId: string,
    userId: string,
    reason: string
  ): Promise<{ reviewId: string; reported: boolean; message: string }> {
    console.log(
      "🚨 Reporting review:",
      reviewId,
      "by user:",
      userId,
      "reason:",
      reason
    );

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      console.log("❌ Review not found:", reviewId);
      throw new NotFoundError("Review not found");
    }

    // Create report record
    await prisma.report.create({
      data: {
        reporterId: userId,
        reviewId: reviewId,
        reason: reason,
        status: "PENDING",
      },
    });

    console.log("✅ Review reported successfully:", reviewId);

    return {
      reviewId,
      reported: true,
      message: "Review has been reported and will be reviewed by moderators",
    };
  }

  /**
   * Update course rating
   */
  private async updateCourseRating(courseId: string): Promise<void> {
    try {
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
          average_rating: avgRating._avg.rating || 0,
          total_reviews: totalReviews,
        },
      });

      console.log("✅ Course rating updated:", {
        courseId,
        averageRating: avgRating._avg.rating,
        totalReviews,
      });
    } catch (error) {
      console.error("❌ Failed to update course rating:", error);
      throw new AppError(
        "Failed to update course rating",
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get rating distribution
   */
  async getRatingDistribution(courseId: string): Promise<RatingDistribution> {
    console.log("📊 Getting rating distribution for course:", courseId);

    const reviews = await prisma.review.findMany({
      where: { courseId },
      select: { rating: true },
    });

    const distribution: RatingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((review: ReviewBasic) => {
      const ratingKey = review.rating as keyof RatingDistribution;
      if (distribution.hasOwnProperty(ratingKey)) {
        distribution[ratingKey]++;
      }
    });

    console.log("✅ Rating distribution retrieved:", distribution);

    return distribution;
  }

  /**
   * Get user's review for a course
   */
  async getUserCourseReview(
    userId: string,
    courseId: string
  ): Promise<ReviewResponse | null> {
    console.log("🔍 Getting user review for course:", { userId, courseId });

    const review = await prisma.review.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        user: {
          select: {
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!review) {
      return null;
    }

    // Cast to ReviewWithUser type
    const reviewWithUser = review as ReviewWithUser;

    return {
      id: reviewWithUser.id,
      userId: reviewWithUser.userId,
      courseId: reviewWithUser.courseId,
      rating: reviewWithUser.rating,
      comment: reviewWithUser.comment,
      isAnonymous: reviewWithUser.isAnonymous,
      helpfulCount: reviewWithUser.helpfulCount,
      createdAt: reviewWithUser.created_at,
      updatedAt: reviewWithUser.updated_at,
      user: {
        name: reviewWithUser.user.full_name,
        profilePicture: reviewWithUser.user.avatar_url,
      },
    };
  }

  /**
   * Get recent reviews with pagination
   */
  async getRecentReviews(
    options: {
      page?: number;
      limit?: number;
      courseId?: string;
    } = {}
  ): Promise<ReviewPaginationResponse> {
    const { page = 1, limit = 10, courseId } = options;
    const skip = (page - 1) * limit;

    const where = courseId ? { courseId } : {};

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
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
              slug: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    const sanitizedReviews: ReviewResponse[] = reviews.map(
      (review: ReviewWithUser) => ({
        id: review.id,
        userId: review.userId,
        courseId: review.courseId,
        rating: review.rating,
        comment: review.comment,
        isAnonymous: review.isAnonymous,
        helpfulCount: review.helpfulCount,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        user: review.isAnonymous
          ? { name: "Anonymous", profilePicture: null }
          : {
              name: review.user.full_name,
              profilePicture: review.user.avatar_url,
            },
      })
    );

    // Calculate average rating for the filtered set
    const averageResult = await prisma.review.aggregate({
      where,
      _avg: { rating: true },
    });

    return {
      data: sanitizedReviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        averageRating: averageResult._avg.rating || 0,
      },
    };
  }
}

const reviewService = new ReviewService();
export default reviewService;
