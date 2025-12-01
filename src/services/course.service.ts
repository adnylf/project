// services/course.service.ts
import prisma from "@/lib/prisma";
import { generateSlug } from "@/utils/string.util";
import { AppError, NotFoundError, ForbiddenError } from "@/utils/error.util";
import { HTTP_STATUS, COURSE_STATUS, USER_ROLES } from "@/lib/constants";
import type { CreateCourseInput, UpdateCourseInput } from "@/lib/validation";
import type {
  Prisma,
  CourseStatus,
  CourseLevel,
  Course,
  Section,
  Material,
  MentorProfile,
  Category,
} from "@prisma/client";

/**
 * Course Creation Data
 */
export interface CreateCourseData {
  title: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  level: CourseLevel;
  language: string; // Pastikan language selalu string
  price: number;
  discountPrice?: number;
  isFree: boolean;
  isPremium: boolean;
  requirements?: string[];
  whatYouWillLearn: string[];
  targetAudience?: string[];
  tags?: string[];
}

/**
 * Course Update Data
 */
type UpdateCourseData = Partial<CreateCourseData> & {
  thumbnail?: string;
  coverImage?: string;
};

/**
 * Course List Filters
 */
interface CourseListFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  level?: CourseLevel;
  minPrice?: number;
  maxPrice?: number;
  isFree?: boolean;
  isPremium?: boolean;
  status?: CourseStatus;
  mentorId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Formatted Course Response
 */
