import { sql, QueryResultRow } from '@vercel/postgres';
import { logError } from '@/utils/logger.util';

export interface Transaction {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  payment_method: 'credit_card' | 'bank_transfer' | 'e_wallet' | 'qris';
  payment_gateway: 'midtrans' | 'xendit' | 'manual';
  status: 'pending' | 'processing' | 'success' | 'failed' | 'expired';
  payment_url?: string;
  payment_token?: string;
  payment_reference?: string;
  paid_at?: Date;
  expired_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentGatewayResponse {
  success: boolean;
  transaction_id: string;
  payment_url?: string;
  payment_token?: string;
  payment_reference?: string;
  message?: string;
}

export interface TransactionStats {
  total_amount: number;
  total_transactions: number;
  pending_count: number;
  success_count: number;
  failed_count: number;
}

// Helper function to convert QueryResultRow to Transaction
function rowToTransaction(row: QueryResultRow): Transaction {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    course_id: String(row.course_id),
    amount: Number(row.amount),
    payment_method: row.payment_method as Transaction['payment_method'],
    payment_gateway: row.payment_gateway as Transaction['payment_gateway'],
    status: row.status as Transaction['status'],
    payment_url: row.payment_url ? String(row.payment_url) : undefined,
    payment_token: row.payment_token ? String(row.payment_token) : undefined,
    payment_reference: row.payment_reference ? String(row.payment_reference) : undefined,
    paid_at: row.paid_at ? new Date(row.paid_at as string) : undefined,
    expired_at: row.expired_at ? new Date(row.expired_at as string) : undefined,
    created_at: new Date(row.created_at as string),
    updated_at: new Date(row.updated_at as string),
  };
}

class TransactionService {
  // Create new transaction
  async createTransaction(data: {
    user_id: string;
    course_id: string;
    amount: number;
    payment_method: string;
    payment_gateway: string;
  }): Promise<Transaction> {
    try {
      // Set expiration time (24 hours from now)
      const expiredAt = new Date();
      expiredAt.setHours(expiredAt.getHours() + 24);

      const result = await sql`
        INSERT INTO transactions (
          user_id, course_id, amount, payment_method, 
          payment_gateway, status, expired_at
        )
        VALUES (
          ${data.user_id}, ${data.course_id}, ${data.amount}, 
          ${data.payment_method}, ${data.payment_gateway}, 
          'pending', ${expiredAt.toISOString()}
        )
        RETURNING *
      `;

      const transaction = rowToTransaction(result.rows[0]);

      // Process payment with gateway
      const paymentResponse = await this.processPaymentGateway(transaction);

      // Update transaction with payment details
      if (paymentResponse.success) {
        const updated = await sql`
          UPDATE transactions
          SET 
            payment_url = ${paymentResponse.payment_url || null},
            payment_token = ${paymentResponse.payment_token || null},
            payment_reference = ${paymentResponse.payment_reference || null},
            status = 'processing',
            updated_at = NOW()
          WHERE id = ${transaction.id}
          RETURNING *
        `;

        return rowToTransaction(updated.rows[0]);
      }

      return transaction;
    } catch (error) {
      console.error('Create transaction error:', error);
      throw new Error('Failed to create transaction');
    }
  }

  // Process payment with gateway
  private async processPaymentGateway(transaction: Transaction): Promise<PaymentGatewayResponse> {
    try {
      if (transaction.payment_gateway === 'midtrans') {
        return await this.processMidtrans(transaction);
      } else if (transaction.payment_gateway === 'xendit') {
        return await this.processXendit(transaction);
      } else {
        // Manual payment
        return {
          success: true,
          transaction_id: transaction.id,
          message: 'Manual payment - awaiting confirmation',
        };
      }
    } catch (error) {
      console.error('Payment gateway error:', error);
      return {
        success: false,
        transaction_id: transaction.id,
        message: 'Payment gateway processing failed',
      };
    }
  }

  // Midtrans integration
  private async processMidtrans(transaction: Transaction): Promise<PaymentGatewayResponse> {
    try {
      // Midtrans Snap API
      const midtransUrl =
        process.env.MIDTRANS_API_URL || 'https://app.sandbox.midtrans.com/snap/v1/transactions';
      const serverKey = process.env.MIDTRANS_SERVER_KEY || '';

      const payload = {
        transaction_details: {
          order_id: transaction.id,
          gross_amount: transaction.amount,
        },
        customer_details: {
          id: transaction.user_id,
        },
        credit_card: {
          secure: true,
        },
      };

      const response = await fetch(midtransUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(serverKey + ':').toString('base64')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        redirect_url?: string;
        token?: string;
        error_messages?: string[];
      };

      if (response.ok) {
        return {
          success: true,
          transaction_id: transaction.id,
          payment_url: data.redirect_url,
          payment_token: data.token,
        };
      }

      return {
        success: false,
        transaction_id: transaction.id,
        message: data.error_messages?.[0] || 'Midtrans error',
      };
    } catch (error) {
      console.error('Midtrans error:', error);
      return {
        success: false,
        transaction_id: transaction.id,
        message: 'Midtrans integration failed',
      };
    }
  }

