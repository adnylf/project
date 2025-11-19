import { Worker, Job } from 'bullmq';
import { certificateQueue } from '@/lib/queue';
import prisma from '@/lib/prisma';
import { generateCertificateNumber } from '@/utils/crypto.util';
import emailService from '@/services/email.service';
import notificationService from '@/services/notification.service';
import { logInfo, logError } from '@/utils/logger.util';
import { appConfig } from '@/config/app.config';

/**
 * Certificate Job Data
 */
interface CertificateJobData {
  enrollmentId: string;
  userId: string;
  courseId: string;
}

/**
 * Certificate Worker
 * Processes certificate generation jobs
 */
export const certificateWorker = new Worker<CertificateJobData>(
  'certificate',
  async (job: Job<CertificateJobData>) => {
    const { enrollmentId, userId, courseId } = job.data;

    logInfo(`Generating certificate for enrollment ${enrollmentId}`);

    try {
      // Get enrollment details
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          user: true,
          course: {
            include: {
              mentor: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      // Check if already has certificate
      if (enrollment.certificateId) {
        logInfo(`Certificate already exists for enrollment ${enrollmentId}`);
        return { success: true, certificateId: enrollment.certificateId };
      }

      // Generate certificate number
      const certificateNumber = generateCertificateNumber();

      // Create certificate record
      const certificate = await prisma.certificate.create({
        data: {
          userId,
          courseId,
          certificateNumber,
          status: 'ISSUED',
          issuedAt: new Date(),
          metadata: {
            courseName: enrollment.course.title,
            studentName: enrollment.user.name,
            mentorName: enrollment.course.mentor.user.name,
            completedAt: enrollment.completedAt,
          },
        },
      });

      // Update enrollment with certificate
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { certificateId: certificate.id },
      });

      // Generate certificate URL
      const certificateUrl = `${appConfig.url}/certificates/${certificate.id}`;

      // Send email notification
      await emailService.sendCertificateEmail(
        enrollment.user.email,
        enrollment.user.name,
        enrollment.course.title,
        certificateUrl
      );

      // Send in-app notification
      await notificationService.notifyCertificateIssued(
        userId,
        enrollment.course.title,
        certificate.id
      );

      logInfo(`Certificate generated successfully`, { certificateId: certificate.id });

      return {
        success: true,
        certificateId: certificate.id,
        certificateNumber: certificate.certificateNumber,
      };
    } catch (error) {
      logError(`Failed to generate certificate for enrollment ${enrollmentId}`, error);
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    concurrency: 3, // Process 3 certificates concurrently
  }
);

// Worker event handlers
certificateWorker.on('completed', (job) => {
  logInfo(`Certificate job completed`, { jobId: job.id });
});

certificateWorker.on('failed', (job, err) => {
  logError(`Certificate job failed`, { jobId: job?.id, error: err });
});

/**
 * Queue certificate generation
 */
export async function queueCertificateGeneration(
  enrollmentId: string,
  userId: string,
  courseId: string
): Promise<void> {
  await certificateQueue.add('generate-certificate', {
    enrollmentId,
    userId,
    courseId,
  } as any);
}

// Named export instead of anonymous default
const certificateWorkerModule = {
  worker: certificateWorker,
  queueCertificateGeneration,
};

export default certificateWorkerModule;
