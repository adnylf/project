import path from 'path';
import { videoProcessor } from '@/lib/video';
import { storage } from '@/lib/storage';
import { storageConfig } from '@/config/storage.config';
import { videoConfig } from '@/config/video.config';
import prisma from '@/lib/prisma';
import { generateUniqueFilename } from '@/utils/file.util';
import { AppError } from '@/utils/error.util';
import { HTTP_STATUS } from '@/lib/constants';
import type { VideoQuality, VideoProcessingOptions, VideoStatus } from '@/types/video.types';
import type { VideoQuality as PrismaVideoQuality } from '@prisma/client';

/**
 * Map VideoQuality to Prisma VideoQuality enum
 */
function mapToPrismaQuality(quality: VideoQuality): PrismaVideoQuality {
  const qualityMap: Record<VideoQuality, PrismaVideoQuality> = {
    '360p': 'Q360P',
    '480p': 'Q480P',
    '720p': 'Q720P',
    '1080p': 'Q1080P',
  };
  return qualityMap[quality];
}

/**
 * Video Response Interface
 */
interface VideoResponse {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  status: VideoStatus;
  thumbnail?: string;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Processing Status Response
 */
interface ProcessingStatusResponse {
  status: string;
  progress: number;
  error?: string;
}

/**
 * Video Service
 * Handles video upload, processing, and management
 */
export class VideoService {
  /**
   * Create video record in database
   */
  async createVideo(file: Express.Multer.File): Promise<VideoResponse> {
    const filename = generateUniqueFilename(file.originalname);
    const filePath = path.join('videos', 'originals', filename);

    // Save to storage
    if (file.buffer) {
      await storage.save(filePath, file.buffer);
    }

    // Get metadata
    const fullPath = path.join(storageConfig.local.basePath, filePath);
    const metadata = await videoProcessor.getMetadata(fullPath);

    // Create database record
    const video = await prisma.video.create({
      data: {
        originalName: file.originalname,
        filename,
        path: filePath,
        size: file.size,
        mimeType: file.mimetype, // Added required field
        status: 'PROCESSING',
        duration: Math.floor(metadata.duration),
      },
    });

    // Trigger background processing
    void this.processVideoInBackground(video.id, filePath);

    return {
      id: video.id,
      originalName: video.originalName,
      filename: video.filename,
      path: video.path,
      size: video.size,
      status: video.status as VideoStatus,
      duration: video.duration || undefined,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    };
  }

  /**
   * Process video in background
   */
  private async processVideoInBackground(videoId: string, inputPath: string): Promise<void> {
    try {
      // Process to multiple qualities
      await this.processVideo(videoId, inputPath, {
        qualities: videoConfig.resolutions
          .filter((r) => r.enabled)
          .map((r) => r.name as VideoQuality),
        generateThumbnails: true,
      });

      // Update status to completed
      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'COMPLETED' },
      });
    } catch (error) {
      console.error('Video processing error:', error);

      // Update status to failed
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'FAILED',
          processingError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Process video to multiple qualities
   */
  async processVideo(
    videoId: string,
    inputPath: string,
    options: VideoProcessingOptions = {}
  ): Promise<void> {
    const fullInputPath = path.join(storageConfig.local.basePath, inputPath);

    // Get qualities to process
    const qualities: VideoQuality[] = options.qualities || ['360p', '480p', '720p', '1080p'];

    // Process each quality
    for (const quality of qualities) {
      const outputFilename = `${videoId}.mp4`;
      const outputPath = path.join('videos', 'processed', quality, outputFilename);
      const fullOutputPath = path.join(storageConfig.local.basePath, outputPath);

      await videoProcessor.convertToQuality(fullInputPath, fullOutputPath, quality, (progress) => {
        console.log(`Processing ${quality}: ${progress.percent?.toFixed(2)}%`);
      });

      // Get file size
      const exists = await storage.exists(outputPath);
      if (exists) {
        const resolution = videoConfig.resolutions.find((r) => r.name === quality);
        // Create quality record with mapped enum
        await prisma.videoQuality_Model.create({
          data: {
            videoId,
            quality: mapToPrismaQuality(quality), // Use mapping function
            path: outputPath,
            size: 0, // Will be updated
            bitrate: resolution?.bitrate || '0k',
            resolution: `${resolution?.width}x${resolution?.height}`,
          },
        });
      }
    }

    // Generate thumbnails
    if (options.generateThumbnails) {
      await this.generateThumbnails(videoId, fullInputPath);
    }

    // Delete original if requested
    if (options.deleteOriginal) {
      await storage.delete(inputPath);
    }
  }

  /**
   * Generate video thumbnails
   */
  async generateThumbnails(videoId: string, inputPath: string): Promise<string[]> {
    const outputDir = path.join(storageConfig.local.basePath, 'videos', 'thumbnails');

    const thumbnails = await videoProcessor.generateThumbnails(inputPath, outputDir, {
      count: videoConfig.thumbnails.count,
      size: videoConfig.thumbnails.size,
      format: videoConfig.thumbnails.format as 'jpg',
      quality: videoConfig.thumbnails.quality,
    });

    // Update database with first thumbnail
    if (thumbnails.length > 0) {
      const thumbnailPath = path.relative(storageConfig.local.basePath, thumbnails[0]);

      await prisma.video.update({
        where: { id: videoId },
        data: { thumbnail: thumbnailPath },
      });
    }

    return thumbnails.map((thumbnail: string) =>
      path.relative(storageConfig.local.basePath, thumbnail)
    );
  }

  /**
   * Get video by ID
   */
  async getVideoById(videoId: string): Promise<VideoResponse | null> {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        qualities: true,
      },
    });

    if (!video) {
      return null;
    }

    return {
      id: video.id,
      originalName: video.originalName,
      filename: video.filename,
      path: video.path,
      size: video.size,
      status: video.status as VideoStatus,
      thumbnail: video.thumbnail || undefined,
      duration: video.duration || undefined,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    };
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(videoId: string): Promise<{
    duration: number;
    width: number;
    height: number;
    bitrate: string;
    codec: string;
    format: string;
    size: number;
    fps: number;
  } | null> {
    const video = await this.getVideoById(videoId);

    if (!video) {
      return null;
    }

    const fullPath = path.join(storageConfig.local.basePath, video.path);
    return videoProcessor.getMetadata(fullPath);
  }

  /**
   * Delete video and all related files
   */
  async deleteVideo(videoId: string): Promise<void> {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { qualities: true },
    });

    if (!video) {
      throw new AppError('Video not found', HTTP_STATUS.NOT_FOUND);
    }

    // Delete original
    await storage.delete(video.path);

    // Delete all quality versions
    for (const quality of video.qualities) {
      await storage.delete(quality.path);
    }

    // Delete thumbnail
    if (video.thumbnail) {
      await storage.delete(video.thumbnail);
    }

    // Delete database record
    await prisma.video.delete({
      where: { id: videoId },
    });
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(videoId: string): Promise<ProcessingStatusResponse> {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { qualities: true },
    });

    if (!video) {
      throw new AppError('Video not found', HTTP_STATUS.NOT_FOUND);
    }

    const totalQualities = videoConfig.resolutions.filter((r) => r.enabled).length;
    const completedQualities = video.qualities.length;
    const progress = (completedQualities / totalQualities) * 100;

    return {
      status: video.status,
      progress,
      error: video.processingError || undefined,
    };
  }
}

const videoService = new VideoService();
export default videoService;
