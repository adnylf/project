/**
 * Integration Tests for Course API Routes
 * Sesuai dengan rencana_pengujian.md: 6 test cases (IT-CRS-001 s/d IT-CRS-006)
 */

import { NextRequest } from 'next/server';
import { prismaMock } from '../../jest.setup';
import { testCourses, testEnrollments } from '../../fixtures/test-data';
import { EnrollmentStatus } from '@prisma/client';

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn().mockReturnValue({ userId: 'user-id', email: 'test@test.com', role: 'STUDENT' }),
}));

describe('Course API Routes', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // IT-CRS-001
  it('IT-CRS-001: GET /api/courses - Ambil semua kursus published', async () => {
    const { GET } = await import('@/app/api/courses/route');
    prismaMock.course.findMany.mockResolvedValue([testCourses.freeCourse] as any);
    prismaMock.course.count.mockResolvedValue(1);
    
    const req = new NextRequest('http://localhost/api/courses');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // IT-CRS-002
  it('IT-CRS-002: GET /api/courses - Filter by category', async () => {
    const { GET } = await import('@/app/api/courses/route');
    prismaMock.course.findMany.mockResolvedValue([testCourses.freeCourse] as any);
    prismaMock.course.count.mockResolvedValue(1);
    
    const req = new NextRequest('http://localhost/api/courses?categoryId=cat-id');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // IT-CRS-003
  it('IT-CRS-003: GET /api/courses/[id] - Ambil detail kursus', async () => {
    const { GET } = await import('@/app/api/courses/[id]/route');
    prismaMock.course.findUnique.mockResolvedValue({ ...testCourses.freeCourse, category: {}, mentor: { user: {} }, sections: [] } as any);
    
    const req = new NextRequest('http://localhost/api/courses/course-id');
    const res = await GET(req, { params: { id: 'course-id' } });
    expect(res.status).toBe(200);
  });

  // IT-CRS-004
  it('IT-CRS-004: GET /api/courses/[id] - Kursus tidak ada', async () => {
    const { GET } = await import('@/app/api/courses/[id]/route');
    prismaMock.course.findUnique.mockResolvedValue(null);
    
    const req = new NextRequest('http://localhost/api/courses/invalid');
    const res = await GET(req, { params: { id: 'invalid' } });
    expect(res.status).toBe(404);
  });

  // IT-CRS-005
  it('IT-CRS-005: POST /api/courses/[id]/enroll - Enroll kursus gratis', async () => {
    const { POST } = await import('@/app/api/courses/[id]/enroll/route');
    prismaMock.course.findUnique.mockResolvedValue(testCourses.freeCourse as any);
    prismaMock.enrollment.findUnique.mockResolvedValue(null);
    prismaMock.enrollment.create.mockResolvedValue({ id: 'enr-id', status: EnrollmentStatus.ACTIVE } as any);
    prismaMock.course.update.mockResolvedValue({} as any);
    
    const req = new NextRequest('http://localhost/api/courses/course-id/enroll', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer token' },
    });
    const res = await POST(req, { params: { id: 'course-id' } });
    expect(res.status).toBe(201);
  });

  // IT-CRS-006
  it('IT-CRS-006: POST /api/courses/[id]/enroll - Tanpa auth', async () => {
    const { POST } = await import('@/app/api/courses/[id]/enroll/route');
    
    const req = new NextRequest('http://localhost/api/courses/course-id/enroll', {
      method: 'POST',
    });
    const res = await POST(req, { params: { id: 'course-id' } });
    expect(res.status).toBe(401);
  });
});