  // Xendit integration
  private async processXendit(transaction: Transaction): Promise<PaymentGatewayResponse> {
    try {
      const xenditUrl = process.env.XENDIT_API_URL || 'https://api.xendit.co/v2/invoices';
      const apiKey = process.env.XENDIT_API_KEY || '';

      const payload = {
        external_id: transaction.id,
        amount: transaction.amount,
        payer_email: `user_${transaction.user_id}@example.com`,
        description: `Payment for course ${transaction.course_id}`,
      };

      const response = await fetch(xenditUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        invoice_url?: string;
        id?: string;
        message?: string;
      };

      if (response.ok) {
        return {
          success: true,
          transaction_id: transaction.id,
          payment_url: data.invoice_url,
          payment_reference: data.id,
        };
      }

      return {
        success: false,
        transaction_id: transaction.id,
        message: data.message || 'Xendit error',
      };
    } catch (error) {
      console.error('Xendit error:', error);
      return {
        success: false,
        transaction_id: transaction.id,
        message: 'Xendit integration failed',
      };
    }
  }

  // Get transaction by ID
  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const result = await sql`
        SELECT 
          t.*,
          c.title as course_title,
          c.price as course_price,
          u.full_name as user_name,
          u.email as user_email
        FROM transactions t
        JOIN courses c ON t.course_id = c.id
        JOIN users u ON t.user_id = u.id
        WHERE t.id = ${id}
      `;

