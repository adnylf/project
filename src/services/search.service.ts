// services/search.service.ts
import prisma from "@/lib/prisma";
import type {
  CourseLevel,
  CourseStatus,
  UserStatus,
  UserRole,
  Course,
  MentorProfile,
  Category,
  User,
} from "@prisma/client";

/**
 * Search Result Types
 */
export interface CourseSearchResult {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string | null;
  shortDescription?: string | null;
  level: CourseLevel;
  price: number;
  discountPrice?: number | null;
  isFree: boolean;
  averageRating: number;
  totalStudents: number;
  totalReviews: number;
  mentor: {
    name: string;
    profilePicture?: string | null;
  };
  category: {
    name: string;
    slug: string;
  };
}

export interface MentorSearchResult {
  id: string;
  name: string;
  email: string;
  profilePicture?: string | null;
  headline?: string | null;
  expertise: string[];
  experience: number;
  averageRating: number;
  totalStudents: number;
  totalCourses: number;
}

export interface GlobalSearchResult {
  courses: CourseSearchResult[];
  mentors: MentorSearchResult[];
  totalCourses: number;
  totalMentors: number;
}

/**
 * Course Search Filters
 */
export interface CourseSearchFilters {
  query?: string;
  categoryId?: string;
  level?: CourseLevel;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  isFree?: boolean;
  isPremium?: boolean;
  tags?: string[];
  language?: string;
  page?: number;
  limit?: number;
  sortBy?: "relevance" | "rating" | "students" | "price" | "newest";
  sortOrder?: "asc" | "desc";
}

/**
 * Mentor Search Filters
 */
export interface MentorSearchFilters {
  query?: string;
  expertise?: string[];
  minRating?: number;
  minExperience?: number;
  page?: number;
  limit?: number;
  sortBy?: "relevance" | "rating" | "students" | "courses";
  sortOrder?: "asc" | "desc";
}

// Types for internal use
interface CourseWithRelations extends Course {
  mentor: {
    user: {
      name: string;
      profile_picture?: string | null;
    };
  };
  category: {
    name: string;
    slug: string;
  };
}

interface MentorProfileWithUser extends MentorProfile {
  user: {
    id: string;
    name: string;
    email: string;
    profile_picture?: string | null;
  };
}

interface CategoryGroupResult {
  category_id: string;
  _count: number;
}

interface LevelGroupResult {
  level: CourseLevel;
  _count: number;
}

/**
 * Search Service
 * Handles all search and discovery operations
 */
export class SearchService {
  /**
   * Global search across courses and mentors
   */
  async globalSearch(
    query: string,
    options: {
      includeCoursesLimit?: number;
      includeMentorsLimit?: number;
    } = {}
  ): Promise<GlobalSearchResult> {
    const { includeCoursesLimit = 5, includeMentorsLimit = 3 } = options;

    try {
      console.log("🔍 Starting global search for:", query);

      // Parallel search for courses and mentors
      const [coursesResult, mentorsResult] = await Promise.all([
        this.searchCourses({
          query,
          limit: includeCoursesLimit,
          sortBy: "relevance",
        }),
        this.searchMentors({
          query,
          limit: includeMentorsLimit,
          sortBy: "relevance",
        }),
      ]);

      console.log("✅ Global search completed:", {
        courses: coursesResult.courses.length,
        mentors: mentorsResult.mentors.length,
      });

      return {
        courses: coursesResult.courses,
        mentors: mentorsResult.mentors,
        totalCourses: coursesResult.total,
        totalMentors: mentorsResult.total,
      };
    } catch (error) {
      console.error("❌ Global search failed:", error);
      throw error;
    }
  }

