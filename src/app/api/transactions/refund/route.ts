import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';

interface RefundPolicy {
  can_refund: boolean;
  refund_percentage: number;
  reason: string;
}

interface TransactionData {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  status: string;
  payment_gateway: string;
  payment_reference: string | null;
  [key: string]: unknown;
}

interface EnrollmentData {
  enrolled_at: string;
  progress_percentage: number;
  [key: string]: unknown;
}

function calculateRefundPolicy(
  transaction: TransactionData,
  enrollment: EnrollmentData
): RefundPolicy {
  const now = new Date();
  const enrolledDate = new Date(enrollment.enrolled_at);
  const daysSinceEnrollment = Math.floor(
    (now.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceEnrollment <= 7 && enrollment.progress_percentage === 0) {
    return {
      can_refund: true,
      refund_percentage: 100,
      reason: 'Full refund - Within 7 days with no progress',
    };
  }

  if (daysSinceEnrollment > 7 && daysSinceEnrollment <= 14 && enrollment.progress_percentage < 10) {
    return {
      can_refund: true,
      refund_percentage: 80,
      reason: 'Partial refund - 8-14 days with minimal progress',
    };
  }

  if (
    daysSinceEnrollment > 14 &&
    daysSinceEnrollment <= 30 &&
    enrollment.progress_percentage < 25
  ) {
    return {
      can_refund: true,
      refund_percentage: 50,
      reason: 'Partial refund - 15-30 days with low progress',
    };
  }

  if (daysSinceEnrollment > 30) {
    return {
      can_refund: false,
      refund_percentage: 0,
      reason: 'Refund period expired (more than 30 days)',
    };
  }

  if (enrollment.progress_percentage >= 25) {
    return {
      can_refund: false,
      refund_percentage: 0,
      reason: 'Significant course progress made (25% or more)',
    };
  }

  return {
    can_refund: false,
    refund_percentage: 0,
    reason: 'Does not meet refund criteria',
  };
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { transaction_id, reason, additional_notes } = body;

    if (!transaction_id || !reason) {
      return NextResponse.json(
        { error: 'Transaction ID and reason are required' },
        { status: 400 }
      );
    }

    const validReasons = [
      'course_not_as_expected',
      'technical_issues',
      'found_better_alternative',
      'personal_reasons',
      'other',
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid refund reason' }, { status: 400 });
    }

    const transactionResult = await sql`
      SELECT 
        t.*,
        c.title as course_title,
        c.price as course_price
      FROM transactions t
      JOIN courses c ON t.course_id = c.id
      WHERE t.id = ${transaction_id}
    `;

    if (transactionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = transactionResult.rows[0] as TransactionData;

    if (transaction.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (transaction.status !== 'success') {
      return NextResponse.json(
        { error: 'Can only refund successful transactions' },
        { status: 400 }
      );
    }

    const existingRefund = await sql`
      SELECT id FROM refunds
      WHERE transaction_id = ${transaction_id}
      AND status IN ('pending', 'approved', 'processing')
    `;

    if (existingRefund.rows.length > 0) {
      return NextResponse.json(
        { error: 'Refund request already exists for this transaction' },
        { status: 400 }
      );
    }

    const enrollmentResult = await sql`
      SELECT 
        e.*,
        COALESCE(
          (SELECT COUNT(*) * 100.0 / 
           (SELECT COUNT(*) FROM course_modules WHERE course_id = e.course_id)
           FROM user_progress 
           WHERE user_id = e.user_id 
           AND course_id = e.course_id 
           AND completed = true),
          0
        ) as progress_percentage
      FROM enrollments e
      WHERE e.user_id = ${transaction.user_id}
      AND e.course_id = ${transaction.course_id}
    `;

    if (enrollmentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const enrollment = enrollmentResult.rows[0] as EnrollmentData;
    const policy = calculateRefundPolicy(transaction, enrollment);

    if (!policy.can_refund) {
      return NextResponse.json(
        {
          error: 'Refund not eligible',
          reason: policy.reason,
        },
        { status: 400 }
      );
    }

    const refundAmount = (transaction.amount * policy.refund_percentage) / 100;

    const refundResult = await sql`
      INSERT INTO refunds (
        transaction_id,
        user_id,
        course_id,
        amount,
        refund_percentage,
        reason,
        additional_notes,
        status,
        policy_reason,
        requested_at
      )
      VALUES (
        ${transaction_id},
        ${transaction.user_id},
        ${transaction.course_id},
        ${refundAmount},
        ${policy.refund_percentage},
        ${reason},
        ${additional_notes || null},
        'pending',
        ${policy.reason},
        NOW()
      )
      RETURNING *
    `;

    const refund = refundResult.rows[0] as { id: string; [key: string]: unknown };

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
        'New Refund Request',
        'A user has requested a refund. Please review and process.',
        'admin_alert',
        ${refund.id},
        'refund'
      FROM users
      WHERE role = 'admin'
    `;

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
        'Refund Request Submitted',
        'Your refund request has been submitted and is under review. You will be notified once processed.',
        'refund_request',
        ${refund.id},
        'refund'
      )
    `;

    return NextResponse.json(
      {
        success: true,
        data: {
          refund_id: refund.id,
          amount: refundAmount,
          percentage: policy.refund_percentage,
          status: 'pending',
          policy_reason: policy.reason,
        },
        message: 'Refund request submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create refund error:', error);
    return NextResponse.json({ error: 'Failed to create refund request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        r.*,
        t.payment_method,
        t.payment_gateway,
        c.title as course_title,
        u.full_name as user_name,
        u.email as user_email
      FROM refunds r
      JOIN transactions t ON r.transaction_id = t.id
      JOIN courses c ON r.course_id = c.id
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (decoded.role !== 'admin') {
      query += ` AND r.user_id = $${params.length + 1}`;
      params.push(decoded.userId);
    }

    if (status) {
      query += ` AND r.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY r.requested_at DESC LIMIT $${params.length + 1} OFFSET $${
      params.length + 2
    }`;
    params.push(limit, offset);

    const result = await sql.query(query, params);

    let countQuery = 'SELECT COUNT(*) as total FROM refunds WHERE 1=1';
    const countParams: (string | number)[] = [];

    if (decoded.role !== 'admin') {
      countQuery += ` AND user_id = $${countParams.length + 1}`;
      countParams.push(decoded.userId);
    }

    if (status) {
      countQuery += ` AND status = $${countParams.length + 1}`;
      countParams.push(status);
    }

    const countResult = await sql.query(countQuery, countParams);

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total as string),
        page,
        limit,
        total_pages: Math.ceil(parseInt(countResult.rows[0].total as string) / limit),
      },
    });
  } catch (error) {
    console.error('Get refunds error:', error);
    return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { refund_id, action, admin_notes, refund_reference } = body;

    if (!refund_id || !action) {
      return NextResponse.json({ error: 'Refund ID and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const refundResult = await sql`
      SELECT r.*, t.payment_gateway, t.payment_reference
      FROM refunds r
      JOIN transactions t ON r.transaction_id = t.id
      WHERE r.id = ${refund_id}
    `;

    if (refundResult.rows.length === 0) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    const refund = refundResult.rows[0] as {
      id: string;
      status: string;
      transaction_id: string;
      user_id: string;
      course_id: string;
      amount: number;
      [key: string]: unknown;
    };

    if (refund.status !== 'pending') {
      return NextResponse.json({ error: 'Refund has already been processed' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await sql`
      UPDATE refunds
      SET 
        status = ${newStatus},
        admin_notes = ${admin_notes || null},
        refund_reference = ${refund_reference || null},
        processed_by = ${decoded.userId},
        processed_at = NOW()
      WHERE id = ${refund_id}
    `;

    if (action === 'approve') {
      await sql`
        UPDATE transactions
        SET status = 'refunded', updated_at = NOW()
        WHERE id = ${refund.transaction_id}
      `;

      await sql`
        UPDATE enrollments
        SET status = 'refunded', updated_at = NOW()
        WHERE user_id = ${refund.user_id}
        AND course_id = ${refund.course_id}
      `;
    }

    const notificationTitle = action === 'approve' ? 'Refund Approved' : 'Refund Request Rejected';

    const notificationMessage =
      action === 'approve'
        ? `Your refund of $${refund.amount} has been approved and will be processed within 3-5 business days.`
        : `Your refund request was not approved. ${
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
        ${refund.user_id},
        ${notificationTitle},
        ${notificationMessage},
        ${action === 'approve' ? 'refund_approved' : 'refund_rejected'},
        ${refund_id},
        'refund'
      )
    `;

    return NextResponse.json({
      success: true,
      message: `Refund ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error('Process refund error:', error);
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}
