import { NextRequest, NextResponse } from "next/server";
import transactionService from "@/services/transaction.service";
import { errorHandler } from "@/middlewares/error.middleware";
import { corsMiddleware } from "@/middlewares/cors.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * POST /api/transactions/webhook
 * Process payment webhook from payment gateway
 */
async function postHandler(request: NextRequest) {
  try {
    const payload = await request.json();

    // Process webhook menggunakan service yang benar
    const result = await transactionService.processPaymentWebhook(payload);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export const POST = errorHandler(
  loggingMiddleware(corsMiddleware(postHandler))
);
