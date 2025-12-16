/**
 * Integration Tests for User API Routes
 * Sesuai dengan rencana_pengujian.md: 5 test cases (IT-USR-001 s/d IT-USR-005)
 */

import { NextRequest } from 'next/server';
import { prismaMock } from '../../jest.setup';
import { testUsers, testEnrollments, testCourses } from '../../fixtures/test-data';

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn().mockReturnValue({ userId: 'user-student-001', email: 'student@test.com', role: 'STUDENT' }),
}));

describe('User API Routes', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // IT-USR-001
  it('IT-USR-001: GET /api/users/profile - Ambil profil sendiri', async () => {
    const { GET } = await import('@/app/api/users/profile/route');
    prismaMock.user.findUnique.mockResolvedValue(testUsers.student as any);
    
    const req = new NextRequest('http://localhost/api/users/profile', {
      headers: { 'Authorization': 'Bearer token' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // IT-USR-002
  it('IT-USR-002: PUT /api/users/profile - Update profil', async () => {
    const { PUT } = await import('@/app/api/users/profile/route');
    prismaMock.user.update.mockResolvedValue({ ...testUsers.student, full_name: 'Updated' } as any);
    
    const req = new NextRequest('http://localhost/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ full_name: 'Updated' }),
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' },
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
  });

  // IT-USR-003
  it('IT-USR-003: GET /api/users/enrollments - Ambil enrollments', async () => {
    const { GET } = await import('@/app/api/users/enrollments/route');
    prismaMock.enrollment.findMany.mockResolvedValue([{ ...testEnrollments.activeEnrollment, course: testCourses.freeCourse }] as any);
    prismaMock.enrollment.count.mockResolvedValue(1);
    
    const req = new NextRequest('http://localhost/api/users/enrollments', {
      headers: { 'Authorization': 'Bearer token' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // IT-USR-004
  it('IT-USR-004: GET /api/users/wishlist - Ambil wishlist', async () => {
    const { GET } = await import('@/app/api/users/wishlist/route');
    prismaMock.wishlist.findMany.mockResolvedValue([{ id: 'wl-id', course: testCourses.freeCourse }] as any);
    
    const req = new NextRequest('http://localhost/api/users/wishlist', {
      headers: { 'Authorization': 'Bearer token' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // IT-USR-005
  it('IT-USR-005: POST /api/users/wishlist - Tambah ke wishlist', async () => {
    const { POST } = await import('@/app/api/users/wishlist/route');
    prismaMock.wishlist.findUnique.mockResolvedValue(null);
    prismaMock.wishlist.create.mockResolvedValue({ id: 'wl-id' } as any);
    
    const req = new NextRequest('http://localhost/api/users/wishlist', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'course-id' }),
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});
