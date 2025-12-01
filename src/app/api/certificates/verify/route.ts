import { NextRequest } from "next/server";
import certificateService from "@/services/certificate.service";
import { successResponse, errorResponse } from "@/utils/response.util";
import { errorHandler } from "@/middlewares/error.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

async function verifyHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { certificate_number, verification_code } = body;

    if (!certificate_number || !verification_code) {
      return errorResponse(
        "Certificate number and verification code are required",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const result = await certificateService.verifyCertificate(
      certificate_number,
      verification_code
    );

    if (!result.valid) {
      return successResponse(
        {
          success: false,
          valid: false,
          message: result.message,
        },
        "Certificate verification failed"
      );
    }

    // Type guard to ensure certificate exists
    if (!result.certificate) {
      return successResponse(
        {
          success: false,
          valid: false,
          message: "Certificate not found",
        },
        "Certificate verification failed"
      );
    }

    // Perbaikan: Akses property yang sesuai dengan model Prisma
    const certificate = await certificateService.getCertificateById(
      result.certificate.id
    );

    if (!certificate) {
      return successResponse(
        {
          success: false,
          valid: false,
          message: "Certificate details not found",
        },
        "Certificate verification failed"
      );
    }

    // Get additional details for response
    const certificateData = await certificateService.getCertificateData(
      certificate.id
    );

    return successResponse(
      {
        success: true,
        valid: true,
        message: result.message,
        data: {
          userName: certificateData?.user_name || "Unknown User",
          courseTitle: certificateData?.course_title || "Unknown Course",
          issuedAt: certificate.issued_at,
          // PERBAIKAN: Hapus completed_at jika tidak ada di model
          // completedAt: certificate.completed_at,
        },
      },
      "Certificate verified successfully"
    );
  } catch (error) {
    console.error("Verify certificate error:", error);
    return errorResponse(
      "Verification failed",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = errorHandler(
  loggingMiddleware(corsMiddleware(verifyHandler))
);