  /**
   * Advanced course search with filters
   */
  async searchCourses(filters: CourseSearchFilters): Promise<{
    courses: CourseSearchResult[];
    total: number;
    facets: {
      categories: Array<{ id: string; name: string; count: number }>;
      levels: Array<{ level: CourseLevel; count: number }>;
      priceRanges: Array<{ range: string; count: number }>;
    };
  }> {
    const {
      query,
      categoryId,
      level,
      minPrice,
      maxPrice,
      minRating,
      isFree,
      isPremium,
      tags,
      language = "id",
      page = 1,
      limit = 12,
      sortBy = "relevance",
      sortOrder = "desc",
    } = filters;

    try {
      console.log("📚 Searching courses with filters:", filters);

      // Build where clause
      const where: any = {
        status: "PUBLISHED" as CourseStatus,
        language,
      };

      // Full-text search
      if (query) {
        where.OR = [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { short_description: { contains: query, mode: "insensitive" } },
          {
            tags: {
              hasSome: query.toLowerCase().split(" "),
            },
          },
        ];
      }

      // Category filter
      if (categoryId) {
        where.category_id = categoryId;
      }

      // Level filter
      if (level) {
        where.level = level;
      }

      // Price filters
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      // Free/Premium filters
      if (isFree !== undefined) {
        where.is_free = isFree;
      }
      if (isPremium !== undefined) {
        where.is_premium = isPremium;
      }

      // Rating filter
      if (minRating !== undefined) {
        where.average_rating = { gte: minRating };
      }

      // Tags filter
      if (tags && tags.length > 0) {
        where.tags = {
          hasSome: tags.map((t: string) => t.toLowerCase()),
        };
      }

      // Sorting
      const orderBy = this.buildCourseOrderBy(sortBy, sortOrder);

      // Calculate skip
      const skip = (page - 1) * limit;

      // Execute search
      const [courses, total, facets] = await Promise.all([
        prisma.course.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            short_description: true,
            level: true,
            price: true,
            discount_price: true,
            is_free: true,
            average_rating: true,
            total_students: true,
            total_reviews: true,
            mentor: {
              select: {
                user: {
                  select: {
                    name: true,
                    profile_picture: true,
                  },
                },
              },
            },
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        }),
        prisma.course.count({ where }),
        this.getCourseFacets(where),
      ]);

      // Transform results with proper type handling
      const transformedCourses: CourseSearchResult[] = courses.map(
        (course: CourseWithRelations) => ({
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
          totalReviews: course.total_reviews,
          mentor: {
            name: course.mentor.user.name,
            profilePicture: course.mentor.user.profile_picture,
          },
          category: {
            name: course.category.name,
            slug: course.category.slug,
          },
        })
      );

      console.log("✅ Course search completed:", {
        count: transformedCourses.length,
        total,
      });

