import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import transactionService from '@/services/transaction.service';
import { verifyToken } from '@/lib/auth';

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
    const status = searchParams.get('status') || undefined;
    let limit = parseInt(searchParams.get('limit') || '10');
    let page = parseInt(searchParams.get('page') || '1');

    // Validate pagination parameters
    if (limit < 1 || limit > 100 || isNaN(limit)) limit = 10;
    if (page < 1 || isNaN(page)) page = 1;

    const offset = (page - 1) * limit;

    const { transactions, total } = await transactionService.getUserTransactions(decoded.userId, {
      status,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
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
    const { course_id, payment_method, payment_gateway } = body;

    if (!course_id || !payment_method || !payment_gateway) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validPaymentMethods = ['credit_card', 'bank_transfer', 'e_wallet', 'qris'];
    if (!validPaymentMethods.includes(payment_method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    const validGateways = ['midtrans', 'xendit', 'manual'];
    if (!validGateways.includes(payment_gateway)) {
      return NextResponse.json({ error: 'Invalid payment gateway' }, { status: 400 });
    }

    const courseResult = await sql`
      SELECT id, title, price, is_active
      FROM courses
      WHERE id = ${course_id}
    `;

    if (courseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const course = courseResult.rows[0] as {
      id: string;
      title: string;
      price: number;
      is_active: boolean;
    };

    if (!course.is_active) {
      return NextResponse.json({ error: 'Course is not available' }, { status: 400 });
    }

    const enrollmentCheck = await sql`
      SELECT id FROM enrollments
      WHERE user_id = ${decoded.userId}
      AND course_id = ${course_id}
      AND status = 'active'
    `;

    if (enrollmentCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 });
    }

    const existingTransaction = await sql`
      SELECT id FROM transactions
      WHERE user_id = ${decoded.userId}
      AND course_id = ${course_id}
      AND status IN ('pending', 'processing')
      AND expired_at > NOW()
    `;

    if (existingTransaction.rows.length > 0) {
      return NextResponse.json(
        { error: 'You have a pending transaction for this course' },
        { status: 400 }
      );
    }

    const transaction = await transactionService.createTransaction({
      user_id: decoded.userId,
      course_id,
      amount: course.price,
      payment_method,
      payment_gateway,
    });

    return NextResponse.json(
      {
        success: true,
        data: transaction,
        message: 'Transaction created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST transaction error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
