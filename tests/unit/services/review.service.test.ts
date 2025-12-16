/**
 * Unit Tests for Review Service
 * Sesuai dengan rencana_pengujian.md: 11 test cases (UT-REV-001 s/d UT-REV-011)
 */

import { prismaMock } from '../../jest.setup';
import { testUsers, testCourses, testEnrollments, testReviews } from '../../fixtures/test-data';

import {
  createReview,
  updateReview,
  deleteReview,
  getCourseReviews,
  markReviewHelpful,
} from '@/services/review.service';

describe('Review Service', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // UT-REV-001
  it('UT-REV-001: createReview() - Buat review berhasil', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue({ ...testEnrollments.activeEnrollment, progress: 15 } as any);
    prismaMock.review.findFirst.mockResolvedValue(null);
    prismaMock.review.create.mockResolvedValue({ id: 'rev-id', rating: 5, user: {} } as any);
    prismaMock.review.findMany.mockResolvedValue([{ rating: 5 }] as any);
    prismaMock.course.update.mockResolvedValue({} as any);
    const result = await createReview('userId', 'courseId', { rating: 5 });
    expect(result).toHaveProperty('id');
  });

  // UT-REV-002
  it('UT-REV-002: createReview() - Belum terdaftar', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue(null);
    await expect(createReview('userId', 'courseId', { rating: 5 })).rejects.toThrow('harus terdaftar');
  });

  // UT-REV-003
  it('UT-REV-003: createReview() - Progress < 10%', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue({ ...testEnrollments.lowProgressEnrollment, progress: 5 } as any);
    await expect(createReview('userId', 'courseId', { rating: 5 })).rejects.toThrow('Selesaikan minimal 10%');
  });

  // UT-REV-004
  it('UT-REV-004: createReview() - Sudah pernah review', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue({ ...testEnrollments.activeEnrollment, progress: 50 } as any);
    prismaMock.review.findFirst.mockResolvedValue(testReviews.validReview as any);
    await expect(createReview('userId', 'courseId', { rating: 5 })).rejects.toThrow('sudah memberikan review');
  });

  // UT-REV-005
  it('UT-REV-005: createReview() - Rating invalid', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue({ ...testEnrollments.activeEnrollment, progress: 50 } as any);
    prismaMock.review.findFirst.mockResolvedValue(null);
    await expect(createReview('userId', 'courseId', { rating: 0 })).rejects.toThrow('Rating harus antara 1-5');
  });

  // UT-REV-006
  it('UT-REV-006: updateReview() - Update review berhasil', async () => {
    prismaMock.review.findUnique.mockResolvedValue(testReviews.validReview as any);
    prismaMock.review.update.mockResolvedValue({ ...testReviews.validReview, rating: 4, user: {} } as any);
    prismaMock.review.findMany.mockResolvedValue([{ rating: 4 }] as any);
    prismaMock.course.update.mockResolvedValue({} as any);
    const result = await updateReview(testReviews.validReview.id, testReviews.validReview.user_id, { rating: 4 });
    expect(result.rating).toBe(4);
  });

  // UT-REV-007
  it('UT-REV-007: updateReview() - Bukan pemilik review', async () => {
    prismaMock.review.findUnique.mockResolvedValue(testReviews.validReview as any);
    await expect(updateReview(testReviews.validReview.id, 'different-user', { rating: 4 }))
      .rejects.toThrow('Tidak memiliki akses');
  });

  // UT-REV-008
  it('UT-REV-008: deleteReview() - Hapus review berhasil', async () => {
    prismaMock.review.findUnique.mockResolvedValue(testReviews.validReview as any);
    prismaMock.review.delete.mockResolvedValue(testReviews.validReview as any);
    prismaMock.review.findMany.mockResolvedValue([] as any);
    prismaMock.course.update.mockResolvedValue({} as any);
    const result = await deleteReview(testReviews.validReview.id, testReviews.validReview.user_id);
    expect(result).toEqual({ success: true });
  });

  // UT-REV-009
  it('UT-REV-009: deleteReview() - Admin hapus review', async () => {
    prismaMock.review.findUnique.mockResolvedValue(testReviews.validReview as any);
    prismaMock.review.delete.mockResolvedValue(testReviews.validReview as any);
    prismaMock.review.findMany.mockResolvedValue([] as any);
    prismaMock.course.update.mockResolvedValue({} as any);
    const result = await deleteReview(testReviews.validReview.id, 'any-user', true);
    expect(result).toEqual({ success: true });
  });

  // UT-REV-010
  it('UT-REV-010: getCourseReviews() - Ambil reviews dengan pagination', async () => {
    prismaMock.review.findMany.mockResolvedValue([testReviews.validReview] as any);
    prismaMock.review.count.mockResolvedValue(1);
    (prismaMock.review.groupBy as jest.Mock).mockResolvedValue([{ rating: 5, _count: 1 }] as any);
    const result = await getCourseReviews('courseId', { page: 1, limit: 10 });
    expect(result.reviews).toHaveLength(1);
  });

  // UT-REV-011
  it('UT-REV-011: markReviewHelpful() - Tandai review helpful', async () => {
    prismaMock.review.update.mockResolvedValue({ ...testReviews.validReview, helpful_count: 11 } as any);
    const result = await markReviewHelpful(testReviews.validReview.id);
    expect(result.helpful_count).toBe(11);
  });
});
