// services/recommendation.service.ts
import prisma from "@/lib/prisma";
import type {
  CourseLevel,
  DisabilityType,
  Course,
  Enrollment,
  Review,
  Wishlist,
} from "@prisma/client";

/**
 * Recommendation Types
 */
export interface RecommendedCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  shortDescription?: string;
  level: CourseLevel;
  price: number;
  discountPrice?: number;
  isFree: boolean;
  averageRating: number;
  totalStudents: number;
  score: number;
  reason: string;
  category: {
    name: string;
    slug: string;
  };
  mentor: {
    name: string;
    profilePicture?: string;
  };
}

/**
 * User Profile for Recommendations
 */
interface UserProfile {
  enrolledCourseIds: string[];
  categoryPreferences: Map<string, number>;
  levelPreferences: Map<string, number>;
  tagPreferences: Map<string, number>;
  disabilityType?: DisabilityType | null;
  reviewedCourseIds: string[];
}

/**
 * Course with relations for scoring
 */
interface ScoredCourse extends Course {
  category: {
    name: string;
    slug: string;
  };
  mentor: {
    user: {
      full_name: string | null;
      avatar_url: string | null;
    };
    total_students: number;
  };
  _count: {
    enrollments: number;
    reviews: number;
  };
}

/**
 * Recommendation Service
 * Provides personalized course recommendations
 */
export class RecommendationService {
  private cache = new Map<
    string,
    { data: RecommendedCourse[]; timestamp: number }
  >();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

