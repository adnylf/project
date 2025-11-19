import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication and admin role
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const transactionId = params.id;

    // Get transaction with full details
    const result = await sql`
      SELECT 
        t.*,
        u.full_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        u.address as user_address,
        c.title as course_title,
        c.slug as course_slug,
        c.price as course_price,
        c.discount_price as course_discount_price,
        c.thumbnail_url as course_thumbnail,
        c.description as course_description,
        i.full_name as instructor_name,
        i.email as instructor_email,
        i.avatar_url as instructor_avatar,
        e.id as enrollment_id,
        e.status as enrollment_status,
        e.progress as enrollment_progress,
        e.enrolled_at,
        e.completed_at as enrollment_completed_at
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN courses c ON t.course_id = c.id
      JOIN users i ON c.instructor_id = i.id
      LEFT JOIN enrollments e ON t.user_id = e.user_id AND t.course_id = e.course_id
      WHERE t.id = ${transactionId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = result.rows[0];

    // Get payment proof if manual payment
    if (transaction.payment_gateway === 'manual') {
      const proofResult = await sql`
        SELECT 
          pp.*,
          admin.full_name as reviewed_by_name,
          admin.email as reviewed_by_email
        FROM payment_proofs pp
        LEFT JOIN users admin ON pp.reviewed_by = admin.id
        WHERE pp.transaction_id = ${transactionId}
        ORDER BY pp.submitted_at DESC
      `;

      transaction.payment_proofs = proofResult.rows;
    }

    // Get transaction history/timeline
    const historyResult = await sql`
      SELECT 
        al.*,
        u.full_name as actor_name,
        u.role as actor_role
      FROM admin_action_logs al
      LEFT JOIN users u ON al.admin_id = u.id
      WHERE al.target_type = 'transaction' 
      AND al.target_id = ${transactionId}
      ORDER BY al.created_at DESC
    `;

    transaction.history = historyResult.rows;

    // Get refund information if exists
    const refundResult = await sql`
      SELECT 
        r.*,
        admin.full_name as processed_by_name
      FROM refunds r
      LEFT JOIN users admin ON r.processed_by = admin.id
      WHERE r.transaction_id = ${transactionId}
    `;

    if (refundResult.rows.length > 0) {
      transaction.refund = refundResult.rows[0];
    }

    // Get notification sent for this transaction
    const notificationResult = await sql`
      SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.status,
        n.created_at,
        n.read_at
      FROM notifications n
      WHERE n.reference_type = 'transaction'
      AND n.reference_id = ${transactionId}
      ORDER BY n.created_at DESC
    `;

    transaction.notifications = notificationResult.rows;

    // Calculate transaction fees and breakdown
    const platformFee = transaction.amount * 0.05; // 5% platform fee
    const paymentGatewayFee = transaction.amount * 0.029 + 2000; // Example: 2.9% + Rp2000
    const instructorEarnings = transaction.amount - platformFee - paymentGatewayFee;

    transaction.fee_breakdown = {
      gross_amount: transaction.amount,
      platform_fee: Math.round(platformFee),
      payment_gateway_fee: Math.round(paymentGatewayFee),
      instructor_earnings: Math.round(instructorEarnings),
      currency: 'IDR',
    };

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Get transaction detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction details' }, { status: 500 });
  }
}
