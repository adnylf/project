import { NextRequest, NextResponse } from "next/server";
import transactionService from "@/services/transaction.service";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { errorHandler } from "@/middlewares/error.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/transactions/stats
 * Get transaction statistics
 */
async function getHandler(request: NextRequest, user: any) {
  try {
    // Jika user adalah admin, maka stats untuk semua transaksi. Jika bukan, hanya untuk user tersebut.
    const userId = user.role === "ADMIN" ? undefined : user.userId;

    const stats = await transactionService.getTransactionStats(userId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("GET transaction stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction statistics" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// Apply middlewares
async function authenticatedHandler(
  request: NextRequest
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  return getHandler(request, authResult);
}

export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedHandler))
);
