import prisma from '@/lib/prisma';
import type { Prisma, CourseLevel, CourseStatus } from '@prisma/client';

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
  sortBy?: 'relevance' | 'rating' | 'students' | 'price' | 'newest';
  sortOrder?: 'asc' | 'desc';
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
  sortBy?: 'relevance' | 'rating' | 'students' | 'courses';
  sortOrder?: 'asc' | 'desc';
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

    // Parallel search for courses and mentors
    const [coursesResult, mentorsResult] = await Promise.all([
      this.searchCourses({
        query,
        limit: includeCoursesLimit,
        sortBy: 'relevance',
      }),
      this.searchMentors({
        query,
        limit: includeMentorsLimit,
        sortBy: 'relevance',
      }),
    ]);

    return {
      courses: coursesResult.courses,
      mentors: mentorsResult.mentors,
      totalCourses: coursesResult.total,
      totalMentors: mentorsResult.total,
    };
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
      language = 'id',
      page = 1,
      limit = 12,
      sortBy = 'relevance',
      sortOrder = 'desc',
    } = filters;

    // Build where clause
    const where: Prisma.CourseWhereInput = {
      status: 'PUBLISHED' as CourseStatus,
      language,
    };

    // Full-text search
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        {
          tags: {
            hasSome: query.toLowerCase().split(' '),
          },
        },
      ];
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
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
      where.isFree = isFree;
    }
    if (isPremium !== undefined) {
      where.isPremium = isPremium;
    }

    // Rating filter
    if (minRating !== undefined) {
      where.averageRating = { gte: minRating };
    }

    // Tags filter
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags.map((t) => t.toLowerCase()),
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
          shortDescription: true,
          level: true,
          price: true,
          discountPrice: true,
          isFree: true,
          averageRating: true,
          totalStudents: true,
          totalReviews: true,
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
    const transformedCourses: CourseSearchResult[] = courses.map((course) => ({
      ...course,
      thumbnail: course.thumbnail ?? undefined,
      shortDescription: course.shortDescription ?? undefined,
      discountPrice: course.discountPrice ?? undefined,
      mentor: {
        name: course.mentor.user.name,
        profilePicture: course.mentor.user.profilePicture ?? undefined,
      },
    }));

    return {
      courses: transformedCourses,
      total,
      facets,
    };
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
      sortBy = 'relevance',
      sortOrder = 'desc',
    } = filters;

    // Build where clause
    const where: Prisma.MentorProfileWhereInput = {
      status: 'APPROVED',
      user: {
        status: 'ACTIVE',
      },
    };

    // Search by name, email, or bio
    if (query) {
      where.OR = [
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { user: { email: { contains: query, mode: 'insensitive' } } },
        { headline: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
        {
          expertise: {
            hasSome: query.toLowerCase().split(' '),
          },
        },
      ];
    }

    // Expertise filter
    if (expertise && expertise.length > 0) {
      where.expertise = {
        hasSome: expertise.map((e) => e.toLowerCase()),
      };
    }

    // Rating filter
    if (minRating !== undefined) {
      where.averageRating = { gte: minRating };
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
          averageRating: true,
          totalStudents: true,
          totalCourses: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
        },
      }),
      prisma.mentorProfile.count({ where }),
      this.getMentorFacets(where),
    ]);

    // Transform results with proper type handling
    const transformedMentors: MentorSearchResult[] = mentors.map((mentor) => ({
      id: mentor.id,
      name: mentor.user.name,
      email: mentor.user.email,
      profilePicture: mentor.user.profilePicture ?? undefined,
      headline: mentor.headline ?? undefined,
      expertise: mentor.expertise,
      experience: mentor.experience,
      averageRating: mentor.averageRating,
      totalStudents: mentor.totalStudents,
      totalCourses: mentor.totalCourses,
    }));

    return {
      mentors: transformedMentors,
      total,
      facets,
    };
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
    if (!query || query.length < 2) {
      return { courses: [], mentors: [], tags: [] };
    }

    const [courses, mentors, tags] = await Promise.all([
      // Course suggestions
      prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          title: { contains: query, mode: 'insensitive' },
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
          role: 'MENTOR',
          status: 'ACTIVE',
          name: { contains: query, mode: 'insensitive' },
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

    return {
      courses,
      mentors,
      tags,
    };
  }

  /**
   * Get popular search terms
   */
  async getPopularSearches(limit: number = 10): Promise<string[]> {
    // In production, implement proper search analytics
    // For now, return common searches based on course tags
    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: { tags: true },
      take: 100,
    });

    const tagCounts = new Map<string, number>();
    courses.forEach((course) => {
      course.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  /**
   * Get trending courses
   */
  async getTrendingCourses(limit: number = 10): Promise<CourseSearchResult[]> {
    // Get courses with high enrollment in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const courses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: thirtyDaysAgo },
      },
      orderBy: [{ totalStudents: 'desc' }, { averageRating: 'desc' }],
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
        totalReviews: true,
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
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    return courses.map((course) => ({
      ...course,
      thumbnail: course.thumbnail ?? undefined,
      shortDescription: course.shortDescription ?? undefined,
      discountPrice: course.discountPrice ?? undefined,
      mentor: {
        name: course.mentor.user.name,
        profilePicture: course.mentor.user.profilePicture ?? undefined,
      },
    }));
  }

  /**
   * Get similar courses
   */
  async getSimilarCourses(courseId: string, limit: number = 6): Promise<CourseSearchResult[]> {
    // Get the target course
    const targetCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        categoryId: true,
        level: true,
        tags: true,
      },
    });

    if (!targetCourse) {
      return [];
    }

    // Find similar courses
    const courses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: courseId },
        OR: [
          { categoryId: targetCourse.categoryId },
          { level: targetCourse.level },
          {
            tags: {
              hasSome: targetCourse.tags,
            },
          },
        ],
      },
      orderBy: { totalStudents: 'desc' },
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
        totalReviews: true,
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
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    return courses.map((course) => ({
      ...course,
      thumbnail: course.thumbnail ?? undefined,
      shortDescription: course.shortDescription ?? undefined,
      discountPrice: course.discountPrice ?? undefined,
      mentor: {
        name: course.mentor.user.name,
        profilePicture: course.mentor.user.profilePicture ?? undefined,
      },
    }));
  }

  /**
   * Build course order by clause
   */
  private buildCourseOrderBy(
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Prisma.CourseOrderByWithRelationInput | Prisma.CourseOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'rating':
        return [{ averageRating: sortOrder }, { totalReviews: 'desc' }];
      case 'students':
        return { totalStudents: sortOrder };
      case 'price':
        return { price: sortOrder };
      case 'newest':
        return { publishedAt: sortOrder };
      case 'relevance':
      default:
        return [{ totalStudents: 'desc' }, { averageRating: 'desc' }];
    }
  }

  /**
   * Build mentor order by clause
   */
  private buildMentorOrderBy(
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Prisma.MentorProfileOrderByWithRelationInput | Prisma.MentorProfileOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'rating':
        return [{ averageRating: sortOrder }, { totalReviews: 'desc' }];
      case 'students':
        return { totalStudents: sortOrder };
      case 'courses':
        return { totalCourses: sortOrder };
      case 'relevance':
      default:
        return [{ totalStudents: 'desc' }, { averageRating: 'desc' }];
    }
  }

  /**
   * Get course facets for filtering
   */
  private async getCourseFacets(where: Prisma.CourseWhereInput) {
    const [categories, levels] = await Promise.all([
      // Categories with count
      prisma.course.groupBy({
        by: ['categoryId'],
        where,
        _count: true,
      }),

      // Levels with count
      prisma.course.groupBy({
        by: ['level'],
        where,
        _count: true,
      }),
    ]);

    // Get category details
    const categoryIds = categories.map((c) => c.categoryId);
    const categoryDetails = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoriesWithNames = categories.map((cat) => ({
      id: cat.categoryId,
      name: categoryDetails.find((c) => c.id === cat.categoryId)?.name || 'Unknown',
      count: cat._count,
    }));

    // Create price ranges (static for now)
    const priceRanges = [
      { range: 'Free', count: 0 },
      { range: 'Under 100k', count: 0 },
      { range: '100k - 250k', count: 0 },
      { range: '250k - 500k', count: 0 },
      { range: 'Above 500k', count: 0 },
    ];

    return {
      categories: categoriesWithNames,
      levels: levels.map((l) => ({ level: l.level, count: l._count })),
      priceRanges,
    };
  }

  /**
   * Get mentor facets
   */
  private async getMentorFacets(where: Prisma.MentorProfileWhereInput) {
    const mentors = await prisma.mentorProfile.findMany({
      where,
      select: {
        expertise: true,
        experience: true,
      },
    });

    // Count expertise
    const expertiseCounts = new Map<string, number>();
    mentors.forEach((mentor) => {
      mentor.expertise.forEach((skill) => {
        expertiseCounts.set(skill, (expertiseCounts.get(skill) || 0) + 1);
      });
    });

    const expertise = Array.from(expertiseCounts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Experience ranges
    const experienceRanges = [
      { range: '0-2 years', count: mentors.filter((m) => m.experience <= 2).length },
      {
        range: '3-5 years',
        count: mentors.filter((m) => m.experience >= 3 && m.experience <= 5).length,
      },
      {
        range: '6-10 years',
        count: mentors.filter((m) => m.experience >= 6 && m.experience <= 10).length,
      },
      { range: '10+ years', count: mentors.filter((m) => m.experience > 10).length },
    ];

    return {
      expertise,
      experienceRanges,
    };
  }

  /**
   * Get popular tags
   */
  private async getPopularTags(query: string, limit: number): Promise<string[]> {
    const courses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        tags: {
          hasSome: query.toLowerCase().split(' '),
        },
      },
      select: { tags: true },
      take: 100,
    });

    const tagSet = new Set<string>();
    courses.forEach((course) => {
      course.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          tagSet.add(tag);
        }
      });
    });

    return Array.from(tagSet).slice(0, limit);
  }
}

const searchService = new SearchService();
export default searchService;