  /**
   * Get personalized recommendations for user
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendedCourse[]> {
    try {
      console.log("🎯 Getting personalized recommendations for user:", userId);

      // Check memory cache first
      const cacheKey = `recommendations:user:${userId}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log("📦 Returning cached recommendations");
        return cached.data.slice(0, limit);
      }

      // Get user's learning history
      const userProfile = await this.getUserProfile(userId);

      // Calculate recommendations based on multiple factors
      const recommendations = await this.calculateRecommendations(
        userProfile,
        limit
      );

      // Cache results in memory
      this.cache.set(cacheKey, {
        data: recommendations,
        timestamp: Date.now(),
      });

      // Clean up expired cache entries periodically
      this.cleanupExpiredCache();

      console.log(
        "✅ Generated personalized recommendations:",
        recommendations.length
      );
      return recommendations;
    } catch (error) {
      console.error("❌ Error getting personalized recommendations:", error);
      // Fallback to trending courses
      return this.getTrendingCourses(limit);
    }
  }

  /**
   * Get user profile for recommendations
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    console.log("👤 Building user profile for recommendations");

    const [enrollments, reviews, wishlists, user] = await Promise.all([
      // User's enrolled courses
      prisma.enrollment.findMany({
        where: { user_id: userId },
        include: {
          course: {
            select: {
              id: true,
              category_id: true,
              level: true,
              tags: true,
            },
          },
        },
      }),

      // User's reviews
      prisma.review.findMany({
        where: { user_id: userId },
        select: {
          course_id: true,
          rating: true,
        },
      }),

      // User's wishlist
      prisma.wishlist.findMany({
        where: { user_id: userId },
        include: {
          course: {
            select: {
              category_id: true,
              level: true,
              tags: true,
            },
          },
        },
      }),

      // User data for disability type
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          disability_type: true,
        },
      }),
    ]);

    // Extract preferences
    const categoryPreferences = new Map<string, number>();
    const levelPreferences = new Map<string, number>();
    const tagPreferences = new Map<string, number>();

    // From enrollments
    enrollments.forEach(
      (
        enrollment: Enrollment & {
          course: {
            id: string;
            category_id: string;
            level: CourseLevel;
            tags: string[];
          };
        }
      ) => {
        const { course } = enrollment;
        categoryPreferences.set(
          course.category_id,
          (categoryPreferences.get(course.category_id) || 0) + 3
        );
        levelPreferences.set(
          course.level,
          (levelPreferences.get(course.level) || 0) + 3
        );
        course.tags.forEach((tag: string) => {
          tagPreferences.set(tag, (tagPreferences.get(tag) || 0) + 2);
        });
      }
    );

    // From wishlists
    wishlists.forEach(
      (
        wishlist: Wishlist & {
          course: {
            id: string;
            category_id: string;
            level: CourseLevel;
            tags: string[];
          };
        }
      ) => {
        const { course } = wishlist;
        categoryPreferences.set(
          course.category_id,
          (categoryPreferences.get(course.category_id) || 0) + 2
        );
        levelPreferences.set(
          course.level,
          (levelPreferences.get(course.level) || 0) + 2
        );
        course.tags.forEach((tag: string) => {
          tagPreferences.set(tag, (tagPreferences.get(tag) || 0) + 1);
        });
      }
    );

    const profile: UserProfile = {
      enrolledCourseIds: enrollments.map((e: Enrollment) => e.course_id),
      categoryPreferences,
      levelPreferences,
      tagPreferences,
      disabilityType: user?.disability_type,
      reviewedCourseIds: reviews.map((r: Review) => r.course_id),
    };

    console.log("📊 User profile built:", {
      enrolledCourses: profile.enrolledCourseIds.length,
      categories: Array.from(categoryPreferences.keys()),
      disabilityType: profile.disabilityType,
    });

    return profile;
  }

  /**
   * Calculate recommendations based on user profile
   */
  private async calculateRecommendations(
    profile: UserProfile,
    limit: number
  ): Promise<RecommendedCourse[]> {
    console.log("🧮 Calculating recommendations...");

    // Get candidate courses (not enrolled and not reviewed)
    const candidates = await prisma.course.findMany({
      where: {
        status: "PUBLISHED",
        id: {
          notIn: [...profile.enrolledCourseIds, ...profile.reviewedCourseIds],
        },
      },
      take: 100,
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        mentor: {
          include: {
            user: {
              select: {
                full_name: true,
                avatar_url: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    console.log(`📚 Found ${candidates.length} candidate courses`);

    // Score each course
    const scoredCourses = candidates.map((course: any) => {
      let score = 0;
      let reason = "Recommended for you";

      // Category match
      const categoryScore =
        profile.categoryPreferences.get(course.category_id) || 0;
      score += categoryScore * 5;
      if (categoryScore > 0) {
        reason = `Based on your interest in ${course.category.name}`;
      }

      // Level match
      const levelScore = profile.levelPreferences.get(course.level) || 0;
      score += levelScore * 3;

      // Tag match
      let tagMatches = 0;
      course.tags.forEach((tag: string) => {
        const tagScore = profile.tagPreferences.get(tag) || 0;
        score += tagScore * 2;
        if (tagScore > 0) tagMatches++;
      });

      if (tagMatches > 0) {
        reason = `Matches your interests`;
      }

      // Disability-specific recommendations
      if (profile.disabilityType) {
        const isSuitable = this.isCourseSuitableForDisability(
          course,
          profile.disabilityType
        );
        if (isSuitable) {
          score += 15;
          reason = `Optimized for ${this.getDisabilityDisplayName(
            profile.disabilityType
          )}`;
        }
      }

      // Popularity boost
      score += course.average_rating * 2;
      score += Math.log10(course.total_students + 1) * 3;

      // Quality indicators
      if (course.average_rating >= 4.5) {
        score += 5;
        if (!reason.includes("Based on")) {
          reason = "Highly rated course";
        }
      }

      if (course.total_students >= 1000) {
        score += 3;
      }

      // Mentor reputation boost
      if (course.mentor.total_students >= 500) {
        score += 2;
      }

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        shortDescription: course.short_description,
        level: course.level,
        price: course.price,
        discountPrice: course.discount_price,
        isFree: course.is_free,
        averageRating: course.average_rating,
        totalStudents: course.total_students,
        category: course.category,
        mentor: {
          name: course.mentor.user.full_name || "Unknown",
          profilePicture: course.mentor.user.avatar_url,
        },
        score,
        reason,
      };
    });

    // Sort by score and return top N
    const recommendations = scoredCourses
      .sort((a: RecommendedCourse, b: RecommendedCourse) => b.score - a.score)
      .slice(0, limit);

    console.log("🎯 Top recommendations calculated:", recommendations.length);
    return recommendations;
  }

  /**
   * Check if course is suitable for specific disability type
   */
  private isCourseSuitableForDisability(
    course: Course & { tags: string[] },
    disabilityType: DisabilityType
  ): boolean {
    // Implementation would depend on course metadata about accessibility
    // For now, we'll use a simple tag-based approach
    const accessibilityTags = course.tags.filter(
      (tag: string) =>
        tag.toLowerCase().includes("accessible") ||
        tag.toLowerCase().includes(disabilityType.toLowerCase())
    );

    return accessibilityTags.length > 0;
  }

  /**
   * Get display name for disability type
   */
  private getDisabilityDisplayName(disabilityType: DisabilityType): string {
    const displayNames: Record<DisabilityType, string> = {
      BUTA_WARNA: "color blindness",
      DISLEKSIA: "dyslexia",
      KOGNITIF: "cognitive needs",
      LOW_VISION: "low vision",
      MENTOR: "mentors",
      MOTORIK: "motor skills",
      TUNARUNGU: "hearing impairment",
    };

    return displayNames[disabilityType] || disabilityType.toLowerCase();
  }

  /**
   * Get similar courses based on course ID
   */
  async getSimilarCourses(
    courseId: string,
    limit: number = 6
  ): Promise<RecommendedCourse[]> {
    try {
      console.log("🔍 Finding similar courses for:", courseId);

      // Get the reference course
      const referenceCourse = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          category: true,
          mentor: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!referenceCourse) {
        console.log("❌ Reference course not found");
        return [];
      }

      // Find similar courses
      const similar = await prisma.course.findMany({
        where: {
          status: "PUBLISHED",
          id: { not: courseId },
          OR: [
            { category_id: referenceCourse.category_id },
            { level: referenceCourse.level },
            { mentor_id: referenceCourse.mentor_id },
            {
              tags: {
                hasSome: referenceCourse.tags,
              },
            },
          ],
        },
        take: limit * 2,
        include: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          mentor: {
            include: {
              user: {
                select: {
                  full_name: true,
                  avatar_url: true,
                },
              },
            },
          },
        },
      });

      console.log(`📚 Found ${similar.length} similar courses`);

      // Score similarity
      const scoredCourses = similar.map((course: any) => {
        let score = 0;
        let reason = "Similar course";

        // Same category
        if (course.category_id === referenceCourse.category_id) {
          score += 10;
          reason = `Same category: ${course.category.name}`;
        }

        // Same level
        if (course.level === referenceCourse.level) {
          score += 5;
        }

        // Same mentor
        if (course.mentor_id === referenceCourse.mentor_id) {
          score += 8;
          reason = "From the same instructor";
        }

        // Tag overlap
        const commonTags = course.tags.filter((tag: string) =>
          referenceCourse.tags.includes(tag)
        );
        score += commonTags.length * 3;

        if (commonTags.length > 2) {
          reason = "Similar topics covered";
        }

        // Quality boost
        score += course.average_rating * 2;
        score += Math.log10(course.total_students + 1);

        return {
          id: course.id,
          title: course.title,
          slug: course.slug,
          thumbnail: course.thumbnail,
          shortDescription: course.short_description,
          level: course.level,
          price: course.price,
          discountPrice: course.discount_price,
          isFree: course.is_free,
          averageRating: course.average_rating,
          totalStudents: course.total_students,
          category: course.category,
          mentor: {
            name: course.mentor.user.full_name || "Unknown",
            profilePicture: course.mentor.user.avatar_url,
          },
          score,
          reason,
        };
      });

      const recommendations = scoredCourses
        .sort((a: RecommendedCourse, b: RecommendedCourse) => b.score - a.score)
        .slice(0, limit);
      console.log("✅ Similar courses found:", recommendations.length);
      return recommendations;
    } catch (error) {
      console.error("❌ Error getting similar courses:", error);
      return [];
    }
  }

  /**
   * Get trending courses
   */
  async getTrendingCourses(limit: number = 10): Promise<RecommendedCourse[]> {
    try {
      console.log("🔥 Getting trending courses");

      const courses = await prisma.course.findMany({
        where: {
          status: "PUBLISHED",
        },
        orderBy: [
          { total_students: "desc" },
          { average_rating: "desc" },
          { created_at: "desc" },
        ],
        take: limit,
        include: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          mentor: {
            include: {
              user: {
                select: {
                  full_name: true,
                  avatar_url: true,
                },
              },
            },
          },
        },
      });

      const trendingCourses = courses.map((course: any) => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        shortDescription: course.short_description,
        level: course.level,
        price: course.price,
        discountPrice: course.discount_price,
        isFree: course.is_free,
        averageRating: course.average_rating,
        totalStudents: course.total_students,
        category: course.category,
        mentor: {
          name: course.mentor.user.full_name || "Unknown",
          profilePicture: course.mentor.user.avatar_url,
        },
        score: course.total_students,
        reason: "Trending now",
      }));

      console.log("✅ Trending courses retrieved:", trendingCourses.length);
      return trendingCourses;
    } catch (error) {
      console.error("❌ Error getting trending courses:", error);
      return [];
    }
  }

