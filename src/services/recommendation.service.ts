// src/services/recommendation.service.ts

import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis-upstash';
import type { CourseLevel } from '@prisma/client';

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
 * Recommendation Service
 * Provides personalized course recommendations
 */
export class RecommendationService {
  /**
   * Get personalized recommendations for user
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendedCourse[]> {
    try {
      // Check cache first
      const cacheKey = `recommendations:user:${userId}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached as string);
      }

      // Get user's learning history
      const userProfile = await this.getUserProfile(userId);

      // Calculate recommendations based on multiple factors
      const recommendations = await this.calculateRecommendations(userProfile, limit);

      // Cache results for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(recommendations));

      return recommendations;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      // Fallback to trending courses
      return this.getTrendingCourses(limit);
    }
  }

  /**
   * Get user profile for recommendations
   */
  private async getUserProfile(userId: string) {
    const [enrollments, reviews, wishlists, activityLogs] = await Promise.all([
      // User's enrolled courses
      prisma.enrollment.findMany({
        where: { userId },
        select: {
          course: {
            select: {
              id: true,
              categoryId: true,
              level: true,
              tags: true,
            },
          },
        },
      }),

      // User's reviews
      prisma.review.findMany({
        where: { userId },
        select: {
          courseId: true,
          rating: true,
        },
      }),

      // User's wishlist
      prisma.wishlist.findMany({
        where: { userId },
        select: {
          course: {
            select: {
              categoryId: true,
              level: true,
              tags: true,
            },
          },
        },
      }),

      // User's recent activity
      prisma.activityLog.findMany({
        where: {
          userId,
          action: 'course_view',
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          entityId: true,
          createdAt: true,
        },
      }),
    ]);

    // Extract preferences
    const categoryPreferences = new Map<string, number>();
    const levelPreferences = new Map<string, number>();
    const tagPreferences = new Map<string, number>();

    // From enrollments
    enrollments.forEach(({ course }) => {
      categoryPreferences.set(
        course.categoryId,
        (categoryPreferences.get(course.categoryId) || 0) + 3
      );
      levelPreferences.set(course.level, (levelPreferences.get(course.level) || 0) + 3);
      course.tags.forEach((tag: string) => {
        tagPreferences.set(tag, (tagPreferences.get(tag) || 0) + 2);
      });
    });

    // From wishlists
    wishlists.forEach(({ course }) => {
      categoryPreferences.set(
        course.categoryId,
        (categoryPreferences.get(course.categoryId) || 0) + 2
      );
      levelPreferences.set(course.level, (levelPreferences.get(course.level) || 0) + 2);
      course.tags.forEach((tag: string) => {
        tagPreferences.set(tag, (tagPreferences.get(tag) || 0) + 1);
      });
    });

    return {
      enrolledCourseIds: enrollments.map((e) => e.course.id),
      categoryPreferences,
      levelPreferences,
      tagPreferences,
      recentlyViewed: activityLogs.map((log) => log.entityId).filter(Boolean) as string[],
    };
  }

