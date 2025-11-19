import { NextRequest, NextResponse } from 'next/server';
import transactionService from '@/services/transaction.service';
import { verifyToken } from '@/lib/auth';

interface DateFilter {
  start_date?: Date;
  end_date?: Date;
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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const filters: DateFilter = {};

    if (startDate) {
      filters.start_date = new Date(startDate);
    }

    if (endDate) {
      filters.end_date = new Date(endDate);
    }

    const userId = decoded.role === 'admin' ? undefined : decoded.userId;
    const stats = await transactionService.getTransactionStats(userId, filters);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('GET transaction stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction statistics' }, { status: 500 });
  }
}
