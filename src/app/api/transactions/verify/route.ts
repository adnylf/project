import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { transaction_id, proof_of_payment, bank_account, payment_date, notes } = body;

    // Validate required fields
    if (!transaction_id || !proof_of_payment) {
      return NextResponse.json(
        { error: 'Transaction ID and proof of payment are required' },
        { status: 400 }
      );
    }

    // Get transaction
    const transactionResult = await sql`
      SELECT * FROM transactions
      WHERE id = ${transaction_id}
    `;

    if (transactionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = transactionResult.rows[0];

    // Check authorization
    if (transaction.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check transaction status
    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { error: 'Transaction cannot be verified in current status' },
        { status: 400 }
      );
    }

    // Check if transaction is expired
    if (new Date(transaction.expired_at) < new Date()) {
      return NextResponse.json({ error: 'Transaction has expired' }, { status: 400 });
    }

    // Check if payment gateway is manual
    if (transaction.payment_gateway !== 'manual') {
      return NextResponse.json(
        { error: 'Manual verification is only for manual payment gateway' },
        { status: 400 }
      );
    }

    // Store payment proof
    await sql`
      INSERT INTO payment_proofs (
        transaction_id, 
        proof_url, 
        bank_account, 
        payment_date, 
        notes,
        status,
        submitted_at
      )
      VALUES (
        ${transaction_id},
        ${proof_of_payment},
        ${bank_account || null},
        ${payment_date || null},
        ${notes || null},
        'pending_review',
        NOW()
      )
    `;

    // Update transaction status to processing
    await sql`
      UPDATE transactions
      SET 
        status = 'processing',
        updated_at = NOW()
      WHERE id = ${transaction_id}
    `;

    // Create notification for admin
    await sql`
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        reference_id,
        reference_type
      )
      SELECT 
        id,
        'New Payment Verification',
        'A user has submitted payment proof for manual verification.',
        'admin_alert',
        ${transaction_id},
        'transaction'
      FROM users
      WHERE role = 'admin'
    `;

    // Create notification for user
    await sql`
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        reference_id,
        reference_type
      )
      VALUES (
        ${decoded.userId},
        'Payment Proof Submitted',
        'Your payment proof has been submitted and is under review. We will notify you once verified.',
        'payment_verification',
        ${transaction_id},
        'transaction'
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted successfully. Please wait for admin verification.',
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: 'Failed to submit payment proof' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending_review';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Get payment proofs pending review
    const result = await sql`
      SELECT 
        pp.*,
        t.amount,
        t.payment_method,
        t.created_at as transaction_date,
        c.title as course_title,
        u.full_name as user_name,
        u.email as user_email
      FROM payment_proofs pp
      JOIN transactions t ON pp.transaction_id = t.id
      JOIN courses c ON t.course_id = c.id
      JOIN users u ON t.user_id = u.id
      WHERE pp.status = ${status}
      ORDER BY pp.submitted_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM payment_proofs
      WHERE status = ${status}
    `;

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page,
        limit,
        total_pages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
      },
    });
  } catch (error) {
    console.error('Get payment proofs error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment proofs' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { proof_id, action, admin_notes } = body;

    if (!proof_id || !action) {
      return NextResponse.json({ error: 'Proof ID and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get payment proof
    const proofResult = await sql`
      SELECT pp.*, t.user_id, t.id as transaction_id
      FROM payment_proofs pp
      JOIN transactions t ON pp.transaction_id = t.id
      WHERE pp.id = ${proof_id}
    `;

    if (proofResult.rows.length === 0) {
      return NextResponse.json({ error: 'Payment proof not found' }, { status: 404 });
    }

    const proof = proofResult.rows[0];

    if (proof.status !== 'pending_review') {
      return NextResponse.json(
        { error: 'Payment proof has already been processed' },
        { status: 400 }
      );
    }

    // Update payment proof status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await sql`
      UPDATE payment_proofs
      SET 
        status = ${newStatus},
        admin_notes = ${admin_notes || null},
        reviewed_by = ${decoded.userId},
        reviewed_at = NOW()
      WHERE id = ${proof_id}
    `;

    // Update transaction status
    const transactionStatus = action === 'approve' ? 'success' : 'failed';
    await sql`
      UPDATE transactions
      SET 
        status = ${transactionStatus},
        paid_at = ${action === 'approve' ? new Date().toISOString() : null},
        updated_at = NOW()
      WHERE id = ${proof.transaction_id}
    `;

    // Grant course access if approved
    if (action === 'approve') {
      await sql`
        INSERT INTO enrollments (user_id, course_id, status, enrolled_at)
        SELECT user_id, course_id, 'active', NOW()
        FROM transactions
        WHERE id = ${proof.transaction_id}
        ON CONFLICT (user_id, course_id) DO NOTHING
      `;
    }

    // Create notification for user
    const notificationTitle =
      action === 'approve' ? 'Payment Verified' : 'Payment Verification Failed';

    const notificationMessage =
      action === 'approve'
        ? 'Your payment has been verified. You can now access the course.'
        : `Your payment verification was not successful. ${
            admin_notes || 'Please contact support for more information.'
          }`;

    await sql`
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        reference_id,
        reference_type
      )
      VALUES (
        ${proof.user_id},
        ${notificationTitle},
        ${notificationMessage},
        ${action === 'approve' ? 'payment_verified' : 'payment_rejected'},
        ${proof.transaction_id},
        'transaction'
      )
    `;

    return NextResponse.json({
      success: true,
      message: `Payment proof ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error('Update payment proof error:', error);
    return NextResponse.json({ error: 'Failed to update payment proof' }, { status: 500 });
  }
}
