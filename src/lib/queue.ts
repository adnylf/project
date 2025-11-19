import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { redis } from './redis-upstash';
import { logInfo, logError, logWarn } from '@/utils/logger.util';

/**
 * Queue Configuration
 */
const queueConfig = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 500,
      age: 7 * 24 * 3600, // 7 days
    },
  },
};

/**
 * Job Types
 */
export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface VideoProcessingJob {
  videoId: string;
  inputPath: string;
  outputQualities: string[];
}

export interface CertificateGenerationJob {
  enrollmentId: string;
  userId: string;
  courseId: string;
}

export interface NotificationJob {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface AnalyticsJob {
  eventType: string;
  userId?: string;
  data: Record<string, any>;
}

/**
 * Queue Manager
 */
export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private events: Map<string, QueueEvents> = new Map();

  /**
   * Create or get queue
   */
  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: queueConfig.connection,
        defaultJobOptions: queueConfig.defaultJobOptions,
      });

      this.queues.set(name, queue);
      this.setupQueueEvents(name, queue);
    }

    return this.queues.get(name)!;
  }

  /**
   * Create worker for queue
   */
  createWorker<T>(
    name: string,
    processor: (job: Job<T>) => Promise<any>,
    options?: {
      concurrency?: number;
      limiter?: {
        max: number;
        duration: number;
      };
    }
  ): Worker {
    if (this.workers.has(name)) {
      return this.workers.get(name)!;
    }

    const worker = new Worker<T>(name, processor, {
      connection: queueConfig.connection,
      concurrency: options?.concurrency || 5,
      limiter: options?.limiter,
    });

    this.workers.set(name, worker);
    this.setupWorkerEvents(name, worker);

    return worker;
  }

  /**
   * Setup queue events
   */
  private setupQueueEvents(name: string, queue: Queue) {
    const queueEvents = new QueueEvents(name, {
      connection: queueConfig.connection,
    });

    queueEvents.on('completed', ({ jobId }) => {
      logInfo(`Job completed in queue ${name}`, { jobId });
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      logError(`Job failed in queue ${name}`, { jobId, failedReason });
    });

    queueEvents.on('progress', ({ jobId, data }) => {
      logInfo(`Job progress in queue ${name}`, { jobId, progress: data });
    });

    this.events.set(name, queueEvents);
  }

  /**
   * Setup worker events
   */
  private setupWorkerEvents(name: string, worker: Worker) {
    worker.on('completed', (job) => {
      logInfo(`Worker completed job in queue ${name}`, {
        jobId: job.id,
        duration: Date.now() - job.timestamp,
      });
    });

    worker.on('failed', (job, error) => {
      logError(`Worker failed job in queue ${name}`, {
        jobId: job?.id,
        error: error.message,
      });
    });

    worker.on('error', (error) => {
      logError(`Worker error in queue ${name}`, error);
    });
  }

  /**
   * Add job to queue
   */
  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: {
      priority?: number;
      delay?: number;
      attempts?: number;
      removeOnComplete?: boolean;
    }
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);

    const job = await queue.add(jobName, data, {
      priority: options?.priority,
      delay: options?.delay,
      attempts: options?.attempts,
      removeOnComplete: options?.removeOnComplete,
    });

    logInfo(`Job added to queue ${queueName}`, {
      jobId: job.id,
      jobName,
    });

    return job;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string) {
    const queue = this.getQueue(queueName);

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    logInfo(`Queue ${queueName} paused`);
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    logInfo(`Queue ${queueName} resumed`);
  }

  /**
   * Clean queue
   */
  async cleanQueue(queueName: string, grace: number = 1000, limit: number = 1000): Promise<number> {
    const queue = this.getQueue(queueName);

    const cleaned = await Promise.all([
      queue.clean(grace, limit, 'completed'),
      queue.clean(grace, limit, 'failed'),
    ]);

    const total = cleaned.reduce((sum, jobs) => sum + jobs.length, 0);

    logInfo(`Queue ${queueName} cleaned`, { removed: total });
    return total;
  }

  /**
   * Drain queue (remove all jobs)
   */
  async drainQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.drain();
    logInfo(`Queue ${queueName} drained`);
  }

  /**
   * Close queue and worker
   */
  async closeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    const worker = this.workers.get(queueName);
    const events = this.events.get(queueName);

    if (queue) {
      await queue.close();
      this.queues.delete(queueName);
    }

    if (worker) {
      await worker.close();
      this.workers.delete(queueName);
    }

    if (events) {
      await events.close();
      this.events.delete(queueName);
    }

    logInfo(`Queue ${queueName} closed`);
  }

  /**
   * Close all queues and workers
   */
  async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];

    for (const [name] of this.queues) {
      closePromises.push(this.closeQueue(name));
    }

    await Promise.all(closePromises);
    logInfo('All queues closed');
  }
}

// Create singleton instance
export const queueManager = new QueueManager();

// ============================================
// Predefined Queues
// ============================================

// Email Queue
export const emailQueue = queueManager.getQueue('email');

// Video Processing Queue
export const videoQueue = queueManager.getQueue('video-processing');

// Certificate Queue
export const certificateQueue = queueManager.getQueue('certificate');

// Notification Queue
export const notificationQueue = queueManager.getQueue('notification');

// Analytics Queue
export const analyticsQueue = queueManager.getQueue('analytics');

// ============================================
// Queue Helper Functions
// ============================================

export async function addEmailJob(data: EmailJob, priority?: number) {
  return queueManager.addJob('email', 'send-email', data, { priority });
}

export async function addVideoProcessingJob(data: VideoProcessingJob) {
  return queueManager.addJob('video-processing', 'process-video', data, {
    priority: 5,
    attempts: 2,
  });
}

export async function addCertificateJob(data: CertificateGenerationJob) {
  return queueManager.addJob('certificate', 'generate-certificate', data, {
    priority: 7,
  });
}

export async function addNotificationJob(data: NotificationJob) {
  return queueManager.addJob('notification', 'send-notification', data, {
    priority: 8,
  });
}

export async function addAnalyticsJob(data: AnalyticsJob) {
  return queueManager.addJob('analytics', 'track-event', data, {
    priority: 3,
    attempts: 1,
  });
}
