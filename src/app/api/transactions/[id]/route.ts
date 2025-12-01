import { NextRequest, NextResponse } from "next/server";
import transactionService from "@/services/transaction.service";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { errorHandler } from "@/middlewares/error.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/transactions/:id
 * Get transaction by ID
 */
async function getHandler(
  request: NextRequest,
  user: any,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await context.params;

    // Get transaction details
    const transaction = await transactionService.getTransactionById(
      transactionId,
      user.userId
    );

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Check if transaction is expired and update status
    if (
      transaction.status === "PENDING" &&
      transaction.expiredAt &&
      new Date(transaction.expiredAt) < new Date()
    ) {
      await transactionService.updateTransactionStatus(
        transactionId,
        "EXPIRED"
      );
      transaction.status = "EXPIRED";
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("GET transaction detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction details" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * PATCH /api/transactions/:id
 * Update transaction (cancel, confirm, reject)
 */
async function patchHandler(
  request: NextRequest,
  user: any,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await context.params;
    const body = await request.json();
    const { action } = body;

    // Get transaction
    const transaction = await transactionService.getTransactionById(
      transactionId,
      user.userId
    );

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Handle different actions
    if (action === "cancel") {
      // Only allow canceling pending transactions
      if (transaction.status !== "PENDING") {
        return NextResponse.json(
          { error: "Can only cancel pending transactions" },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }

      const updatedTransaction = await transactionService.cancelTransaction(
        transactionId,
        user.userId
      );

      return NextResponse.json({
        success: true,
        data: updatedTransaction,
        message: "Transaction cancelled successfully",
      });
    }

    // Admin-only actions
    if (user.role === "ADMIN") {
      if (action === "confirm") {
        // Confirm manual payment
        const updatedTransaction =
          await transactionService.updateTransactionStatus(
            transactionId,
            "PAID",
            {
              paidAt: new Date(),
            }
          );

        return NextResponse.json({
          success: true,
          data: updatedTransaction,
          message: "Payment confirmed successfully",
        });
      }

      if (action === "reject") {
        // Reject manual payment
        const updatedTransaction =
          await transactionService.updateTransactionStatus(
            transactionId,
            "FAILED"
          );

        return NextResponse.json({
          success: true,
          data: updatedTransaction,
          message: "Payment rejected",
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  } catch (error) {
    console.error("PATCH transaction error:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// Apply middlewares
async function authenticatedGetHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  return getHandler(request, authResult, context);
}

async function authenticatedPatchHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  return patchHandler(request, authResult, context);
}

// Export handlers
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (req: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return authenticatedGetHandler(rq, context);
      })(r);
    })(req);
  })(request);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return errorHandler(async (req: NextRequest) => {
    return loggingMiddleware(async (r: NextRequest) => {
      return corsMiddleware(async (rq: NextRequest) => {
        return authenticatedPatchHandler(rq, context);
      })(r);
    })(req);
  })(request);
}
