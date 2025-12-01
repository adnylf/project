import { NextRequest, NextResponse } from "next/server";
import transactionService from "@/services/transaction.service";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { errorHandler } from "@/middlewares/error.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/transactions
 * Get user transactions with pagination and filtering
 */
async function getHandler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await transactionService.getUserTransactions(user.userId, {
      status,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.transactions,
      pagination: {
        total: result.total,
        page: result.page,
        limit: limit, // Menggunakan limit dari parameter, bukan dari result
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("GET transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * POST /api/transactions
 * Create new transaction
 */
async function postHandler(request: NextRequest, user: any) {
  try {
    const body = await request.json();
    const { courseId, paymentMethod } = body;

    if (!courseId || !paymentMethod) {
      return NextResponse.json(
        { error: "Course ID and payment method are required" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const validPaymentMethods = [
      "CREDIT_CARD",
      "BANK_TRANSFER",
      "E_WALLET",
      "VIRTUAL_ACCOUNT",
    ];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const transactionData = {
      courseId,
      paymentMethod,
      userId: user.userId,
    };

    const transaction = await transactionService.createTransaction(
      transactionData
    );

    return NextResponse.json(
      {
        success: true,
        data: transaction,
        message: "Transaction created successfully",
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    console.error("POST transaction error:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// Apply middlewares
async function authenticatedGetHandler(
  request: NextRequest
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  return getHandler(request, authResult);
}

async function authenticatedPostHandler(
  request: NextRequest
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  return postHandler(request, authResult);
}

// Export handlers
export const GET = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedGetHandler))
);
export const POST = errorHandler(
  loggingMiddleware(corsMiddleware(authenticatedPostHandler))
);
