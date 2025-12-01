// services/transaction.service.ts
import prisma from "@/lib/prisma";
import { logError, logInfo } from "@/utils/logger.util";
import {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/utils/error.util";
import {
  HTTP_STATUS,
  TRANSACTION_STATUS,
  PAYMENT_METHOD,
} from "@/lib/constants";
import paymentGateway from "@/lib/payment";

export interface Transaction {
  id: string;
  userId: string;
  courseId: string;
  orderId: string;
  amount: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  paymentUrl?: string;
  paidAt?: Date;
  expiredAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionData {
  courseId: string;
  paymentMethod: string;
  userId: string;
}

export interface PaymentResponse {
  orderId: string;
  transactionId: string;
  paymentUrl?: string;
  status: string;
  amount: number;
  expiredAt: Date;
}

export interface PaymentWebhookData {
  orderId: string;
  transactionStatus: string;
  fraudStatus?: string;
  statusCode?: string;
  grossAmount?: string;
  paymentType?: string;
  transactionTime?: string;
  signatureKey?: string;
}

export interface TransactionStats {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  growthRate: number;
  totalTransactions: number;
  successfulTransactions: number;
  pendingTransactions: number;
  refundedAmount: number;
}

export interface UserTransactionStats {
  totalSpent: number;
  totalTransactions: number;
  successfulTransactions: number;
  pendingTransactions: number;
}

// Extended interface untuk payment notification
interface PaymentNotification {
  orderId: string;
  transactionStatus: string;
  fraudStatus?: string;
  grossAmount: string;
  paymentType?: string;
  transactionTime?: string;
  signatureKey?: string;
}

/**
 * Transaction Service
 * Handles payment transactions, webhooks, and transaction management
 */
export class TransactionService {
  /**
   * Create new transaction
   */
  async createTransaction(
    data: CreateTransactionData
  ): Promise<PaymentResponse> {
    try {
      console.log(
        "💰 Creating transaction for user:",
        data.userId,
        "course:",
        data.courseId
      );

      // Validate input
      if (!data.courseId || !data.paymentMethod || !data.userId) {
        throw new ValidationError(
          "Course ID, payment method, and user ID are required"
        );
      }

      // Check if course exists and get price
      console.log("🔍 Getting course details...");
      const course = await prisma.course.findUnique({
        where: { id: data.courseId },
        select: {
          id: true,
          title: true,
          price: true,
          discountPrice: true,
          isFree: true,
        },
      });

      if (!course) {
        console.log("❌ Course not found:", data.courseId);
        throw new NotFoundError("Course not found");
      }

      if (course.isFree) {
        console.log("❌ Cannot create transaction for free course");
        throw new ValidationError("Cannot create transaction for free course");
      }

      // Check if user already has an active enrollment
      console.log("🔍 Checking existing enrollment...");
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
          userId: data.userId,
          courseId: data.courseId,
          status: { in: ["ACTIVE", "COMPLETED"] },
        },
      });

      if (existingEnrollment) {
        console.log("❌ User already enrolled in this course");
        throw new ConflictError("You are already enrolled in this course");
      }

      // Check for pending transactions for the same course
      console.log("🔍 Checking pending transactions...");
      const pendingTransaction = await prisma.transaction.findFirst({
        where: {
          userId: data.userId,
          courseId: data.courseId,
          status: { in: ["PENDING", "PROCESSING"] },
        },
      });

      if (pendingTransaction) {
        console.log("ℹ️ Returning existing pending transaction");
        return {
          orderId: pendingTransaction.orderId,
          transactionId: pendingTransaction.id,
          paymentUrl: pendingTransaction.paymentUrl || undefined,
          status: pendingTransaction.status,
          amount: pendingTransaction.totalAmount,
          expiredAt: pendingTransaction.expiredAt!,
        };
      }

      // Calculate amounts
      const amount = course.discountPrice || course.price;
      const discount = course.discountPrice
        ? course.price - course.discountPrice
        : 0;
      const totalAmount = amount;

      // Generate order ID
      const orderId = this.generateOrderId();

      // Calculate expiry time (24 hours from now)
      const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      console.log("💾 Creating transaction in database...");
      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          userId: data.userId,
          courseId: data.courseId,
          orderId,
          amount,
          discount,
          totalAmount,
          paymentMethod: data.paymentMethod,
          status: TRANSACTION_STATUS.PENDING,
          expiredAt,
          metadata: {
            courseTitle: course.title,
            originalPrice: course.price,
            discountPrice: course.discountPrice,
          },
        },
      });

      console.log("✅ Transaction created:", transaction.id);

      // Process payment with gateway
      console.log("🔗 Processing payment with gateway...");
      const paymentRequest = {
        orderId: transaction.orderId,
        amount: transaction.totalAmount,
        customerName: `User_${data.userId}`, // In real app, get user name
        customerEmail: `user_${data.userId}@example.com`, // In real app, get user email
        courseName: course.title,
        userId: data.userId,
        courseId: data.courseId,
      };

      const paymentResult = await paymentGateway.createTransaction(
        paymentRequest
      );

      // Update transaction with payment details
      console.log("💾 Updating transaction with payment details...");
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          paymentUrl: paymentResult.redirectUrl,
          status: TRANSACTION_STATUS.PENDING,
          metadata: {
            ...(transaction.metadata as Record<string, unknown>),
            paymentToken: paymentResult.token,
            gateway: "midtrans",
          },
        },
      });

      console.log(
        "✅ Payment processing completed for transaction:",
        transaction.id
      );

      return {
        orderId: transaction.orderId,
        transactionId: transaction.id,
        paymentUrl: paymentResult.redirectUrl,
        status: TRANSACTION_STATUS.PENDING,
        amount: transaction.totalAmount,
        expiredAt: transaction.expiredAt!,
      };
    } catch (error) {
      console.error("❌ Create transaction failed:", error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(
    id: string,
    userId?: string
  ): Promise<Transaction | null> {
    try {
      console.log("🔍 Getting transaction by ID:", id);

      const whereClause: any = { id };
      if (userId) {
        whereClause.userId = userId; // Restrict to user's own transactions if userId provided
      }

      const transaction = await prisma.transaction.findUnique({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
            },
          },
        },
      });

      if (!transaction) {
        console.log("❌ Transaction not found:", id);
        return null;
      }

      console.log("✅ Transaction found:", id);

      return this.mapPrismaTransaction(transaction);
    } catch (error) {
      console.error("❌ Get transaction by ID failed:", error);
      throw error;
    }
  }

  /**
   * Get transaction by order ID
   */
  async getTransactionByOrderId(orderId: string): Promise<Transaction | null> {
    try {
      console.log("🔍 Getting transaction by order ID:", orderId);

      const transaction = await prisma.transaction.findUnique({
        where: { orderId },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
            },
          },
        },
      });

      if (!transaction) {
        console.log("❌ Transaction not found for order:", orderId);
        return null;
      }

      console.log("✅ Transaction found for order:", orderId);

      return this.mapPrismaTransaction(transaction);
    } catch (error) {
      console.error("❌ Get transaction by order ID failed:", error);
      throw error;
    }
  }

  /**
   * Get user transactions
   */
  async getUserTransactions(
    userId: string,
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      console.log("🔍 Getting transactions for user:", userId);

      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const whereClause: any = { userId };
      if (filters?.status) {
        whereClause.status = filters.status;
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: whereClause,
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.transaction.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      console.log(
        `✅ Found ${transactions.length} transactions for user ${userId}`
      );

      return {
        transactions: transactions.map((transaction: any) =>
          this.mapPrismaTransaction(transaction)
        ),
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error("❌ Get user transactions failed:", error);
      throw error;
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: string,
    additionalData?: {
      paidAt?: Date;
      refundedAt?: Date;
      refundReason?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Transaction> {
    try {
      console.log("🔄 Updating transaction status:", { transactionId, status });

      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (additionalData?.paidAt) {
        updateData.paidAt = additionalData.paidAt;
      }

      if (additionalData?.refundedAt) {
        updateData.refundedAt = additionalData.refundedAt;
        updateData.refundReason = additionalData.refundReason;
      }

      if (additionalData?.metadata) {
        // Merge with existing metadata
        const existingTransaction = await prisma.transaction.findUnique({
          where: { id: transactionId },
          select: { metadata: true },
        });

        updateData.metadata = {
          ...(existingTransaction?.metadata as Record<string, unknown>),
          ...additionalData.metadata,
        };
      }

      const transaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
            },
          },
        },
      });

      // If transaction is successful, create enrollment
      if (status === TRANSACTION_STATUS.PAID) {
        console.log("🎓 Creating enrollment for successful transaction...");
        await this.createEnrollment(transaction.userId, transaction.courseId);
      }

      console.log("✅ Transaction status updated:", { transactionId, status });

      return this.mapPrismaTransaction(transaction);
    } catch (error) {
      console.error("❌ Update transaction status failed:", error);
      throw error;
    }
  }

  /**
   * Process payment webhook
   */
  async processPaymentWebhook(
    data: PaymentWebhookData
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🔗 Processing payment webhook:", data);

      // Convert PaymentWebhookData to PaymentNotification format yang diharapkan oleh paymentGateway
      const notificationData: PaymentNotification = {
        orderId: data.orderId,
        transactionStatus: data.transactionStatus,
        fraudStatus: data.fraudStatus,
        grossAmount: data.grossAmount || "0", // Provide default value
        paymentType: data.paymentType,
        transactionTime: data.transactionTime,
        signatureKey: data.signatureKey,
      };

      // Verify webhook signature
      const isValid = await paymentGateway.verifyNotification(notificationData);
      if (!isValid) {
        console.log("❌ Invalid webhook signature");
        return { success: false, message: "Invalid signature" };
      }

      // Get transaction by order ID
      const transaction = await this.getTransactionByOrderId(data.orderId);
      if (!transaction) {
        console.log("❌ Transaction not found for order:", data.orderId);
        return { success: false, message: "Transaction not found" };
      }

      // Map gateway status to our status
      const status = this.mapTransactionStatus(data.transactionStatus);

      // Update transaction status
      await this.updateTransactionStatus(transaction.id, status, {
        paidAt: status === TRANSACTION_STATUS.PAID ? new Date() : undefined,
        metadata: {
          gatewayData: data,
          processedAt: new Date().toISOString(),
        },
      });

      console.log("✅ Webhook processed successfully for order:", data.orderId);

      return { success: true, message: "Webhook processed successfully" };
    } catch (error) {
      console.error("❌ Process payment webhook failed:", error);
      return { success: false, message: "Webhook processing failed" };
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(userId?: string): Promise<TransactionStats> {
    try {
      console.log("📊 Getting transaction statistics for user:", userId);

      const whereClause: any = {};
      if (userId) {
        whereClause.userId = userId;
      }

      // Get current date ranges for monthly stats
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        totalRevenueResult,
        revenueThisMonthResult,
        revenueLastMonthResult,
        totalTransactionsResult,
        successfulTransactionsResult,
        pendingTransactionsResult,
        refundedAmountResult,
      ] = await Promise.all([
        // Total revenue
        prisma.transaction.aggregate({
          where: { ...whereClause, status: TRANSACTION_STATUS.PAID },
          _sum: { totalAmount: true },
        }),

        // Revenue this month
        prisma.transaction.aggregate({
          where: {
            ...whereClause,
            status: TRANSACTION_STATUS.PAID,
            paidAt: { gte: startOfThisMonth },
          },
          _sum: { totalAmount: true },
        }),

        // Revenue last month
        prisma.transaction.aggregate({
          where: {
            ...whereClause,
            status: TRANSACTION_STATUS.PAID,
            paidAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
          _sum: { totalAmount: true },
        }),

        // Total transactions
        prisma.transaction.count({ where: whereClause }),

        // Successful transactions
        prisma.transaction.count({
          where: { ...whereClause, status: TRANSACTION_STATUS.PAID },
        }),

        // Pending transactions
        prisma.transaction.count({
          where: { ...whereClause, status: TRANSACTION_STATUS.PENDING },
        }),

        // Refunded amount
        prisma.transaction.aggregate({
          where: { ...whereClause, status: TRANSACTION_STATUS.REFUNDED },
          _sum: { totalAmount: true },
        }),
      ]);

      const totalRevenue = totalRevenueResult._sum.totalAmount || 0;
      const revenueThisMonth = revenueThisMonthResult._sum.totalAmount || 0;
      const revenueLastMonth = revenueLastMonthResult._sum.totalAmount || 0;
      const refundedAmount = refundedAmountResult._sum.totalAmount || 0;

      // Calculate growth rate
      const growthRate =
        revenueLastMonth > 0
          ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
          : revenueThisMonth > 0
          ? 100
          : 0;

      const stats: TransactionStats = {
        totalRevenue,
        revenueThisMonth,
        revenueLastMonth,
        growthRate: Math.round(growthRate * 100) / 100, // Round to 2 decimal places
        totalTransactions: totalTransactionsResult,
        successfulTransactions: successfulTransactionsResult,
        pendingTransactions: pendingTransactionsResult,
        refundedAmount,
      };

      console.log("✅ Transaction statistics retrieved successfully");

      return stats;
    } catch (error) {
      console.error("❌ Get transaction statistics failed:", error);
      throw error;
    }
  }

  /**
   * Get user transaction statistics
   */
  async getUserTransactionStats(userId: string): Promise<UserTransactionStats> {
    try {
      console.log("📊 Getting user transaction statistics:", userId);

      const [
        totalSpentResult,
        totalTransactionsResult,
        successfulTransactionsResult,
        pendingTransactionsResult,
      ] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, status: TRANSACTION_STATUS.PAID },
          _sum: { totalAmount: true },
        }),
        prisma.transaction.count({ where: { userId } }),
        prisma.transaction.count({
          where: { userId, status: TRANSACTION_STATUS.PAID },
        }),
        prisma.transaction.count({
          where: { userId, status: TRANSACTION_STATUS.PENDING },
        }),
      ]);

      const stats: UserTransactionStats = {
        totalSpent: totalSpentResult._sum.totalAmount || 0,
        totalTransactions: totalTransactionsResult,
        successfulTransactions: successfulTransactionsResult,
        pendingTransactions: pendingTransactionsResult,
      };

      console.log("✅ User transaction statistics retrieved successfully");

      return stats;
    } catch (error) {
      console.error("❌ Get user transaction statistics failed:", error);
      throw error;
    }
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(
    transactionId: string,
    userId?: string
  ): Promise<Transaction> {
    try {
      console.log("❌ Canceling transaction:", transactionId);

      const whereClause: any = { id: transactionId };
      if (userId) {
        whereClause.userId = userId; // Users can only cancel their own transactions
      }

      const transaction = await prisma.transaction.findUnique({
        where: whereClause,
      });

      if (!transaction) {
        console.log("❌ Transaction not found:", transactionId);
        throw new NotFoundError("Transaction not found");
      }

      if (transaction.status !== TRANSACTION_STATUS.PENDING) {
        console.log("❌ Cannot cancel non-pending transaction");
        throw new ValidationError("Only pending transactions can be cancelled");
      }

      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: TRANSACTION_STATUS.CANCELLED,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
            },
          },
        },
      });

      console.log("✅ Transaction cancelled successfully:", transactionId);

      return this.mapPrismaTransaction(updatedTransaction);
    } catch (error) {
      console.error("❌ Cancel transaction failed:", error);
      throw error;
    }
  }

  /**
   * Refund transaction
   */
  async refundTransaction(
    transactionId: string,
    reason: string,
    adminUserId?: string
  ): Promise<Transaction> {
    try {
      console.log("💸 Refunding transaction:", transactionId);

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        console.log("❌ Transaction not found:", transactionId);
        throw new NotFoundError("Transaction not found");
      }

      if (transaction.status !== TRANSACTION_STATUS.PAID) {
        console.log("❌ Cannot refund non-paid transaction");
        throw new ValidationError("Only paid transactions can be refunded");
      }

      if (transaction.refundedAt) {
        console.log("❌ Transaction already refunded");
        throw new ValidationError("Transaction has already been refunded");
      }

      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: TRANSACTION_STATUS.REFUNDED,
          refundedAt: new Date(),
          refundReason: reason,
          updatedAt: new Date(),
          metadata: {
            ...(transaction.metadata as Record<string, unknown>),
            refundBy: adminUserId || "system",
            refundReason: reason,
            refundedAt: new Date().toISOString(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
            },
          },
        },
      });

      // Remove enrollment if exists
      console.log("🎓 Removing enrollment for refunded transaction...");
      await prisma.enrollment.deleteMany({
        where: {
          userId: transaction.userId,
          courseId: transaction.courseId,
        },
      });

      console.log("✅ Transaction refunded successfully:", transactionId);

      return this.mapPrismaTransaction(updatedTransaction);
    } catch (error) {
      console.error("❌ Refund transaction failed:", error);
      throw error;
    }
  }

  /**
   * Expire old pending transactions
   */
  async expireOldTransactions(): Promise<number> {
    try {
      console.log("🕐 Expiring old pending transactions...");

      const result = await prisma.transaction.updateMany({
        where: {
          status: TRANSACTION_STATUS.PENDING,
          expiredAt: { lt: new Date() },
        },
        data: {
          status: "EXPIRED", // Using string literal since it's not in TRANSACTION_STATUS
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Expired ${result.count} old transactions`);

      return result.count;
    } catch (error) {
      console.error("❌ Expire old transactions failed:", error);
      throw error;
    }
  }

  /**
   * Create enrollment after successful payment
   */
  private async createEnrollment(
    userId: string,
    courseId: string
  ): Promise<void> {
    try {
      console.log(
        "🎓 Creating enrollment for user:",
        userId,
        "course:",
        courseId
      );

      // Check if enrollment already exists
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          courseId,
        },
      });

      if (existingEnrollment) {
        console.log("ℹ️ Enrollment already exists, updating status...");
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            status: "ACTIVE",
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new enrollment
        await prisma.enrollment.create({
          data: {
            userId,
            courseId,
            status: "ACTIVE",
            progress: 0,
            lastAccessedAt: new Date(),
          },
        });
      }

      console.log("✅ Enrollment created/updated successfully");
    } catch (error) {
      console.error("❌ Create enrollment failed:", error);
      // Don't throw error, just log it
    }
  }

  /**
   * Generate unique order ID
   */
  private generateOrderId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Map transaction status from payment gateway to our status
   */
  private mapTransactionStatus(gatewayStatus: string): string {
    const statusMap: Record<string, string> = {
      capture: TRANSACTION_STATUS.PAID,
      settlement: TRANSACTION_STATUS.PAID,
      pending: TRANSACTION_STATUS.PENDING,
      deny: TRANSACTION_STATUS.FAILED,
      cancel: TRANSACTION_STATUS.CANCELLED,
      expire: "EXPIRED", // Sesuai schema
      refund: TRANSACTION_STATUS.REFUNDED,
      partial_refund: TRANSACTION_STATUS.REFUNDED,
      authorize: TRANSACTION_STATUS.PENDING,
    };
    return statusMap[gatewayStatus.toLowerCase()] || TRANSACTION_STATUS.PENDING;
  }

  /**
   * Map Prisma transaction to our Transaction interface
   */
  private mapPrismaTransaction(prismaTransaction: any): Transaction {
    return {
      id: prismaTransaction.id,
      userId: prismaTransaction.userId,
      courseId: prismaTransaction.courseId,
      orderId: prismaTransaction.orderId,
      amount: Number(prismaTransaction.amount),
      discount: Number(prismaTransaction.discount),
      totalAmount: Number(prismaTransaction.totalAmount),
      paymentMethod: prismaTransaction.paymentMethod,
      status: prismaTransaction.status,
      paymentUrl: prismaTransaction.paymentUrl || undefined,
      paidAt: prismaTransaction.paidAt || undefined,
      expiredAt: prismaTransaction.expiredAt || undefined,
      refundedAt: prismaTransaction.refundedAt || undefined,
      refundReason: prismaTransaction.refundReason || undefined,
      metadata: prismaTransaction.metadata as
        | Record<string, unknown>
        | undefined,
      createdAt: prismaTransaction.createdAt,
      updatedAt: prismaTransaction.updatedAt,
    };
  }

  /**
   * Get service status (for debugging)
   */
  getServiceStatus(): any {
    return {
      paymentGateway: "Midtrans",
      database: "Connected",
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
const transactionService = new TransactionService();
export default transactionService;
