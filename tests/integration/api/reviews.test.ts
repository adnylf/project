/**
 * Integration Tests for Review API Routes
 * Sesuai dengan rencana_pengujian.md: 4 test cases (IT-REV-001 s/d IT-REV-004)
 * 
 * Note: Berdasarkan struktur API yang ada:
 * - GET /api/reviews/[id] - Ambil review by id  
 * - GET /api/users/reviews - Get user's reviews
 * - PUT/DELETE tidak ada di route users/reviews, ada di users/reviews/[id]
 */

import { NextRequest } from 'next/server';
import { prismaMock } from '../../jest.setup';
import { testReviews, testEnrollments, testCourses } from '../../fixtures/test-data';

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn().mockReturnValue({ userId: 'user-student-001', email: 'student@test.com', role: 'STUDENT' }),
}));

describe('Review API Routes', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // IT-REV-001: GET /api/reviews/[id] - Ambil reviews kursus
  it('IT-REV-001: GET /api/reviews/[id] - Ambil reviews kursus', async () => {
    const { GET } = await import('@/app/api/reviews/[id]/route');
    prismaMock.review.findMany.mockResolvedValue([{ ...testReviews.validReview, user: { full_name: 'Test', avatar_url: null } }] as any);
    prismaMock.review.count.mockResolvedValue(1);
    (prismaMock.review.groupBy as jest.Mock).mockResolvedValue([{ rating: 5, _count: { _all: 1 } }] as any);
    
    const req = new NextRequest('http://localhost/api/reviews/course-id');
    const res = await GET(req, { params: { id: 'course-id' } });
    expect(res.status).toBe(200);
  });

  // IT-REV-002: Buat review baru via courses/[id]/reviews
  it('IT-REV-002: POST - Buat review baru', async () => {
    // Test createReview from review.service directly since there's no POST route
    // atau test via service layer
    prismaMock.enrollment.findUnique.mockResolvedValue({ ...testEnrollments.activeEnrollment, progress: 50 } as any);
    prismaMock.review.findFirst.mockResolvedValue(null);
    prismaMock.review.create.mockResolvedValue({ id: 'rev-id', rating: 5, user: {} } as any);
    prismaMock.review.findMany.mockResolvedValue([{ rating: 5 }] as any);
    prismaMock.course.update.mockResolvedValue({} as any);
    
    // Import service directly
    const { createReview } = await import('@/services/review.service');
    const result = await createReview('user-student-001', 'course-id', { rating: 5, comment: 'Great!' });
    expect(result).toHaveProperty('id');
  });

  // IT-REV-003: PUT /api/users/reviews/[id] - Update review
  it('IT-REV-003: PUT /api/users/reviews/[id] - Update review', async () => {
    const { PUT } = await import('@/app/api/users/reviews/[id]/route');
    prismaMock.review.findUnique.mockResolvedValue(testReviews.validReview as any);
    prismaMock.review.update.mockResolvedValue({ ...testReviews.validReview, rating: 4, comment: 'Updated' } as any);
    
    const req = new NextRequest('http://localhost/api/users/reviews/review-id', {
      method: 'PUT',
      body: JSON.stringify({ rating: 4, comment: 'Updated' }),
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' },
    });
    const res = await PUT(req, { params: { id: 'review-id' } });
    expect(res.status).toBe(200);
  });

  // IT-REV-004: DELETE /api/users/reviews/[id] - Hapus review
  it('IT-REV-004: DELETE /api/users/reviews/[id] - Hapus review', async () => {
    const { DELETE } = await import('@/app/api/users/reviews/[id]/route');
    prismaMock.review.findUnique.mockResolvedValue(testReviews.validReview as any);
    prismaMock.review.delete.mockResolvedValue(testReviews.validReview as any);
    prismaMock.review.findMany.mockResolvedValue([] as any);
    prismaMock.course.update.mockResolvedValue({} as any);
    
    const req = new NextRequest('http://localhost/api/users/reviews/review-id', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer token' },
    });
    const res = await DELETE(req, { params: { id: 'review-id' } });
    expect(res.status).toBe(200);
  });
});