  /**
   * Calculate recommendations based on user profile
   */
  private async calculateRecommendations(
    profile: {
      enrolledCourseIds: string[];
      categoryPreferences: Map<string, number>;
      levelPreferences: Map<string, number>;
      tagPreferences: Map<string, number>;
      recentlyViewed: string[];
    },
    limit: number
  ): Promise<RecommendedCourse[]> {
    // Get candidate courses (not enrolled)
    const candidates = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        id: {
          notIn: [...profile.enrolledCourseIds],
        },
      },
      take: 100,
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        shortDescription: true,
        level: true,
        price: true,
        discountPrice: true,
        isFree: true,
        averageRating: true,
        totalStudents: true,
        categoryId: true,
        tags: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        mentor: {
          select: {
            user: {
              select: {
                name: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    // Score each course
    const scoredCourses = candidates.map((course) => {
      let score = 0;
      let reason = 'Recommended for you';

      // Category match
      const categoryScore = profile.categoryPreferences.get(course.categoryId) || 0;
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

      // Popularity boost
      score += course.averageRating * 2;
      score += Math.log10(course.totalStudents + 1) * 3;

      // Recently viewed boost
      if (profile.recentlyViewed.includes(course.id)) {
        score += 10;
        reason = 'You recently viewed this';
      }

      // Quality indicators
      if (course.averageRating >= 4.5) {
        score += 5;
        if (!reason.includes('Based on')) {
          reason = 'Highly rated course';
        }
      }

      if (course.totalStudents >= 1000) {
        score += 3;
      }

      return {
        ...course,
        mentor: {
          name: course.mentor.user.name,
          profilePicture: course.mentor.user.profilePicture,
        },
        score,
        reason,
      };
    });

    // Sort by score and return top N
    return scoredCourses.sort((a, b) => b.score - a.score).slice(0, limit) as RecommendedCourse[];
  }

  /**
   * Get similar courses based on course ID
   */
  async getSimilarCourses(courseId: string, limit: number = 6): Promise<RecommendedCourse[]> {
    try {
      // Get the reference course
      const referenceCourse = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          categoryId: true,
          level: true,
          tags: true,
          mentorId: true,
        },
      });

      if (!referenceCourse) {
        return [];
      }

      // Find similar courses
      const similar = await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          id: { not: courseId },
          OR: [
            { categoryId: referenceCourse.categoryId },
            { level: referenceCourse.level },
            { mentorId: referenceCourse.mentorId },
            {
              tags: {
                hasSome: referenceCourse.tags,
              },
            },
          ],
        },
        take: limit * 2,
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          shortDescription: true,
          level: true,
          price: true,
          discountPrice: true,
          isFree: true,
          averageRating: true,
          totalStudents: true,
          categoryId: true,
          tags: true,
          mentorId: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          mentor: {
            select: {
              user: {
                select: {
                  name: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      });

      // Score similarity
      const scoredCourses = similar.map((course) => {
        let score = 0;
        let reason = 'Similar course';

        // Same category
        if (course.categoryId === referenceCourse.categoryId) {
          score += 10;
          reason = `Same category: ${course.category.name}`;
        }

        // Same level
        if (course.level === referenceCourse.level) {
          score += 5;
        }

        // Same mentor
        if (course.mentorId === referenceCourse.mentorId) {
          score += 8;
          reason = 'From the same instructor';
        }

        // Tag overlap
        const commonTags = course.tags.filter((tag: string) => referenceCourse.tags.includes(tag));
        score += commonTags.length * 3;

        if (commonTags.length > 2) {
          reason = 'Similar topics covered';
        }

        // Quality boost
        score += course.averageRating * 2;
        score += Math.log10(course.totalStudents + 1);

        return {
          ...course,
          mentor: {
            name: course.mentor.user.name,
            profilePicture: course.mentor.user.profilePicture,
          },
          score,
          reason,
        };
      });

      return scoredCourses.sort((a, b) => b.score - a.score).slice(0, limit) as RecommendedCourse[];
    } catch (error) {
      console.error('Error getting similar courses:', error);
      return [];
    }
  }

  /**
   * Get trending courses
   */
  async getTrendingCourses(limit: number = 10): Promise<RecommendedCourse[]> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const courses = await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
        },
        orderBy: [{ totalStudents: 'desc' }, { averageRating: 'desc' }, { totalViews: 'desc' }],
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          shortDescription: true,
          level: true,
          price: true,
          discountPrice: true,
          isFree: true,
          averageRating: true,
          totalStudents: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          mentor: {
            select: {
              user: {
                select: {
                  name: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      });

      return courses.map((course) => ({
        ...course,
        mentor: {
          name: course.mentor.user.name,
          profilePicture: course.mentor.user.profilePicture,
        },
        score: course.totalStudents,
        reason: 'Trending now',
      })) as RecommendedCourse[];
    } catch (error) {
      console.error('Error getting trending courses:', error);
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
      const courses = await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          categoryId,
          id: { notIn: excludeCourseIds },
        },
        orderBy: [{ averageRating: 'desc' }, { totalStudents: 'desc' }],
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          shortDescription: true,
          level: true,
          price: true,
          discountPrice: true,
          isFree: true,
          averageRating: true,
          totalStudents: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          mentor: {
            select: {
              user: {
                select: {
                  name: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      });

      return courses.map((course) => ({
        ...course,
        mentor: {
          name: course.mentor.user.name,
          profilePicture: course.mentor.user.profilePicture,
        },
        score: course.averageRating * 10 + Math.log10(course.totalStudents + 1),
        reason: `Popular in ${course.category.name}`,
      })) as RecommendedCourse[];
    } catch (error) {
      console.error('Error getting courses in category:', error);
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
      // Get mentors from user's enrollments
      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        select: {
          course: {
            select: {
              mentorId: true,
            },
          },
        },
      });

      const mentorIds = [...new Set(enrollments.map((e) => e.course.mentorId))];

      if (mentorIds.length === 0) {
        return [];
      }

      // Get enrolled course IDs
      const enrolledCourseIds = await prisma.enrollment.findMany({
        where: { userId },
        select: { courseId: true },
      });

      const excludeIds = enrolledCourseIds.map((e) => e.courseId);

      // Get courses from these mentors
      const courses = await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          mentorId: { in: mentorIds },
          id: { notIn: excludeIds },
        },
        take: limit,
        orderBy: [{ averageRating: 'desc' }, { publishedAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          shortDescription: true,
          level: true,
          price: true,
          discountPrice: true,
          isFree: true,
          averageRating: true,
          totalStudents: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          mentor: {
            select: {
              user: {
                select: {
                  name: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      });

      return courses.map((course) => ({
        ...course,
        mentor: {
          name: course.mentor.user.name,
          profilePicture: course.mentor.user.profilePicture,
        },
        score: course.averageRating * 10,
        reason: `From instructors you've learned with`,
      })) as RecommendedCourse[];
    } catch (error) {
      console.error('Error getting courses from favorite mentors:', error);
      return [];
    }
  }

  /**
   * Get "Because you viewed" recommendations
   */
  async getBecauseYouViewed(userId: string, limit: number = 6): Promise<RecommendedCourse[]> {
    try {
      // Get recently viewed courses
      const recentViews = await prisma.activityLog.findMany({
        where: {
          userId,
          action: 'course_view',
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          entityId: true,
        },
      });

      if (recentViews.length === 0) {
        return [];
      }

      const viewedCourseIds = recentViews.map((v) => v.entityId).filter(Boolean) as string[];

      // Get details of viewed courses
      const viewedCourses = await prisma.course.findMany({
        where: { id: { in: viewedCourseIds } },
        select: {
          categoryId: true,
          tags: true,
        },
      });

      // Collect tags and categories
      const categories = [...new Set(viewedCourses.map((c) => c.categoryId))];
      const allTags = viewedCourses.flatMap((c) => c.tags);

      // Get enrolled course IDs to exclude
      const enrolledCourses = await prisma.enrollment.findMany({
        where: { userId },
        select: { courseId: true },
      });
      const excludeIds = [...enrolledCourses.map((e) => e.courseId), ...viewedCourseIds];

      // Find similar courses
      const recommendations = await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          id: { notIn: excludeIds },
          OR: [{ categoryId: { in: categories } }, { tags: { hasSome: allTags } }],
        },
        take: limit,
        orderBy: [{ averageRating: 'desc' }, { totalStudents: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          shortDescription: true,
          level: true,
          price: true,
          discountPrice: true,
          isFree: true,
          averageRating: true,
          totalStudents: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          mentor: {
            select: {
              user: {
                select: {
                  name: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      });

      return recommendations.map((course) => ({
        ...course,
        mentor: {
          name: course.mentor.user.name,
          profilePicture: course.mentor.user.profilePicture,
        },
        score: course.averageRating * 10,
        reason: 'Because you viewed similar courses',
      })) as RecommendedCourse[];
    } catch (error) {
      console.error('Error getting because you viewed:', error);
      return [];
    }
  }

  /**
   * Clear user recommendations cache
   */
  async clearUserCache(userId: string): Promise<void> {
    try {
      const cacheKey = `recommendations:user:${userId}`;
      await redis.del(cacheKey);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

const recommendationService = new RecommendationService();
export default recommendationService;
