import prisma from "@/lib/prisma";
import { logError, logInfo } from "@/utils/logger.util";
import {
  generateCertificateNumber,
  generateVerificationCode,
} from "@/utils/crypto.util";
import { AppError, NotFoundError, ValidationError } from "@/utils/error.util";
import { HTTP_STATUS } from "@/lib/constants";

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_number: string;
  status: string;
  issued_at: Date | null;
  revoked_at: Date | null;
  revoke_reason: string | null;
  pdf_url: string | null;
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

export interface CertificateData {
  user_name: string;
  user_email: string;
  course_title: string;
  course_description: string;
  instructor_name: string;
  completion_date: Date;
  duration_hours: number;
  certificate_number: string;
  verification_code: string;
}

export interface CertificateVerificationResult {
  valid: boolean;
  certificate?: Certificate;
  message: string;
}

export interface CertificateStats {
  total_issued: number;
  issued_this_month: number;
  issued_today: number;
}

class CertificateService {
  /**
   * Check if certificate already exists
   */
  async getCertificateByEnrollment(
    userId: string,
    courseId: string
  ): Promise<Certificate | null> {
    try {
      logInfo("Checking existing certificate", { userId, courseId });

      const certificate = await prisma.certificate.findFirst({
        where: {
          user_id: userId,
          course_id: courseId,
          status: "ISSUED",
        },
      });

      return certificate as Certificate | null;
    } catch (error) {
      logError("Get certificate by enrollment error", error);
      throw new AppError(
        "Failed to check certificate",
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate new certificate
   */
  async generateCertificate(
    userId: string,
    courseId: string,
    completedAt: Date
  ): Promise<Certificate> {
    try {
      logInfo("Generating certificate", { userId, courseId });

      // Check if certificate already exists
      const existing = await this.getCertificateByEnrollment(userId, courseId);
      if (existing) {
        logInfo("Certificate already exists, returning existing", {
          certificateId: existing.id,
        });
        return existing;
      }

      // Get course and user details for validation
      const [course, user, enrollment] = await Promise.all([
        prisma.course.findUnique({
          where: { id: courseId },
          include: {
            mentor: {
              include: {
                user: {
                  select: {
                    full_name: true,
                  },
                },
              },
            },
          },
        }),
        prisma.user.findUnique({
          where: { id: userId },
        }),
        prisma.enrollment.findFirst({
          where: {
            user_id: userId,
            course_id: courseId,
            status: "COMPLETED",
          },
        }),
      ]);

      if (!course) {
        throw new NotFoundError("Course not found");
      }

      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (!enrollment) {
        throw new AppError(
          "Course must be completed to generate certificate",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Generate certificate identifiers
      const certificateNumber = generateCertificateNumber();
      const verificationCode = generateVerificationCode(
        userId,
        courseId,
        certificateNumber
      );

      // Create certificate record
      const certificate = await prisma.certificate.create({
        data: {
          user_id: userId,
          course_id: courseId,
          certificate_number: certificateNumber,
          status: "ISSUED",
          issued_at: new Date(),
          metadata: {
            verification_code: verificationCode,
            completed_at: completedAt,
            course_title: course.title,
            user_name: user.full_name,
            instructor_name: course.mentor.user.full_name,
          },
        },
        include: {
          user: {
            select: {
              full_name: true,
              email: true,
            },
          },
          course: {
            select: {
              title: true,
              description: true,
              total_duration: true,
              mentor: {
                include: {
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
      });

      logInfo("Certificate created successfully", {
        certificateId: certificate.id,
      });

      // Update enrollment with certificate
      await prisma.enrollment.updateMany({
        where: {
          user_id: userId,
          course_id: courseId,
        },
        data: {
          certificate_id: certificate.id,
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          user_id: userId,
          title: "Certificate Ready",
          message: `Congratulations! Your certificate for "${course.title}" is now available.`,
          type: "CERTIFICATE_ISSUED",
          status: "UNREAD",
          data: {
            certificate_id: certificate.id,
            course_title: course.title,
            certificate_number: certificateNumber,
          },
        },
      });

      // Generate PDF (async - don't block response)
      this.generateCertificatePDF(certificate.id).catch((error) => {
        logError("PDF generation error", error);
      });

      return certificate as Certificate;
    } catch (error) {
      logError("Generate certificate error", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to generate certificate",
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate certificate PDF
   */
  private async generateCertificatePDF(
    certificateId: string
  ): Promise<string | null> {
    try {
      logInfo("Generating certificate PDF", { certificateId });

      // Get certificate data
      const data = await this.getCertificateData(certificateId);
      if (!data) {
        throw new Error("Certificate data not found");
      }

      // Generate PDF using a library like PDFKit or Puppeteer
      const pdfContent = await this.createPDFContent(data);

      // Upload to storage (S3, Cloudinary, etc.)
      const pdfUrl = await this.uploadPDF(certificateId, pdfContent);

      // Update certificate with PDF URL
      await prisma.certificate.update({
        where: { id: certificateId },
        data: { pdf_url: pdfUrl },
      });

      logInfo("PDF generated and uploaded successfully", {
        certificateId,
        pdfUrl,
      });
      return pdfUrl;
    } catch (error) {
      logError("Generate PDF error", error);
      return null;
    }
  }

  /**
   * Create PDF content (placeholder - implement with actual PDF library)
   */
  private async createPDFContent(data: CertificateData): Promise<Buffer> {
    // This is a placeholder. In production, use:
    // - PDFKit: for programmatic PDF generation
    // - Puppeteer: for HTML to PDF conversion
    // - pdf-lib: for PDF manipulation

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Georgia', serif;
              text-align: center;
              padding: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .certificate {
              background: white;
              padding: 60px;
              border: 10px solid gold;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { font-size: 48px; color: #333; margin-bottom: 20px; }
            h2 { font-size: 32px; color: #666; margin: 30px 0; }
            .name { font-size: 40px; color: #667eea; font-weight: bold; }
            .course { font-size: 28px; color: #333; margin: 20px 0; }
            .details { font-size: 16px; color: #666; margin-top: 40px; }
            .code { font-size: 14px; color: #999; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="certificate">
            <h1>Certificate of Completion</h1>
            <p>This certifies that</p>
            <div class="name">${data.user_name}</div>
            <p>has successfully completed the course</p>
            <div class="course">${data.course_title}</div>
            <p>on ${data.completion_date.toLocaleDateString()}</p>
            <div class="details">
              <p>Course Duration: ${data.duration_hours} hours</p>
              <p>Instructor: ${data.instructor_name}</p>
            </div>
            <div class="code">
              <p>Certificate Number: ${data.certificate_number}</p>
              <p>Verification Code: ${data.verification_code}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Convert HTML to PDF buffer (placeholder)
    // In production, use: PDFKit, Puppeteer, or other PDF generation libraries
    return Buffer.from(htmlTemplate);
  }

  /**
   * Upload PDF to storage
   */
  private async uploadPDF(
    certificateId: string,
    _content: Buffer
  ): Promise<string> {
    // Placeholder - implement actual upload to S3, Cloudinary, etc.
    // For now, return a mock URL
    return `https://storage.example.com/certificates/${certificateId}.pdf`;
  }

  /**
   * Get certificate data for PDF generation
   */
  async getCertificateData(
    certificateId: string
  ): Promise<CertificateData | null> {
    try {
      const certificate = await prisma.certificate.findUnique({
        where: { id: certificateId },
        include: {
          user: {
            select: {
              full_name: true,
              email: true,
            },
          },
          course: {
            select: {
              title: true,
              description: true,
              total_duration: true,
              mentor: {
                include: {
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
      });

      if (!certificate) {
        return null;
      }

      // Extract verification code from metadata
      const verificationCode =
        (certificate.metadata as any)?.verification_code ||
        this.generateVerificationCodeFromCertificate(
          certificate.certificate_number
        );

      return {
        user_name: certificate.user.full_name,
        user_email: certificate.user.email,
        course_title: certificate.course.title,
        course_description: certificate.course.description || "",
        instructor_name: certificate.course.mentor.user.full_name,
        completion_date: certificate.issued_at || new Date(),
        duration_hours: Math.ceil(certificate.course.total_duration / 60), // Convert minutes to hours
        certificate_number: certificate.certificate_number,
        verification_code: verificationCode,
      };
    } catch (error) {
      logError("Get certificate data error", error);
      return null;
    }
  }

  /**
   * Get certificate by ID
   */
  async getCertificateById(certificateId: string): Promise<Certificate | null> {
    try {
      const certificate = await prisma.certificate.findUnique({
        where: { id: certificateId },
        include: {
          user: {
            select: {
              full_name: true,
              email: true,
            },
          },
          course: {
            select: {
              title: true,
              thumbnail: true,
              mentor: {
                include: {
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
      });

      return certificate as Certificate | null;
    } catch (error) {
      logError("Get certificate by ID error", error);
      throw new AppError(
        "Failed to get certificate",
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(
    certificateNumber: string,
    verificationCode: string
  ): Promise<CertificateVerificationResult> {
    try {
      const certificate = await prisma.certificate.findFirst({
        where: {
          certificate_number: certificateNumber,
          status: "ISSUED",
        },
        include: {
          user: {
            select: {
              full_name: true,
            },
          },
          course: {
            select: {
              title: true,
              description: true,
            },
          },
        },
      });

      if (!certificate) {
        return {
          valid: false,
          message: "Certificate not found or has been revoked",
        };
      }

      // Verify code using metadata or generated code
      const isValid = await this.validateCertificateVerification(
        certificateNumber,
        verificationCode,
        certificate
      );

      if (!isValid) {
        return {
          valid: false,
          message: "Invalid verification code",
        };
      }

      return {
        valid: true,
        certificate: certificate as Certificate,
        message: "Certificate is valid",
      };
    } catch (error) {
      logError("Verify certificate error", error);
      return {
        valid: false,
        message: "Verification failed",
      };
    }
  }

  /**
   * Validate certificate verification
   */
  private async validateCertificateVerification(
    certificateNumber: string,
    verificationCode: string,
    certificate: any
  ): Promise<boolean> {
    try {
      // Check if verification code exists in metadata
      const metadataCode = (certificate.metadata as any)?.verification_code;
      if (metadataCode && metadataCode === verificationCode.toUpperCase()) {
        return true;
      }

      // Fallback: generate expected code and compare
      const expectedCode =
        this.generateVerificationCodeFromCertificate(certificateNumber);
      return verificationCode.toUpperCase() === expectedCode;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate verification code from certificate number
   */
  private generateVerificationCodeFromCertificate(
    certificateNumber: string
  ): string {
    // Simple implementation - in production use more secure method
    return certificateNumber.slice(-8).toUpperCase();
  }

  /**
   * Get user certificates
   */
  async getUserCertificates(
    userId: string,
    filters?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ certificates: Certificate[]; total: number }> {
    try {
      const limit = filters?.limit || 10;
      const offset = filters?.offset || 0;

      const [certificates, total] = await Promise.all([
        prisma.certificate.findMany({
          where: {
            user_id: userId,
            status: "ISSUED",
          },
          include: {
            course: {
              select: {
                title: true,
                thumbnail: true,
                mentor: {
                  include: {
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
          orderBy: {
            issued_at: "desc",
          },
          skip: offset,
          take: limit,
        }),
        prisma.certificate.count({
          where: {
            user_id: userId,
            status: "ISSUED",
          },
        }),
      ]);

      return {
        certificates: certificates as Certificate[],
        total,
      };
    } catch (error) {
      logError("Get user certificates error", error);
      return { certificates: [], total: 0 };
    }
  }

  /**
   * Revoke certificate
   */
  async revokeCertificate(
    certificateId: string,
    reason: string
  ): Promise<boolean> {
    try {
      await prisma.certificate.update({
        where: { id: certificateId },
        data: {
          status: "REVOKED",
          revoke_reason: reason,
          revoked_at: new Date(),
        },
      });

      // Get certificate for notification
      const certificate = await this.getCertificateById(certificateId);
      if (certificate) {
        await prisma.notification.create({
          data: {
            user_id: certificate.user_id,
            title: "Certificate Revoked",
            message: `Your certificate has been revoked. Reason: ${reason}`,
            type: "SYSTEM_ANNOUNCEMENT",
            status: "UNREAD",
            data: {
              certificate_id: certificateId,
              revoke_reason: reason,
            },
          },
        });
      }

      logInfo("Certificate revoked successfully", { certificateId, reason });
      return true;
    } catch (error) {
      logError("Revoke certificate error", error);
      return false;
    }
  }

  /**
   * Get certificate statistics
   */
  async getCertificateStats(): Promise<CertificateStats> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      const [total_issued, issued_this_month, issued_today] = await Promise.all(
        [
          prisma.certificate.count({
            where: { status: "ISSUED" },
          }),
          prisma.certificate.count({
            where: {
              status: "ISSUED",
              issued_at: {
                gte: startOfMonth,
              },
            },
          }),
          prisma.certificate.count({
            where: {
              status: "ISSUED",
              issued_at: {
                gte: startOfToday,
              },
            },
          }),
        ]
      );

      return {
        total_issued,
        issued_this_month,
        issued_today,
      };
    } catch (error) {
      logError("Get certificate stats error", error);
      return {
        total_issued: 0,
        issued_this_month: 0,
        issued_today: 0,
      };
    }
  }

  /**
   * Get certificate by enrollment ID
   */
  async getCertificateByEnrollmentId(
    enrollmentId: string
  ): Promise<Certificate | null> {
    try {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          certificate: true,
        },
      });

      return enrollment?.certificate as Certificate | null;
    } catch (error) {
      logError("Get certificate by enrollment ID error", error);
      throw new AppError(
        "Failed to get certificate",
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Check if user can generate certificate for course
   */
  async canGenerateCertificate(
    userId: string,
    courseId: string
  ): Promise<boolean> {
    try {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          user_id: userId,
          course_id: courseId,
          status: "COMPLETED",
        },
      });

      return !!enrollment;
    } catch (error) {
      logError("Check certificate generation eligibility error", error);
      return false;
    }
  }

  /**
   * Bulk generate certificates for completed enrollments
   */
  async generateCertificatesForCompletedEnrollments(): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    try {
      // Find all completed enrollments without certificates
      const enrollments = await prisma.enrollment.findMany({
        where: {
          status: "COMPLETED",
          certificate_id: null,
        },
        include: {
          user: true,
          course: true,
        },
      });

      let success = 0;
      let failed = 0;

      for (const enrollment of enrollments) {
        try {
          await this.generateCertificate(
            enrollment.user_id,
            enrollment.course_id,
            enrollment.completed_at || new Date()
          );
          success++;
        } catch (error) {
          const errorMessage = `Failed to generate certificate for enrollment (Enrollment ID: ${enrollment.id})`;
          logError(errorMessage, error);
          failed++;
        }
      }

      return {
        success,
        failed,
        total: enrollments.length,
      };
    } catch (error) {
      logError("Bulk generate certificates error", error);
      return {
        success: 0,
        failed: 0,
        total: 0,
      };
    }
  }

  /**
   * Generate verification code (public method for external use)
   */
  generateVerificationCode(
    userId: string,
    courseId: string,
    certificateNumber: string
  ): string {
    return generateVerificationCode(userId, courseId, certificateNumber);
  }
}

const certificateService = new CertificateService();
export default certificateService;
