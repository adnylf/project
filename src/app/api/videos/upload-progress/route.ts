import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { errorHandler } from "@/middlewares/error.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";

/**
 * GET /api/videos/upload-progress
 * Real-time upload progress using Server-Sent Events
 */
async function handler(
  request: NextRequest,
  context: { user: { userId: string; email: string; role: string } }
): Promise<NextResponse> {
  const { user } = context;

  // Get videoId from query
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return new NextResponse("Video ID required", { status: 400 });
  }

  // Create SSE response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Function to send SSE message
      const sendMessage = (data: Record<string, unknown>) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Poll video status every 2 seconds
      const interval = setInterval(async () => {
        try {
          const video = await prisma.video.findUnique({
            where: { id: videoId },
            select: {
              status: true,
              processing_error: true,
              qualities: {
                select: {
                  quality: true,
                },
              },
            },
          });

          if (!video) {
            sendMessage({ error: "Video not found" });
            clearInterval(interval);
            controller.close();
            return;
          }

          // Calculate progress (rough estimate)
          const targetQualities = 4; // 360p, 480p, 720p, 1080p
          const completedQualities = video.qualities.length;
          const progress = (completedQualities / targetQualities) * 100;

          sendMessage({
            status: video.status,
            progress: Math.min(progress, 100),
            completedQualities,
            targetQualities,
            error: video.processing_error,
          });

          // Stop polling if completed or failed
          if (video.status === "COMPLETED" || video.status === "FAILED") {
            clearInterval(interval);
            controller.close();
          }
        } catch (error) {
          sendMessage({
            error: error instanceof Error ? error.message : "Unknown error",
          });
          clearInterval(interval);
          controller.close();
        }
      }, 2000); // Poll every 2 seconds

      // Cleanup on connection close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Apply authentication
const authenticatedHandler = requireAuth(handler);

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