      return result.rows[0] ? rowToTransaction(result.rows[0] as QueryResultRow) : null;
    } catch (error) {
      logError('Get transaction error', error);
      return null;
    }
  }

  // Get user transactions
  async getUserTransactions(
    userId: string,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ transactions: Transaction[]; total: number }> {
    try {
      // Validate pagination parameters
      let limit = filters?.limit || 10;
      let offset = filters?.offset || 0;

      if (limit < 1 || limit > 100) limit = 10;
      if (offset < 0) offset = 0;

      // Validate status if provided
      const validStatuses = ['pending', 'processing', 'success', 'failed', 'expired'];
      const status = filters?.status && validStatuses.includes(filters.status) ? filters.status : undefined;

      const result = await sql`
        SELECT 
          t.*,
          c.title as course_title,
          c.thumbnail_url as course_thumbnail
        FROM transactions t
        JOIN courses c ON t.course_id = c.id
        WHERE t.user_id = ${userId}
        ${status ? sql`AND t.status = ${status}` : sql``}
        ORDER BY t.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      // Get total count
      const countResult = await sql`
        SELECT COUNT(*) as total
        FROM transactions
        WHERE user_id = ${userId}
        ${status ? sql`AND status = ${status}` : sql``}
      `;

      return {
        transactions: result.rows.map(row => rowToTransaction(row as QueryResultRow)),
        total: parseInt(countResult.rows[0].total as string),
      };
    } catch (error) {
      logError('Get user transactions error', error);
      return { transactions: [], total: 0 };
    }
  }

  // Update transaction status
  async updateTransactionStatus(
    id: string,
    status: string,
    additionalData?: {
      payment_reference?: string;
      paid_at?: Date;
    }
  ): Promise<Transaction | null> {
    try {
      const updates: any = {
        status,
        updated_at: new Date(),
      };

      if (additionalData?.payment_reference) {
        updates.payment_reference = additionalData.payment_reference;
      }

      if (additionalData?.paid_at) {
        updates.paid_at = additionalData.paid_at;
      }

      const result = await sql`
        UPDATE transactions
        SET 
          status = ${status},
          payment_reference = ${updates.payment_reference || null},
          paid_at = ${updates.paid_at?.toISOString() || null},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      // If transaction is successful, grant course access
      if (status === 'success' && result.rows[0]) {
        await this.grantCourseAccess(result.rows[0]);
      }

      return result.rows[0] || null;
    } catch (error) {
      console.error('Update transaction status error:', error);
      return null;
    }
  }

  // Grant course access after successful payment
  private async grantCourseAccess(transaction: Transaction): Promise<void> {
    try {
      // Check if enrollment already exists
      const existing = await sql`
        SELECT id FROM enrollments
        WHERE user_id = ${transaction.user_id}
        AND course_id = ${transaction.course_id}
      `;

      if (existing.rows.length === 0) {
        await sql`
          INSERT INTO enrollments (user_id, course_id, status, enrolled_at)
          VALUES (${transaction.user_id}, ${transaction.course_id}, 'active', NOW())
        `;
      }
    } catch (error) {
      console.error('Grant course access error:', error);
    }
  }

  // Process webhook from payment gateway
  async processWebhook(
    gateway: string,
    payload: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (gateway === 'midtrans') {
        return await this.processMidtransWebhook(payload);
      } else if (gateway === 'xendit') {
        return await this.processXenditWebhook(payload);
      }

      return { success: false, message: 'Unknown gateway' };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { success: false, message: 'Webhook processing failed' };
    }
  }

  // Process Midtrans webhook
  private async processMidtransWebhook(
    payload: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      const transactionId = payload.order_id;
      const transactionStatus = payload.transaction_status;
      const fraudStatus = payload.fraud_status;

      let status = 'pending';
      if (transactionStatus === 'capture') {
        status = fraudStatus === 'accept' ? 'success' : 'failed';
      } else if (transactionStatus === 'settlement') {
        status = 'success';
      } else if (transactionStatus === 'deny' || transactionStatus === 'cancel') {
        status = 'failed';
      } else if (transactionStatus === 'expire') {
        status = 'expired';
      }

      await this.updateTransactionStatus(transactionId, status, {
        payment_reference: payload.transaction_id,
        paid_at: status === 'success' ? new Date() : undefined,
      });

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('Midtrans webhook error:', error);
      return { success: false, message: 'Webhook processing failed' };
    }
  }

  // Process Xendit webhook
  private async processXenditWebhook(payload: any): Promise<{ success: boolean; message: string }> {
    try {
      const transactionId = payload.external_id;
      const status = payload.status === 'PAID' ? 'success' : 'pending';

      await this.updateTransactionStatus(transactionId, status, {
        payment_reference: payload.id,
        paid_at: status === 'success' ? new Date(payload.paid_at) : undefined,
      });

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('Xendit webhook error:', error);
      return { success: false, message: 'Webhook processing failed' };
    }
  }

  // Get transaction statistics
  async getTransactionStats(
    userId?: string,
    filters?: {
      start_date?: Date;
      end_date?: Date;
    }
  ): Promise<TransactionStats> {
    try {
      let query = `
        SELECT 
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
        FROM transactions
        WHERE 1=1
      `;

      const params: any[] = [];

      if (userId) {
        query += ` AND user_id = $${params.length + 1}`;
        params.push(userId);
      }

      if (filters?.start_date) {
        query += ` AND created_at >= $${params.length + 1}`;
        params.push(filters.start_date.toISOString());
      }

      if (filters?.end_date) {
        query += ` AND created_at <= $${params.length + 1}`;
        params.push(filters.end_date.toISOString());
      }

      const result = await sql.query(query, params);

      return {
        total_amount: parseFloat(result.rows[0].total_amount),
        total_transactions: parseInt(result.rows[0].total_transactions),
        pending_count: parseInt(result.rows[0].pending_count),
        success_count: parseInt(result.rows[0].success_count),
        failed_count: parseInt(result.rows[0].failed_count),
      };
    } catch (error) {
      console.error('Get transaction stats error:', error);
      return {
        total_amount: 0,
        total_transactions: 0,
        pending_count: 0,
        success_count: 0,
        failed_count: 0,
      };
    }
  }

  // Cancel transaction
  async cancelTransaction(id: string): Promise<boolean> {
    try {
      const result = await sql`
        UPDATE transactions
        SET status = 'failed', updated_at = NOW()
        WHERE id = ${id} AND status = 'pending'
        RETURNING id
      `;

      return result.rows.length > 0;
    } catch (error) {
      console.error('Cancel transaction error:', error);
      return false;
    }
  }

  // Check and expire old transactions
  async expireOldTransactions(): Promise<number> {
    try {
      const result = await sql`
        UPDATE transactions
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'pending' 
        AND expired_at < NOW()
        RETURNING id
      `;

      return result.rows.length;
    } catch (error) {
      console.error('Expire old transactions error:', error);
      return 0;
    }
  }
}

export default new TransactionService();