  /**
   * Get courses you might like based on category
   */
  async getCoursesInCategory(
    categoryId: string,
    excludeCourseIds: string[] = [],
    limit: number = 6
  ): Promise<RecommendedCourse[]> {
    try {
      console.log("📂 Getting courses in category:", categoryId);

      const courses = await prisma.course.findMany({
        where: {
          status: "PUBLISHED",
          category_id: categoryId,
          id: { notIn: excludeCourseIds },
        },
        orderBy: [{ average_rating: "desc" }, { total_students: "desc" }],
        take: limit,
        include: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          mentor: {
            include: {
              user: {
                select: {
                  full_name: true,
                  avatar_url: true,
                },
              },
            },
          },
        },
      });

      const categoryCourses = courses.map((course: any) => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        shortDescription: course.short_description,
        level: course.level,
        price: course.price,
        discountPrice: course.discount_price,
        isFree: course.is_free,
        averageRating: course.average_rating,
        totalStudents: course.total_students,
        category: course.category,
        mentor: {
          name: course.mentor.user.full_name || "Unknown",
          profilePicture: course.mentor.user.avatar_url,
        },
        score:
          course.average_rating * 10 + Math.log10(course.total_students + 1),
        reason: `Popular in ${course.category.name}`,
      }));

      console.log("✅ Category courses retrieved:", categoryCourses.length);
      return categoryCourses;
    } catch (error) {
      console.error("❌ Error getting courses in category:", error);
      return [];
    }
  }

  /**
   * Get courses from mentors you follow/like
   */
  async getCoursesFromFavoriteMentors(
    userId: string,
    limit: number = 6
  ): Promise<RecommendedCourse[]> {
    try {
      console.log("👨‍🏫 Getting courses from favorite mentors for user:", userId);

      // Get mentors from user's enrollments
      const enrollments = await prisma.enrollment.findMany({
        where: { user_id: userId },
        include: {
          course: {
            select: {
              mentor_id: true,
            },
          },
        },
      });

      const mentorIds = [
        ...new Set(enrollments.map((e: any) => e.course.mentor_id)),
      ];

      if (mentorIds.length === 0) {
        console.log("ℹ️ No favorite mentors found");
        return [];
      }

      // Get enrolled course IDs
      const enrolledCourseIds = enrollments.map((e: any) => e.course_id);

      // Get courses from these mentors
      const courses = await prisma.course.findMany({
        where: {
          status: "PUBLISHED",
          mentor_id: { in: mentorIds },
          id: { notIn: enrolledCourseIds },
        },
        take: limit,
        orderBy: [{ average_rating: "desc" }, { created_at: "desc" }],
        include: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          mentor: {
            include: {
              user: {
                select: {
                  full_name: true,
                  avatar_url: true,
                },
              },
            },
          },
        },
      });

      const mentorCourses = courses.map((course: any) => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        shortDescription: course.short_description,
        level: course.level,
        price: course.price,
        discountPrice: course.discount_price,
        isFree: course.is_free,
        averageRating: course.average_rating,
        totalStudents: course.total_students,
        category: course.category,
        mentor: {
          name: course.mentor.user.full_name || "Unknown",
          profilePicture: course.mentor.user.avatar_url,
        },
        score: course.average_rating * 10,
        reason: `From instructors you've learned with`,
      }));

      console.log(
        "✅ Favorite mentor courses retrieved:",
        mentorCourses.length
      );
      return mentorCourses;
    } catch (error) {
      console.error("❌ Error getting courses from favorite mentors:", error);
      return [];
    }
  }

  /**
   * Get recommendations for new users (based on disability type)
   */
  async getRecommendationsForNewUser(
    disabilityType?: DisabilityType,
    limit: number = 10
  ): Promise<RecommendedCourse[]> {
    try {
      console.log(
        "👋 Getting recommendations for new user with disability:",
        disabilityType
      );

      let whereClause: any = { status: "PUBLISHED" };

      // If disability type is provided, prioritize accessible courses
      if (disabilityType) {
        // This would need to be enhanced based on how accessibility is stored in your database
        whereClause = {
          ...whereClause,
          OR: [
            { tags: { has: "accessible" } },
            { tags: { has: disabilityType.toLowerCase() } },
          ],
        };
      }

      const courses = await prisma.course.findMany({
        where: whereClause,
        orderBy: [{ total_students: "desc" }, { average_rating: "desc" }],
        take: limit,
        include: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          mentor: {
            include: {
              user: {
                select: {
                  full_name: true,
                  avatar_url: true,
                },
              },
            },
          },
        },
      });

      const newUserCourses = courses.map((course: any) => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        shortDescription: course.short_description,
        level: course.level,
        price: course.price,
        discountPrice: course.discount_price,
        isFree: course.is_free,
        averageRating: course.average_rating,
        totalStudents: course.total_students,
        category: course.category,
        mentor: {
          name: course.mentor.user.full_name || "Unknown",
          profilePicture: course.mentor.user.avatar_url,
        },
        score: course.total_students + course.average_rating * 100,
        reason: disabilityType
          ? `Great for ${this.getDisabilityDisplayName(disabilityType)}`
          : "Popular choice for beginners",
      }));

      console.log(
        "✅ New user recommendations generated:",
        newUserCourses.length
      );
      return newUserCourses;
    } catch (error) {
      console.error("❌ Error getting new user recommendations:", error);
      return this.getTrendingCourses(limit);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear user recommendations cache
   */
  async clearUserCache(userId: string): Promise<void> {
    try {
      const cacheKey = `recommendations:user:${userId}`;
      this.cache.delete(cacheKey);
      console.log("🗑️ Cleared cache for user:", userId);
    } catch (error) {
      console.error("❌ Error clearing cache:", error);
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get recommendations for home page (mixed approach)
   */
  async getHomePageRecommendations(userId?: string): Promise<{
    personalized: RecommendedCourse[];
    trending: RecommendedCourse[];
    newReleases: RecommendedCourse[];
  }> {
    try {
      console.log("🏠 Getting home page recommendations");

      // PERBAIKAN: Panggil getPersonalizedRecommendations dengan parameter yang benar
      const [personalized, trending, newReleases] = await Promise.all([
        userId
          ? this.getPersonalizedRecommendations(userId, 6)
          : Promise.resolve([]),
        this.getTrendingCourses(6),
        this.getNewReleases(6),
      ]);

      return {
        personalized,
        trending,
        newReleases,
      };
    } catch (error) {
      console.error("❌ Error getting home page recommendations:", error);
      return {
        personalized: [],
        trending: [],
        newReleases: [],
      };
    }
  }

  /**
   * Get new course releases
   */
  private async getNewReleases(
    limit: number = 6
  ): Promise<RecommendedCourse[]> {
    try {
      const courses = await prisma.course.findMany({
        where: {
          status: "PUBLISHED",
        },
        orderBy: { created_at: "desc" },
        take: limit,
        include: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          mentor: {
            include: {
              user: {
                select: {
                  full_name: true,
                  avatar_url: true,
                },
              },
            },
          },
        },
      });

      return courses.map((course: any) => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        shortDescription: course.short_description,
        level: course.level,
        price: course.price,
        discountPrice: course.discount_price,
        isFree: course.is_free,
        averageRating: course.average_rating,
        totalStudents: course.total_students,
        category: course.category,
        mentor: {
          name: course.mentor.user.full_name || "Unknown",
          profilePicture: course.mentor.user.avatar_url,
        },
        score: 0,
        reason: "New release",
      }));
    } catch (error) {
      console.error("❌ Error getting new releases:", error);
      return [];
    }
  }
}

const recommendationService = new RecommendationService();
export default recommendationService;