interface FormattedCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string | null;
  thumbnail: string | null;
  cover_image: string | null;
  level: CourseLevel;
  language: string;
  price: number;
  discount_price: number | null;
  is_free: boolean;
  is_premium: boolean;
  is_featured: boolean;
  status: CourseStatus;
  requirements: string[];
  what_you_will_learn: string[];
  target_audience: string[];
  tags: string[];
  total_duration: number;
  total_lectures: number;
  total_students: number;
  average_rating: number;
  total_reviews: number;
  total_views: number;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  mentor: {
    user: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

/**
 * Course with sections, materials and mentor
 */
type CourseWithSectionsAndMentor = Course & {
  category: Category;
  mentor: MentorProfile & {
    user: {
      id: string;
      full_name: string | null;
      email: string;
      avatar_url: string | null;
      bio: string | null;
    };
  };
  sections: (Section & {
    materials: Material[];
  })[];
  _count: {
    sections: number;
    enrollments: number;
    reviews: number;
  };
};

/**
 * Course with sections and materials for publishing
 */
type CourseForPublish = Course & {
  category: Category;
  mentor: MentorProfile & {
    user_id: string;
  };
  sections: (Section & {
    materials: Material[];
  })[];
};

/**
 * Featured Course Response
 */
interface FeaturedCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  short_description: string | null;
  level: CourseLevel;
  price: number;
  discount_price: number | null;
  is_free: boolean;
  total_students: number;
  average_rating: number;
  total_reviews: number;
  category: {
    name: string;
    slug: string;
  };
  mentor: {
    user: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

/**
 * Mentor Course Response
 */
interface MentorCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  short_description: string | null;
  level: CourseLevel;
  price: number;
  discount_price: number | null;
  is_free: boolean;
  is_premium: boolean;
  status: CourseStatus;
  total_students: number;
  average_rating: number;
  total_reviews: number;
  total_duration: number;
  total_lectures: number;
  published_at: Date | null;
  created_at: Date;
  category: Category;
  _count: {
    enrollments: number;
    reviews: number;
    sections: number;
  };
}

/**
 * Enrollment Stats
 */
interface EnrollmentStats {
  status: string;
  _count: number;
}

/**
 * Course Statistics
 */
interface CourseStatistics {
  total_students: number;
  average_rating: number;
  total_reviews: number;
  total_views: number;
  enrollments: Record<string, number>;
  revenue: {
    total: number;
    transactions: number;
  };
}

/**
 * Course Service
 * Handles course CRUD operations and management
 */
export class CourseService {
  /**
   * Create new course
   */
  async createCourse(mentorUserId: string, data: CreateCourseInput) {
    try {
      console.log("📚 Creating new course for mentor:", mentorUserId);

      // Get mentor profile
      const mentor = await prisma.mentorProfile.findUnique({
        where: { user_id: mentorUserId },
      });

      if (!mentor) {
        throw new ForbiddenError("Only approved mentors can create courses");
      }

      if (mentor.status !== "APPROVED") {
        throw new ForbiddenError("Your mentor profile must be approved first");
      }

      // Validate input - pastikan language selalu ada
      if (
        !data.title ||
        !data.description ||
        !data.categoryId ||
        !data.whatYouWillLearn
      ) {
        throw new AppError(
          "Title, description, category, and learning outcomes are required",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (data.price < 0) {
        throw new AppError("Price cannot be negative", HTTP_STATUS.BAD_REQUEST);
      }

      // Pastikan language selalu string dengan default "id"
      const language = data.language || "id";

      // Generate slug
      let slug = generateSlug(data.title);

      // Ensure unique slug
      const existingCourse = await prisma.course.findUnique({
        where: { slug },
      });

      if (existingCourse) {
        slug = `${slug}-${Date.now()}`;
      }

      // Create course
      const course = await prisma.course.create({
        data: {
          mentor_id: mentor.id,
          title: data.title,
          slug,
          description: data.description,
          short_description: data.shortDescription,
          category_id: data.categoryId,
          level: data.level,
          language: language, // Gunakan language yang sudah dipastikan
          price: data.price,
          discount_price: data.discountPrice,
          is_free: data.isFree,
          is_premium: data.isPremium,
          requirements: data.requirements || [],
          what_you_will_learn: data.whatYouWillLearn,
          target_audience: data.targetAudience || [],
          tags: data.tags || [],
          status: COURSE_STATUS.DRAFT,
          total_duration: 0,
          total_lectures: 0,
          total_students: 0,
          average_rating: 0,
          total_reviews: 0,
          total_views: 0,
        },
        include: {
          category: true,
          mentor: {
            include: {
              user: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                  avatar_url: true,
                },
              },
            },
          },
        },
      });

      console.log("✅ Course created successfully:", course.id);

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        short_description: course.short_description,
        thumbnail: course.thumbnail,
        cover_image: course.cover_image,
        level: course.level,
        language: course.language,
        price: course.price,
        discount_price: course.discount_price,
        is_free: course.is_free,
        is_premium: course.is_premium,
        is_featured: course.is_featured,
        status: course.status,
        requirements: course.requirements,
        what_you_will_learn: course.what_you_will_learn,
        target_audience: course.target_audience,
        tags: course.tags,
        total_duration: course.total_duration,
        total_lectures: course.total_lectures,
        total_students: course.total_students,
        average_rating: course.average_rating,
        total_reviews: course.total_reviews,
        total_views: course.total_views,
        published_at: course.published_at,
        created_at: course.created_at,
        updated_at: course.updated_at,
        category: course.category,
        mentor: course.mentor,
      };
    } catch (error) {
      console.error("❌ Create course failed:", error);
      throw error;
    }
  }

  /**
   * Get all courses with filters
   */
  async getAllCourses(filters: CourseListFilters = {}) {
    try {
      console.log("📚 Getting all courses with filters:", filters);

      const {
        page = 1,
        limit = 10,
        search,
        categoryId,
        level,
        minPrice,
        maxPrice,
        isFree,
        isPremium,
        status,
        mentorId,
        sortBy = "created_at",
        sortOrder = "desc",
      } = filters;

      // Validate pagination
      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.min(100, Math.max(1, limit));
      const skip = (validatedPage - 1) * validatedLimit;

      // Build where clause
      const where: Prisma.CourseWhereInput = {};

      // Only show published courses for public
      if (!status) {
        where.status = COURSE_STATUS.PUBLISHED;
      } else {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { short_description: { contains: search, mode: "insensitive" } },
          { tags: { has: search.toLowerCase() } },
        ];
      }

      if (categoryId) {
        where.category_id = categoryId;
      }

      if (level) {
        where.level = level;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      if (isFree !== undefined) {
        where.is_free = isFree;
      }

      if (isPremium !== undefined) {
        where.is_premium = isPremium;
      }

      if (mentorId) {
        where.mentor_id = mentorId;
      }

      // Execute queries
      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          where,
          skip,
          take: validatedLimit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            mentor: {
              include: {
                user: {
                  select: {
                    id: true,
                    full_name: true,
                    avatar_url: true,
                  },
                },
              },
            },
          },
        }),
        prisma.course.count({ where }),
      ]);

      const formattedCourses: FormattedCourse[] = courses.map(
        (
          course: Course & {
            category: Category;
            mentor: MentorProfile & {
              user: {
                id: string;
                full_name: string | null;
                avatar_url: string | null;
              };
            };
          }
        ) => ({
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          short_description: course.short_description,
          thumbnail: course.thumbnail,
          cover_image: course.cover_image,
          level: course.level,
          language: course.language,
          price: course.price,
          discount_price: course.discount_price,
          is_free: course.is_free,
          is_premium: course.is_premium,
          is_featured: course.is_featured,
          status: course.status,
          requirements: course.requirements,
          what_you_will_learn: course.what_you_will_learn,
          target_audience: course.target_audience,
          tags: course.tags,
          total_duration: course.total_duration,
          total_lectures: course.total_lectures,
          total_students: course.total_students,
          average_rating: course.average_rating,
          total_reviews: course.total_reviews,
          total_views: course.total_views,
          published_at: course.published_at,
          created_at: course.created_at,
          updated_at: course.updated_at,
          category: course.category,
          mentor: course.mentor,
        })
      );

      console.log("✅ Retrieved courses:", { count: courses.length, total });

      return {
        data: formattedCourses,
        meta: {
          page: validatedPage,
          limit: validatedLimit,
          total,
          totalPages: Math.ceil(total / validatedLimit),
        },
      };
    } catch (error) {
      console.error("❌ Get all courses failed:", error);
      throw error;
    }
  }

  /**
   * Get course by ID with full details
   */
  async getCourseById(courseId: string, includePrivate = false) {
    try {
      console.log("📚 Getting course by ID:", courseId);

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          category: true,
          mentor: {
            include: {
              user: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                  avatar_url: true,
                  bio: true,
                },
              },
            },
          },
          sections: {
            orderBy: { order: "asc" },
            include: {
              materials: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  type: true,
                  duration: true,
                  order: true,
                  is_free: true,
                },
              },
            },
          },
          _count: {
            select: {
              sections: true,
              enrollments: true,
              reviews: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundError("Course not found");
      }

      // Check if course is published (unless requesting private access)
      if (!includePrivate && course.status !== COURSE_STATUS.PUBLISHED) {
        throw new ForbiddenError("Course is not available");
      }

      console.log("✅ Course retrieved successfully:", courseId);

      return course;
    } catch (error) {
      console.error("❌ Get course by ID failed:", error);
      throw error;
    }
  }

  /**
   * Get course by slug
   */
  async getCourseBySlug(slug: string, includePrivate = false) {
    try {
      console.log("📚 Getting course by slug:", slug);

      const course = await prisma.course.findUnique({
        where: { slug },
        include: {
          category: true,
          mentor: {
            include: {
              user: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                  avatar_url: true,
                  bio: true,
                },
              },
            },
          },
          sections: {
            orderBy: { order: "asc" },
            include: {
              materials: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  type: true,
                  duration: true,
                  order: true,
                  is_free: true,
                },
              },
            },
          },
          _count: {
            select: {
              sections: true,
              enrollments: true,
              reviews: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundError("Course not found");
      }

      if (!includePrivate && course.status !== COURSE_STATUS.PUBLISHED) {
        throw new ForbiddenError("Course is not available");
      }

      // Increment view count
      await prisma.course.update({
        where: { id: course.id },
        data: { total_views: { increment: 1 } },
      });

      console.log("✅ Course retrieved by slug successfully:", slug);

      return course;
    } catch (error) {
      console.error("❌ Get course by slug failed:", error);
      throw error;
    }
  }

  /**
   * Update course
   */
  async updateCourse(
    courseId: string,
    userId: string,
    userRole: string,
    data: UpdateCourseInput
  ) {
    try {
      console.log("📚 Updating course:", { courseId, userId });

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          mentor: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundError("Course not found");
      }

      // Check permission (only mentor owner or admin)
      if (userRole !== USER_ROLES.ADMIN && course.mentor.user_id !== userId) {
        throw new ForbiddenError(
          "You do not have permission to update this course"
        );
      }

      // Update slug if title changed
      const updateData: Prisma.CourseUpdateInput = {
        ...data,
      };

      if (data.title && data.title !== course.title) {
        let newSlug = generateSlug(data.title);
        // Check slug uniqueness
        const existingCourse = await prisma.course.findFirst({
          where: {
            slug: newSlug,
            NOT: { id: courseId },
          },
        });

        if (existingCourse) {
          newSlug = `${newSlug}-${Date.now()}`;
        }
        updateData.slug = newSlug;
      }

      // Map field names to match Prisma schema
      if (data.shortDescription !== undefined) {
        updateData.short_description = data.shortDescription;
      }
      if (data.discountPrice !== undefined) {
        updateData.discount_price = data.discountPrice;
      }
      if (data.isFree !== undefined) {
        updateData.is_free = data.isFree;
      }
      if (data.isPremium !== undefined) {
        updateData.is_premium = data.isPremium;
      }
      if (data.whatYouWillLearn !== undefined) {
        updateData.what_you_will_learn = data.whatYouWillLearn;
      }
      if (data.targetAudience !== undefined) {
        updateData.target_audience = data.targetAudience;
      }
      // Pastikan language selalu string
      if (data.language !== undefined) {
        updateData.language = data.language;
      }

      // Handle category relation
      if (data.categoryId !== undefined) {
        updateData.category = {
          connect: { id: data.categoryId },
        };
      }

      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: updateData,
        include: {
          category: true,
          mentor: {
            include: {
              user: {
                select: {
                  id: true,
                  full_name: true,
                  avatar_url: true,
                },
              },
            },
          },
        },
      });

      const formattedCourse: FormattedCourse = {
        id: updatedCourse.id,
        title: updatedCourse.title,
        slug: updatedCourse.slug,
        description: updatedCourse.description,
        short_description: updatedCourse.short_description,
        thumbnail: updatedCourse.thumbnail,
        cover_image: updatedCourse.cover_image,
        level: updatedCourse.level,
        language: updatedCourse.language,
        price: updatedCourse.price,
        discount_price: updatedCourse.discount_price,
        is_free: updatedCourse.is_free,
        is_premium: updatedCourse.is_premium,
        is_featured: updatedCourse.is_featured,
        status: updatedCourse.status,
        requirements: updatedCourse.requirements,
        what_you_will_learn: updatedCourse.what_you_will_learn,
        target_audience: updatedCourse.target_audience,
        tags: updatedCourse.tags,
        total_duration: updatedCourse.total_duration,
        total_lectures: updatedCourse.total_lectures,
        total_students: updatedCourse.total_students,
        average_rating: updatedCourse.average_rating,
        total_reviews: updatedCourse.total_reviews,
        total_views: updatedCourse.total_views,
        published_at: updatedCourse.published_at,
        created_at: updatedCourse.created_at,
        updated_at: updatedCourse.updated_at,
        category: updatedCourse.category,
        mentor: updatedCourse.mentor,
      };

      console.log("✅ Course updated successfully:", courseId);
      return formattedCourse;
    } catch (error) {
      console.error("❌ Update course failed:", error);
      throw error;
    }
  }

  /**
   * Delete course
   */
  async deleteCourse(courseId: string, userId: string, userRole: string) {
    try {
      console.log("📚 Deleting course:", { courseId, userId });

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          mentor: true,
        },
      });

      if (!course) {
        throw new NotFoundError("Course not found");
      }

      // Check permission
      if (userRole !== USER_ROLES.ADMIN && course.mentor.user_id !== userId) {
        throw new ForbiddenError(
          "You do not have permission to delete this course"
        );
      }

      // Check if course has enrollments
      const enrollmentCount = await prisma.enrollment.count({
        where: { course_id: courseId },
      });

      if (enrollmentCount > 0) {
        throw new AppError(
          "Cannot delete course with active enrollments. Archive it instead.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      await prisma.course.delete({
        where: { id: courseId },
      });

      console.log("✅ Course deleted successfully:", courseId);
      return { id: courseId, deleted: true };
    } catch (error) {
      console.error("❌ Delete course failed:", error);
      throw error;
    }
  }

  /**
   * Publish course
   */
  async publishCourse(courseId: string, userId: string, userRole: string) {
    try {
      console.log("📚 Publishing course:", { courseId, userId });

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          mentor: true,
          sections: {
            include: {
              materials: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundError("Course not found");
      }

      // Check permission
      if (userRole !== USER_ROLES.ADMIN && course.mentor.user_id !== userId) {
        throw new ForbiddenError(
          "You do not have permission to publish this course"
        );
      }

      // Validation: Course must have sections and materials
      if (course.sections.length === 0) {
        throw new AppError(
          "Course must have at least one section",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const totalMaterials = course.sections.reduce(
        (sum: number, section: Section & { materials: Material[] }) =>
          sum + section.materials.length,
        0
      );

      if (totalMaterials === 0) {
        throw new AppError(
          "Course must have at least one material",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Calculate total duration and lectures
      const totalDuration = course.sections.reduce(
        (sum: number, section: Section) => sum + (section.duration || 0),
        0
      );

      const totalLectures = course.sections.reduce(
        (sum: number, section: Section & { materials: Material[] }) =>
          sum + section.materials.length,
        0
      );

      // Update status to published
      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: {
          status: COURSE_STATUS.PUBLISHED,
          published_at: new Date(),
          total_duration: totalDuration,
          total_lectures: totalLectures,
        },
      });

      console.log("✅ Course published successfully:", courseId);
      return {
        id: updatedCourse.id,
        title: updatedCourse.title,
        status: updatedCourse.status,
        published_at: updatedCourse.published_at,
        total_duration: updatedCourse.total_duration,
        total_lectures: updatedCourse.total_lectures,
      };
    } catch (error) {
      console.error("❌ Publish course failed:", error);
      throw error;
    }
  }

  /**
   * Archive course
   */
  async archiveCourse(courseId: string, userId: string, userRole: string) {
    try {
      console.log("📚 Archiving course:", { courseId, userId });

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          mentor: true,
        },
      });

      if (!course) {
        throw new NotFoundError("Course not found");
      }

      // Check permission
      if (userRole !== USER_ROLES.ADMIN && course.mentor.user_id !== userId) {
        throw new ForbiddenError(
          "You do not have permission to archive this course"
        );
      }

      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: { status: COURSE_STATUS.ARCHIVED },
      });

      console.log("✅ Course archived successfully:", courseId);
      return {
        id: updatedCourse.id,
        title: updatedCourse.title,
        status: updatedCourse.status,
      };
    } catch (error) {
      console.error("❌ Archive course failed:", error);
      throw error;
    }
  }

  /**
   * Get course statistics
   */
  async getCourseStatistics(courseId: string): Promise<CourseStatistics> {
    try {
      console.log("📊 Getting course statistics:", courseId);

      const [course, enrollmentStats, revenueStats] = await Promise.all([
        prisma.course.findUnique({
          where: { id: courseId },
          select: {
            total_students: true,
            average_rating: true,
            total_reviews: true,
            total_views: true,
          },
        }),
        prisma.enrollment.groupBy({
          by: ["status"],
          where: { course_id: courseId },
          _count: true,
        }),
        prisma.transaction.aggregate({
          where: {
            course_id: courseId,
            status: "PAID",
          },
          _sum: { total_amount: true },
          _count: true,
        }),
      ]);

      if (!course) {
        throw new NotFoundError("Course not found");
      }

      const statistics: CourseStatistics = {
        ...course,
        enrollments: Object.fromEntries(
          enrollmentStats.map((stat: EnrollmentStats) => [
            stat.status,
            stat._count,
          ])
        ),
        revenue: {
          total: revenueStats._sum.total_amount || 0,
          transactions: revenueStats._count,
        },
      };

      console.log("✅ Course statistics retrieved successfully:", courseId);
      return statistics;
    } catch (error) {
      console.error("❌ Get course statistics failed:", error);
      throw error;
    }
  }

  /**
   * Get featured courses
   */
  async getFeaturedCourses(limit: number = 8): Promise<FeaturedCourse[]> {
    try {
      console.log("⭐ Getting featured courses");

      const courses = await prisma.course.findMany({
        where: {
          status: COURSE_STATUS.PUBLISHED,
          is_featured: true,
        },
        take: Math.min(limit, 20),
        orderBy: { created_at: "desc" },
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

      const formattedCourses: FeaturedCourse[] = courses.map(
        (
          course: Course & {
            category: { name: string; slug: string };
            mentor: MentorProfile & {
              user: { full_name: string | null; avatar_url: string | null };
            };
          }
        ) => ({
          id: course.id,
          title: course.title,
          slug: course.slug,
          thumbnail: course.thumbnail,
          short_description: course.short_description,
          level: course.level,
          price: course.price,
          discount_price: course.discount_price,
          is_free: course.is_free,
          total_students: course.total_students,
          average_rating: course.average_rating,
          total_reviews: course.total_reviews,
          category: course.category,
          mentor: course.mentor,
        })
      );

      console.log("✅ Featured courses retrieved:", { count: courses.length });
      return formattedCourses;
    } catch (error) {
      console.error("❌ Get featured courses failed:", error);
      throw error;
    }
  }

  /**
   * Get mentor's courses
   */
  async getMentorCourses(
    mentorUserId: string,
    includePrivate = false
  ): Promise<MentorCourse[]> {
    try {
      console.log("📚 Getting mentor courses:", mentorUserId);

      // Get mentor profile
      const mentor = await prisma.mentorProfile.findUnique({
        where: { user_id: mentorUserId },
      });

      if (!mentor) {
        throw new NotFoundError("Mentor profile not found");
      }

      const where: Prisma.CourseWhereInput = {
        mentor_id: mentor.id,
      };

      if (!includePrivate) {
        where.status = COURSE_STATUS.PUBLISHED;
      }

      const courses = await prisma.course.findMany({
        where,
        orderBy: { created_at: "desc" },
        include: {
          category: true,
          _count: {
            select: {
              enrollments: true,
              reviews: true,
              sections: true,
            },
          },
        },
      });

      const formattedCourses: MentorCourse[] = courses.map(
        (
          course: Course & {
            category: Category;
            _count: {
              enrollments: number;
              reviews: number;
              sections: number;
            };
          }
        ) => ({
          id: course.id,
          title: course.title,
          slug: course.slug,
          thumbnail: course.thumbnail,
          short_description: course.short_description,
          level: course.level,
          price: course.price,
          discount_price: course.discount_price,
          is_free: course.is_free,
          is_premium: course.is_premium,
          status: course.status,
          total_students: course.total_students,
          average_rating: course.average_rating,
          total_reviews: course.total_reviews,
          total_duration: course.total_duration,
          total_lectures: course.total_lectures,
          published_at: course.published_at,
          created_at: course.created_at,
          category: course.category,
          _count: course._count,
        })
      );

      console.log("✅ Mentor courses retrieved:", {
        mentorUserId,
        count: courses.length,
      });

      return formattedCourses;
    } catch (error) {
      console.error("❌ Get mentor courses failed:", error);
      throw error;
    }
  }

  /**
   * Search courses
   */
  async searchCourses(query: string, filters: CourseListFilters = {}) {
    try {
      console.log("🔍 Searching courses:", { query, filters });

      const {
        page = 1,
        limit = 10,
        categoryId,
        level,
        minPrice,
        maxPrice,
        isFree,
        isPremium,
        sortBy = "created_at",
        sortOrder = "desc",
      } = filters;

      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.min(100, Math.max(1, limit));
      const skip = (validatedPage - 1) * validatedLimit;

      const where: Prisma.CourseWhereInput = {
        status: COURSE_STATUS.PUBLISHED,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { short_description: { contains: query, mode: "insensitive" } },
          { tags: { has: query.toLowerCase() } },
        ],
      };

      if (categoryId) {
        where.category_id = categoryId;
      }

      if (level) {
        where.level = level;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      if (isFree !== undefined) {
        where.is_free = isFree;
      }

      if (isPremium !== undefined) {
        where.is_premium = isPremium;
      }

      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          where,
          skip,
          take: validatedLimit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            mentor: {
              include: {
                user: {
                  select: {
                    id: true,
                    full_name: true,
                    avatar_url: true,
                  },
                },
              },
            },
          },
        }),
        prisma.course.count({ where }),
      ]);

      const formattedCourses: FormattedCourse[] = courses.map(
        (
          course: Course & {
            category: Category;
            mentor: MentorProfile & {
              user: {
                id: string;
                full_name: string | null;
                avatar_url: string | null;
              };
            };
          }
        ) => ({
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          short_description: course.short_description,
          thumbnail: course.thumbnail,
          cover_image: course.cover_image,
          level: course.level,
          language: course.language,
          price: course.price,
          discount_price: course.discount_price,
          is_free: course.is_free,
          is_premium: course.is_premium,
          is_featured: course.is_featured,
          status: course.status,
          requirements: course.requirements,
          what_you_will_learn: course.what_you_will_learn,
          target_audience: course.target_audience,
          tags: course.tags,
          total_duration: course.total_duration,
          total_lectures: course.total_lectures,
          total_students: course.total_students,
          average_rating: course.average_rating,
          total_reviews: course.total_reviews,
          total_views: course.total_views,
          published_at: course.published_at,
          created_at: course.created_at,
          updated_at: course.updated_at,
          category: course.category,
          mentor: course.mentor,
        })
      );

      console.log("✅ Search completed:", {
        query,
        count: courses.length,
        total,
      });

      return {
        data: formattedCourses,
        meta: {
          page: validatedPage,
          limit: validatedLimit,
          total,
          totalPages: Math.ceil(total / validatedLimit),
        },
      };
    } catch (error) {
      console.error("❌ Search courses failed:", error);
      throw error;
    }
  }
}

const courseService = new CourseService();
export default courseService;
