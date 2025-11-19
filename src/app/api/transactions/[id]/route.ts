import { NextRequest, NextResponse } from 'next/server';
import transactionService from '@/services/transaction.service';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const transactionId = params.id;

    // Get transaction details
    const transaction = await transactionService.getTransactionById(transactionId);

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check authorization - only owner or admin can view
    if (transaction.user_id !== decoded.userId && decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if transaction is expired and update status
    if (
      transaction.status === 'pending' &&
      transaction.expired_at &&
      new Date(transaction.expired_at) < new Date()
    ) {
      await transactionService.updateTransactionStatus(transactionId, 'expired');
      transaction.status = 'expired';
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('GET transaction detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction details' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const transactionId = params.id;
    const body = await request.json();
    const { action } = body;

    // Get transaction
    const transaction = await transactionService.getTransactionById(transactionId);

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check authorization
    if (transaction.user_id !== decoded.userId && decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle different actions
    if (action === 'cancel') {
      // Only allow canceling pending transactions
      if (transaction.status !== 'pending') {
        return NextResponse.json(
          { error: 'Can only cancel pending transactions' },
          { status: 400 }
        );
      }

      const success = await transactionService.cancelTransaction(transactionId);

      if (!success) {
        return NextResponse.json({ error: 'Failed to cancel transaction' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Transaction cancelled successfully',
      });
    }

    // Admin-only actions
    if (decoded.role === 'admin') {
      if (action === 'confirm') {
        // Confirm manual payment
        const updated = await transactionService.updateTransactionStatus(transactionId, 'success', {
          paid_at: new Date(),
        });

        return NextResponse.json({
          success: true,
          data: updated,
          message: 'Payment confirmed successfully',
        });
      }

      if (action === 'reject') {
        // Reject manual payment
        const updated = await transactionService.updateTransactionStatus(transactionId, 'failed');

        return NextResponse.json({
          success: true,
          data: updated,
          message: 'Payment rejected',
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH transaction error:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}
