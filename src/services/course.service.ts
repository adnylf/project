import prisma from '@/lib/prisma';
import { generateSlug } from '@/utils/string.util';
import { AppError, NotFoundError, ForbiddenError } from '@/utils/error.util';
import { HTTP_STATUS, COURSE_STATUS, USER_ROLES } from '@/lib/constants';
import type { Prisma, CourseStatus, CourseLevel } from '@prisma/client';

/**
 * Course Creation Data
 */
interface CreateCourseData {
  title: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  level: CourseLevel;
  language: string;
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
  sortOrder?: 'asc' | 'desc';
}

/**
 * Course Service
 * Handles course CRUD operations and management
 */
export class CourseService {
  /**
   * Create new course
   */
  async createCourse(mentorUserId: string, data: CreateCourseData) {
    // Get mentor profile
    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
    });

    if (!mentor) {
      throw new ForbiddenError('Only approved mentors can create courses');
    }

    if (mentor.status !== 'APPROVED') {
      throw new ForbiddenError('Your mentor profile must be approved first');
    }

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
        mentorId: mentor.id,
        title: data.title,
        slug,
        description: data.description,
        shortDescription: data.shortDescription,
        categoryId: data.categoryId,
        level: data.level,
        language: data.language,
        price: data.price,
        discountPrice: data.discountPrice,
        isFree: data.isFree,
        isPremium: data.isPremium,
        requirements: data.requirements || [],
        whatYouWillLearn: data.whatYouWillLearn,
        targetAudience: data.targetAudience || [],
        tags: data.tags || [],
        status: COURSE_STATUS.DRAFT,
      },
      include: {
        category: true,
        mentor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    return course;
  }

  /**
   * Get all courses with filters
   */
  async getAllCourses(filters: CourseListFilters = {}) {
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
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

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
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
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
      where.isFree = isFree;
    }

    if (isPremium !== undefined) {
      where.isPremium = isPremium;
    }

    if (mentorId) {
      where.mentorId = mentorId;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          shortDescription: true,
          level: true,
          language: true,
          price: true,
          discountPrice: true,
          isFree: true,
          isPremium: true,
          isFeatured: true,
          status: true,
          totalStudents: true,
          averageRating: true,
          totalReviews: true,
          totalDuration: true,
          totalLectures: true,
          publishedAt: true,
          createdAt: true,
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
      }),
      prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get course by ID with full details
   */
  async getCourseById(courseId: string, includePrivate = false) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        mentor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                profilePicture: true,
                bio: true,
              },
            },
          },
        },
        sections: {
          orderBy: { order: 'asc' },
          include: {
            materials: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                order: true,
                isFree: true,
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
      throw new NotFoundError('Course not found');
    }

    // Check if course is published (unless requesting private access)
    if (!includePrivate && course.status !== COURSE_STATUS.PUBLISHED) {
      throw new ForbiddenError('Course is not available');
    }

    return course;
  }

  /**
   * Get course by slug
   */
  async getCourseBySlug(slug: string, includePrivate = false) {
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        mentor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                profilePicture: true,
                bio: true,
              },
            },
          },
        },
        sections: {
          orderBy: { order: 'asc' },
          include: {
            materials: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                order: true,
                isFree: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    if (!includePrivate && course.status !== COURSE_STATUS.PUBLISHED) {
      throw new ForbiddenError('Course is not available');
    }

    // Increment view count
    await prisma.course.update({
      where: { id: course.id },
      data: { totalViews: { increment: 1 } },
    });

    return course;
  }

  /**
   * Update course
   */
  async updateCourse(courseId: string, userId: string, userRole: string, data: UpdateCourseData) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { mentor: { include: { user: true } } },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check permission (only mentor owner or admin)
    if (userRole !== USER_ROLES.ADMIN && course.mentor.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this course');
    }

    // Update slug if title changed
    const updateData = { ...data } as Prisma.CourseUpdateInput;

    if (data.title && data.title !== course.title) {
      let newSlug = generateSlug(data.title);

      // Check slug uniqueness
      const existingCourse = await prisma.course.findFirst({
        where: { slug: newSlug, NOT: { id: courseId } },
      });

      if (existingCourse) {
        newSlug = `${newSlug}-${Date.now()}`;
      }

      updateData.slug = newSlug;
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        category: true,
        mentor: {
          include: {
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

    return updated;
  }

  /**
   * Delete course
   */
  async deleteCourse(courseId: string, userId: string, userRole: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { mentor: true },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check permission
    if (userRole !== USER_ROLES.ADMIN && course.mentor.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this course');
    }

    // Check if course has enrollments
    const enrollmentCount = await prisma.enrollment.count({
      where: { courseId },
    });

    if (enrollmentCount > 0) {
      throw new AppError(
        'Cannot delete course with active enrollments. Archive it instead.',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return { id: courseId, deleted: true };
  }

  /**
   * Publish course
   */
  async publishCourse(courseId: string, userId: string, userRole: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { mentor: true, sections: { include: { materials: true } } },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check permission
    if (userRole !== USER_ROLES.ADMIN && course.mentor.userId !== userId) {
      throw new ForbiddenError('You do not have permission to publish this course');
    }

    // Validation: Course must have sections and materials
    if (course.sections.length === 0) {
      throw new AppError('Course must have at least one section', HTTP_STATUS.BAD_REQUEST);
    }

    const totalMaterials = course.sections.reduce(
      (sum, section) => sum + section.materials.length,
      0
    );

    if (totalMaterials === 0) {
      throw new AppError('Course must have at least one material', HTTP_STATUS.BAD_REQUEST);
    }

    // Update status to published
    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: COURSE_STATUS.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Archive course
   */
  async archiveCourse(courseId: string, userId: string, userRole: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { mentor: true },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check permission
    if (userRole !== USER_ROLES.ADMIN && course.mentor.userId !== userId) {
      throw new ForbiddenError('You do not have permission to archive this course');
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { status: COURSE_STATUS.ARCHIVED },
    });

    return updated;
  }

  /**
   * Get course statistics
   */
  async getCourseStatistics(courseId: string) {
    const [course, enrollmentStats, revenueStats] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
        select: {
          totalStudents: true,
          averageRating: true,
          totalReviews: true,
          totalViews: true,
        },
      }),

      prisma.enrollment.groupBy({
        by: ['status'],
        where: { courseId },
        _count: true,
      }),

      prisma.transaction.aggregate({
        where: {
          courseId,
          status: 'PAID',
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    return {
      ...course,
      enrollments: Object.fromEntries(enrollmentStats.map((stat) => [stat.status, stat._count])),
      revenue: {
        total: revenueStats._sum.totalAmount || 0,
        transactions: revenueStats._count,
      },
    };
  }
}

const courseService = new CourseService();
export default courseService;
