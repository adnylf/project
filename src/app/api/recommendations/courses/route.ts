import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

interface SimilarUser {
  user_id: string;
  common_courses: bigint;
  avg_progress: number;
}

interface EnrollmentData {
  course_id: string;
  progress: number;
  status: string;
  course: {
    category_id: string;
    level: string;
    tags: string[];
  };
}

interface CourseResult {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  short_description: string | null;
  level: string;
  price: number;
  discount_price: number | null;
  is_free: boolean;
  average_rating: number;
  total_students: number;
  total_reviews: number;
  tags: string[];
  category: {
    name: string;
    slug: string;
  } | null;
  mentor: {
    user: {
      full_name: string;
      avatar_url: string | null;
    };
  };
}

async function handler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const userProfile = (await prisma.enrollment.findMany({
      where: { user_id: user.userId },
      select: {
        course_id: true,
        progress: true,
        status: true,
        course: {
          select: {
            category_id: true,
            level: true,
            tags: true,
          },
        },
      },
    })) as EnrollmentData[];

    const similarUsers = await prisma.$queryRaw<SimilarUser[]>`
      SELECT 
        e2.user_id,
        COUNT(DISTINCT e2.course_id)::bigint as common_courses,
        AVG(e2.progress) as avg_progress
      FROM enrollments e1
      JOIN enrollments e2 ON e1.course_id = e2.course_id
      WHERE e1.user_id = ${user.userId}
        AND e2.user_id != ${user.userId}
        AND e2.status = 'ACTIVE'
      GROUP BY e2.user_id
      HAVING COUNT(DISTINCT e2.course_id) >= 2
      ORDER BY common_courses DESC, avg_progress DESC
      LIMIT 20
    `;

    const similarUserIds = similarUsers.map((u: SimilarUser) => u.user_id);

    const recommendedCourses = (await prisma.course.findMany({
      where: {
        status: "PUBLISHED",
        enrollments: {
          some: {
            user_id: { in: similarUserIds },
            status: { in: ["ACTIVE", "COMPLETED"] },
          },
        },
        NOT: {
          enrollments: {
            some: { user_id: user.userId },
          },
        },
      },
      take: limit,
      orderBy: [{ average_rating: "desc" }, { total_students: "desc" }],
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
        tags: true,
        category: {
          select: { name: true, slug: true },
        },
        mentor: {
          select: {
            user: {
              select: { full_name: true, avatar_url: true },
            },
          },
        },
      },
    })) as CourseResult[];

    if (recommendedCourses.length < limit) {
      const userCategories = [
        ...new Set(
          userProfile.map((e: EnrollmentData) => e.course.category_id)
        ),
      ];
      const userTags = [
        ...new Set(userProfile.flatMap((e: EnrollmentData) => e.course.tags)),
      ];

      const contentBasedCourses = (await prisma.course.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { category_id: { in: userCategories } },
            { tags: { hasSome: userTags } },
          ],
          NOT: {
            id: { in: recommendedCourses.map((c: CourseResult) => c.id) },
            enrollments: {
              some: { user_id: user.userId },
            },
          },
        },
        take: limit - recommendedCourses.length,
        orderBy: { average_rating: "desc" },
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
          tags: true,
          category: {
            select: { name: true, slug: true },
          },
          mentor: {
            select: {
              user: {
                select: { full_name: true, avatar_url: true },
              },
            },
          },
        },
      })) as CourseResult[];

      recommendedCourses.push(...contentBasedCourses);
    }

    return successResponse(
      {
        courses: recommendedCourses,
        algorithm: "collaborative_filtering",
        similarUsersCount: similarUserIds.length,
      },
      "Course recommendations retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get course recommendations",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply authentication
const authenticatedHandler = requireAuth(handler);

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