      return {
        courses: transformedCourses,
        total,
        facets,
      };
    } catch (error) {
      console.error("❌ Course search failed:", error);
      throw error;
    }
  }

  /**
   * Mentor search with filters
   */
  async searchMentors(filters: MentorSearchFilters): Promise<{
    mentors: MentorSearchResult[];
    total: number;
    facets: {
      expertise: Array<{ skill: string; count: number }>;
      experienceRanges: Array<{ range: string; count: number }>;
    };
  }> {
    const {
      query,
      expertise,
      minRating,
      minExperience,
      page = 1,
      limit = 12,
      sortBy = "relevance",
      sortOrder = "desc",
    } = filters;

    try {
      console.log("👨‍🏫 Searching mentors with filters:", filters);

      // Build where clause
      const where: any = {
        status: "APPROVED",
        user: {
          status: "ACTIVE" as UserStatus,
        },
      };

      // Search by name, email, or bio
      if (query) {
        where.OR = [
          { user: { name: { contains: query, mode: "insensitive" } } },
          { user: { email: { contains: query, mode: "insensitive" } } },
          { headline: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } },
          {
            expertise: {
              hasSome: query.toLowerCase().split(" "),
            },
          },
        ];
      }

      // Expertise filter
      if (expertise && expertise.length > 0) {
        where.expertise = {
          hasSome: expertise.map((e: string) => e.toLowerCase()),
        };
      }

      // Rating filter
      if (minRating !== undefined) {
        where.average_rating = { gte: minRating };
      }

      // Experience filter
      if (minExperience !== undefined) {
        where.experience = { gte: minExperience };
      }

      // Sorting
      const orderBy = this.buildMentorOrderBy(sortBy, sortOrder);

      // Calculate skip
      const skip = (page - 1) * limit;

      // Execute search
      const [mentors, total, facets] = await Promise.all([
        prisma.mentorProfile.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            expertise: true,
            experience: true,
            headline: true,
            average_rating: true,
            total_students: true,
            total_courses: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profile_picture: true,
              },
            },
          },
        }),
        prisma.mentorProfile.count({ where }),
        this.getMentorFacets(where),
      ]);

      // Transform results with proper type handling
      const transformedMentors: MentorSearchResult[] = mentors.map(
        (mentor: MentorProfileWithUser) => ({
          id: mentor.id,
          name: mentor.user.name,
          email: mentor.user.email,
          profilePicture: mentor.user.profile_picture,
          headline: mentor.headline,
          expertise: mentor.expertise,
          experience: mentor.experience,
          averageRating: mentor.average_rating,
          totalStudents: mentor.total_students,
          totalCourses: mentor.total_courses,
        })
      );

      console.log("✅ Mentor search completed:", {
        count: transformedMentors.length,
        total,
      });

      return {
        mentors: transformedMentors,
        total,
        facets,
      };
    } catch (error) {
      console.error("❌ Mentor search failed:", error);
      throw error;
    }
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSearchSuggestions(
    query: string,
    limit: number = 5
  ): Promise<{
    courses: Array<{ id: string; title: string; slug: string }>;
    mentors: Array<{ id: string; name: string }>;
    tags: string[];
  }> {
    try {
      console.log("💡 Getting search suggestions for:", query);

      if (!query || query.length < 2) {
        return { courses: [], mentors: [], tags: [] };
      }

      const [courses, mentors, tags] = await Promise.all([
        // Course suggestions
        prisma.course.findMany({
          where: {
            status: "PUBLISHED",
            title: { contains: query, mode: "insensitive" },
          },
          select: {
            id: true,
            title: true,
            slug: true,
          },
          take: limit,
        }),

        // Mentor suggestions
        prisma.user.findMany({
          where: {
            role: "MENTOR" as UserRole,
            status: "ACTIVE" as UserStatus,
            name: { contains: query, mode: "insensitive" },
          },
          select: {
            id: true,
            name: true,
          },
          take: limit,
        }),

        // Tag suggestions
        this.getPopularTags(query, limit),
      ]);

      console.log("✅ Search suggestions generated:", {
        courses: courses.length,
        mentors: mentors.length,
        tags: tags.length,
      });

      return {
        courses,
        mentors,
        tags,
      };
    } catch (error) {
      console.error("❌ Search suggestions failed:", error);
      throw error;
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearches(limit: number = 10): Promise<string[]> {
    try {
      console.log("🏆 Getting popular searches");

      // In production, implement proper search analytics
      // For now, return common searches based on course tags
      const courses = await prisma.course.findMany({
        where: { status: "PUBLISHED" },
        select: { tags: true },
        take: 100,
      });

      const tagCounts = new Map<string, number>();
      courses.forEach((course: { tags: string[] }) => {
        course.tags.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      const popularSearches = Array.from(tagCounts.entries())
        .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag]: [string, number]) => tag);

      console.log("✅ Popular searches retrieved:", popularSearches);

      return popularSearches;
    } catch (error) {
      console.error("❌ Getting popular searches failed:", error);
      return [];
    }
  }

  /**
   * Get trending courses
   */
  async getTrendingCourses(limit: number = 10): Promise<CourseSearchResult[]> {
    try {
      console.log("📈 Getting trending courses");

      // Get courses with high enrollment in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const courses = await prisma.course.findMany({
        where: {
          status: "PUBLISHED",
          published_at: { gte: thirtyDaysAgo },
        },
        orderBy: [{ total_students: "desc" }, { average_rating: "desc" }],
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          short_description: true,
          level: true,
          price: true,
          discount_price: true,
          is_free: true,
          average_rating: true,
          total_students: true,
          total_reviews: true,
          mentor: {
            select: {
              user: {
                select: {
                  name: true,
                  profile_picture: true,
                },
              },
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      });

      const transformedCourses: CourseSearchResult[] = courses.map(
        (course: CourseWithRelations) => ({
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
          totalReviews: course.total_reviews,
          mentor: {
            name: course.mentor.user.name,
            profilePicture: course.mentor.user.profile_picture,
          },
          category: {
            name: course.category.name,
            slug: course.category.slug,
          },
        })
      );

      console.log("✅ Trending courses retrieved:", transformedCourses.length);

      return transformedCourses;
    } catch (error) {
      console.error("❌ Getting trending courses failed:", error);
      throw error;
    }
  }

  /**
   * Get similar courses
   */
  async getSimilarCourses(
    courseId: string,
    limit: number = 6
  ): Promise<CourseSearchResult[]> {
    try {
      console.log("🔍 Getting similar courses for:", courseId);

      // Get the target course
      const targetCourse = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          category_id: true,
          level: true,
          tags: true,
        },
      });

      if (!targetCourse) {
        console.log("❌ Target course not found");
        return [];
      }

      // Find similar courses
      const courses = await prisma.course.findMany({
        where: {
          status: "PUBLISHED",
          id: { not: courseId },
          OR: [
            { category_id: targetCourse.category_id },
            { level: targetCourse.level },
            {
              tags: {
                hasSome: targetCourse.tags,
              },
            },
          ],
        },
        orderBy: { total_students: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          short_description: true,
          level: true,
          price: true,
          discount_price: true,
          is_free: true,
          average_rating: true,
          total_students: true,
          total_reviews: true,
          mentor: {
            select: {
              user: {
                select: {
                  name: true,
                  profile_picture: true,
                },
              },
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      });

      const transformedCourses: CourseSearchResult[] = courses.map(
        (course: CourseWithRelations) => ({
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
          totalReviews: course.total_reviews,
          mentor: {
            name: course.mentor.user.name,
            profilePicture: course.mentor.user.profile_picture,
          },
          category: {
            name: course.category.name,
            slug: course.category.slug,
          },
        })
      );

      console.log("✅ Similar courses retrieved:", transformedCourses.length);

      return transformedCourses;
    } catch (error) {
      console.error("❌ Getting similar courses failed:", error);
      throw error;
    }
  }

  /**
   * Build course order by clause
   */
  private buildCourseOrderBy(sortBy: string, sortOrder: "asc" | "desc"): any {
    switch (sortBy) {
      case "rating":
        return [{ average_rating: sortOrder }, { total_reviews: "desc" }];
      case "students":
        return { total_students: sortOrder };
      case "price":
        return { price: sortOrder };
      case "newest":
        return { published_at: sortOrder };
      case "relevance":
      default:
        return [{ total_students: "desc" }, { average_rating: "desc" }];
    }
  }

  /**
   * Build mentor order by clause
   */
  private buildMentorOrderBy(sortBy: string, sortOrder: "asc" | "desc"): any {
    switch (sortBy) {
      case "rating":
        return [{ average_rating: sortOrder }, { total_reviews: "desc" }];
      case "students":
        return { total_students: sortOrder };
      case "courses":
        return { total_courses: sortOrder };
      case "relevance":
      default:
        return [{ total_students: "desc" }, { average_rating: "desc" }];
    }
  }

  /**
   * Get course facets for filtering
   */
  private async getCourseFacets(where: any) {
    try {
      const [categories, levels] = await Promise.all([
        // Categories with count
        prisma.course.groupBy({
          by: ["category_id"],
          where,
          _count: true,
        }),

        // Levels with count
        prisma.course.groupBy({
          by: ["level"],
          where,
          _count: true,
        }),
      ]);

      // Get category details
      const categoryIds = categories.map(
        (c: CategoryGroupResult) => c.category_id
      );
      const categoryDetails = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      });

      const categoriesWithNames = categories.map(
        (cat: CategoryGroupResult) => ({
          id: cat.category_id,
          name:
            categoryDetails.find((c: Category) => c.id === cat.category_id)
              ?.name || "Unknown",
          count: cat._count,
        })
      );

      // Create price ranges (static for now)
      const priceRanges = [
        { range: "Free", count: 0 },
        { range: "Under 100k", count: 0 },
        { range: "100k - 250k", count: 0 },
        { range: "250k - 500k", count: 0 },
        { range: "Above 500k", count: 0 },
      ];

      return {
        categories: categoriesWithNames,
        levels: levels.map((l: LevelGroupResult) => ({
          level: l.level,
          count: l._count,
        })),
        priceRanges,
      };
    } catch (error) {
      console.error("❌ Getting course facets failed:", error);
      return {
        categories: [],
        levels: [],
        priceRanges: [],
      };
    }
  }

  /**
   * Get mentor facets
   */
  private async getMentorFacets(where: any) {
    try {
      const mentors = await prisma.mentorProfile.findMany({
        where,
        select: {
          expertise: true,
          experience: true,
        },
      });

      // Count expertise
      const expertiseCounts = new Map<string, number>();
      mentors.forEach((mentor: { expertise: string[] }) => {
        mentor.expertise.forEach((skill: string) => {
          expertiseCounts.set(skill, (expertiseCounts.get(skill) || 0) + 1);
        });
      });

      const expertise = Array.from(expertiseCounts.entries())
        .map(([skill, count]: [string, number]) => ({ skill, count }))
        .sort(
          (
            a: { skill: string; count: number },
            b: { skill: string; count: number }
          ) => b.count - a.count
        )
        .slice(0, 20);

      // Experience ranges
      const experienceRanges = [
        {
          range: "0-2 years",
          count: mentors.filter(
            (m: { experience: number }) => m.experience <= 2
          ).length,
        },
        {
          range: "3-5 years",
          count: mentors.filter(
            (m: { experience: number }) =>
              m.experience >= 3 && m.experience <= 5
          ).length,
        },
        {
          range: "6-10 years",
          count: mentors.filter(
            (m: { experience: number }) =>
              m.experience >= 6 && m.experience <= 10
          ).length,
        },
        {
          range: "10+ years",
          count: mentors.filter(
            (m: { experience: number }) => m.experience > 10
          ).length,
        },
      ];

      return {
        expertise,
        experienceRanges,
      };
    } catch (error) {
      console.error("❌ Getting mentor facets failed:", error);
      return {
        expertise: [],
        experienceRanges: [],
      };
    }
  }

  /**
   * Get popular tags
   */
  private async getPopularTags(
    query: string,
    limit: number
  ): Promise<string[]> {
    try {
      const courses = await prisma.course.findMany({
        where: {
          status: "PUBLISHED",
          tags: {
            hasSome: query.toLowerCase().split(" "),
          },
        },
        select: { tags: true },
        take: 100,
      });

      const tagSet = new Set<string>();
      courses.forEach((course: { tags: string[] }) => {
        course.tags.forEach((tag: string) => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            tagSet.add(tag);
          }
        });
      });

      return Array.from(tagSet).slice(0, limit);
    } catch (error) {
      console.error("❌ Getting popular tags failed:", error);
      return [];
    }
  }

  /**
   * Get service status (for debugging)
   */
  getServiceStatus(): any {
    return {
      status: "Active",
      timestamp: new Date().toISOString(),
      features: [
        "globalSearch",
        "courseSearch",
        "mentorSearch",
        "searchSuggestions",
        "trendingCourses",
        "similarCourses",
      ],
    };
  }
}

// Export singleton instance
const searchService = new SearchService();
export default searchService;
