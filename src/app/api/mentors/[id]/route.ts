import { NextRequest } from 'next/server';
import mentorService from '@/services/mentor.service';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * GET /api/mentors/:id
 * Get mentor details by ID
 */
async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get mentor details
    const mentor = await mentorService.getMentorById(id);

    return successResponse(mentor, 'Mentor retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    return errorResponse('Failed to get mentor', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Properly typed export
export const GET = (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  errorHandler((req: NextRequest) =>
    loggingMiddleware((req2: NextRequest) =>
      corsMiddleware((req3: NextRequest) => handler(req3, context))(req2)
    )(req)
  )(request);
