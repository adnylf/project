import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

interface CourseData {
  mentor_id: string;
  category_id: string;
  level: string;
}

async function handler(
  request: NextRequest,
  context: { user?: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    if (user) {
      const userEnrollments = await prisma.enrollment.findMany({
        where: { user_id: user.userId },
        select: {
          course: {
            select: {
              mentor_id: true,
              category_id: true,
              level: true,
            },
          },
        },
      });

      const enrolledMentorIds = userEnrollments.map(
        (e: any) => e.course.mentor_id
      );
      const preferredCategories = [
        ...new Set(userEnrollments.map((e: any) => e.course.category_id)),
      ];

      const recommendedMentors = await prisma.mentorProfile.findMany({
        where: {
          status: "APPROVED",
          id: { notIn: enrolledMentorIds },
          courses: {
            some: {
              category_id: { in: preferredCategories },
              status: "PUBLISHED",
            },
          },
        },
        take: limit,
        orderBy: [{ average_rating: "desc" }, { total_students: "desc" }],
        select: {
          id: true,
          bio: true,
          headline: true,
          expertise: true,
          experience: true,
          average_rating: true,
          total_students: true,
          total_courses: true,
          total_reviews: true,
          user: {
            select: {
              full_name: true,
              avatar_url: true,
            },
          },
          courses: {
            where: { status: "PUBLISHED" },
            take: 3,
            select: {
              id: true,
              title: true,
              thumbnail: true,
              average_rating: true,
            },
          },
        },
      });

      return successResponse(
        {
          mentors: recommendedMentors,
          reason: "Based on your enrolled courses",
        },
        "Mentor recommendations retrieved successfully"
      );
    }

    const topMentors = await prisma.mentorProfile.findMany({
      where: {
        status: "APPROVED",
        total_courses: { gt: 0 },
      },
      take: limit,
      orderBy: [{ average_rating: "desc" }, { total_students: "desc" }],
      select: {
        id: true,
        bio: true,
        headline: true,
        expertise: true,
        experience: true,
        average_rating: true,
        total_students: true,
        total_courses: true,
        total_reviews: true,
        user: {
          select: {
            full_name: true,
            avatar_url: true,
          },
        },
        courses: {
          where: { status: "PUBLISHED" },
          take: 3,
          select: {
            id: true,
            title: true,
            thumbnail: true,
            average_rating: true,
          },
        },
      },
    });

    return successResponse(
      {
        mentors: topMentors,
        reason: "Top rated mentors",
      },
      "Mentor recommendations retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get mentor recommendations",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Optional authentication - user parameter is optional
const optionalAuthHandler = async (request: NextRequest) => {
  try {
    // Try to get authenticated user, but don't require it
    const authHandler = requireAuth(handler);
    return authHandler(request);
  } catch {
    // If authentication fails, call handler without user
    // PERBAIKAN: Kirim context kosong sebagai parameter kedua
    return handler(request, {});
  }
};

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(optionalAuthHandler))
);
