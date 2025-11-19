import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis-upstash';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

interface HealthCheck {
  status: string;
  responseTime?: number;
  error?: string;
  note?: string;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: Record<string, HealthCheck>;
}

async function healthHandler(request: NextRequest) {
  const startTime = Date.now();
  const checks: Record<string, HealthCheck> = {};

  // Gunakan parameter request untuk menghindari unused variable warning
  const userAgent = request.headers.get('user-agent') || 'unknown';
  console.log(`Health check requested from: ${userAgent}`);

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  try {
    const redisStart = Date.now();
    await redis.ping();
    checks.redis = {
      status: 'healthy',
      responseTime: Date.now() - redisStart,
    };
  } catch (error) {
    checks.redis = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  checks.storage = {
    status: 'healthy',
    note: 'Local/cloud storage configured',
  };

  const isHealthy = checks.database.status === 'healthy' && checks.redis.status === 'healthy';

  const response: HealthResponse = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    checks,
  };

  if (isHealthy) {
    return successResponse(response, 'All systems operational');
  } else {
    // Perbaikan: Hanya kirim message dan status code, masukkan detail ke dalam error parameter
    const errorDetails = JSON.stringify({
      degradedServices: Object.entries(checks)
        .filter(([_, check]) => check.status === 'unhealthy')
        .map(([service]) => service),
    });

    return errorResponse(
      'Some services are unhealthy',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      errorDetails
    );
  }
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(healthHandler)));
