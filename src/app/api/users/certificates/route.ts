import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { paginatedResponse, errorResponse } from "@/utils/response.util";
import { validatePagination } from "@/utils/validation.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/users/certificates
 * Get user certificates
 */
async function handler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
) {
  const { user } = context;

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Validate pagination
    const validatedPagination = validatePagination(page, limit);

    // Calculate skip
    const skip = (validatedPagination.page - 1) * validatedPagination.limit;

    // Get certificates
    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where: {
          user_id: user.userId,
          status: "ISSUED", // Only show issued certificates
        },
        skip,
        take: validatedPagination.limit,
        orderBy: { issued_at: "desc" },
        select: {
          id: true,
          certificate_number: true,
          status: true,
          issued_at: true,
          pdf_url: true,
          enrollment: {
            select: {
              course: {
                select: {
                  id: true,
                  title: true,
                  thumbnail: true,
                  mentor: {
                    select: {
                      user: {
                        select: {
                          full_name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.certificate.count({
        where: {
          user_id: user.userId,
          status: "ISSUED",
        },
      }),
    ]);

    return paginatedResponse(
      certificates,
      {
        page: validatedPagination.page,
        limit: validatedPagination.limit,
        total,
      },
      "Certificates retrieved successfully"
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse(
      "Failed to get certificates",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply authentication
const authenticatedHandler = requireAuth(handler);

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
