/**
 * Unit Tests for Transaction Service
 * Sesuai dengan rencana_pengujian.md: 4 test cases (UT-TRX-001 s/d UT-TRX-004)
 */

import { prismaMock } from '../../jest.setup';
import { testUsers, testCourses, testTransactions } from '../../fixtures/test-data';
import { TransactionStatus, PaymentMethod, CourseStatus } from '@prisma/client';

import {
  createTransaction,
  getTransactionById,
  updateTransactionStatus,
  getUserTransactions,
} from '@/services/transaction.service';

describe('Transaction Service', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // UT-TRX-001
  it('UT-TRX-001: createTransaction() - Buat transaksi baru', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ ...testCourses.paidCourse, status: CourseStatus.PUBLISHED } as any);
    prismaMock.enrollment.findUnique.mockResolvedValue(null); // Not enrolled
    prismaMock.transaction.findFirst.mockResolvedValue(null); // No pending transaction
    prismaMock.transaction.create.mockResolvedValue({ 
      id: 'trx-id', 
      order_id: 'ORD-123',
      status: TransactionStatus.PENDING 
    } as any);
    
    const result = await createTransaction(testUsers.student.id, testCourses.paidCourse.id, PaymentMethod.QRIS);
    expect(result).toHaveProperty('order_id');
  });

  // UT-TRX-002
  it('UT-TRX-002: getTransactionById() - Ambil transaksi valid', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue(testTransactions.pendingTransaction as any);
    const result = await getTransactionById(testTransactions.pendingTransaction.id);
    expect(result).toBeDefined();
  });

  // UT-TRX-003: updateTransactionStatus menggunakan orderId
  it('UT-TRX-003: updateTransactionStatus() - Update status ke PAID', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue(testTransactions.pendingTransaction as any);
    prismaMock.transaction.update.mockResolvedValue({ 
      ...testTransactions.pendingTransaction, 
      status: TransactionStatus.PAID,
      paid_at: new Date()
    } as any);
    prismaMock.enrollment.create.mockResolvedValue({} as any);
    prismaMock.course.update.mockResolvedValue({} as any);
    
    // Note: updateTransactionStatus uses orderId, not transactionId
    const result = await updateTransactionStatus(testTransactions.pendingTransaction.order_id, TransactionStatus.PAID);
    expect(result.status).toBe(TransactionStatus.PAID);
  });

  // UT-TRX-004
  it('UT-TRX-004: getUserTransactions() - Ambil transaksi user', async () => {
    prismaMock.transaction.findMany.mockResolvedValue([testTransactions.pendingTransaction] as any);
    prismaMock.transaction.count.mockResolvedValue(1);
    const result = await getUserTransactions(testUsers.student.id, {});
    expect(result.transactions).toHaveLength(1);
  });
});
