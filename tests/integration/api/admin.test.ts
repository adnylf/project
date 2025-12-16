/**
 * Integration Tests for Admin API Routes
 * Sesuai dengan rencana_pengujian.md: 4 test cases (IT-ADM-001 s/d IT-ADM-004)
 */

import { NextRequest } from 'next/server';
import { prismaMock } from '../../jest.setup';
import { testUsers, testCourses, testMentorProfiles } from '../../fixtures/test-data';
import { CourseStatus, MentorStatus, UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
}));

const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('Admin API Routes', () => {
  beforeEach(() => { 
    jest.clearAllMocks();
    // Default: return admin user
    mockedJwt.verify.mockReturnValue({ userId: 'admin-id', email: 'admin@test.com', role: 'ADMIN' });
  });

  // IT-ADM-001
  it('IT-ADM-001: GET /api/admin/users - Ambil semua users (Admin token)', async () => {
    const { GET } = await import('@/app/api/admin/users/route');
    prismaMock.user.findMany.mockResolvedValue([testUsers.student] as any);
    prismaMock.user.count.mockResolvedValue(1);
    
    const req = new NextRequest('http://localhost/api/admin/users', {
      headers: { 'Authorization': 'Bearer admin-token' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // IT-ADM-002
  it('IT-ADM-002: GET /api/admin/users - Akses tanpa admin (Student token)', async () => {
    mockedJwt.verify.mockReturnValue({ userId: 'student-id', email: 'student@test.com', role: 'STUDENT' });
    
    const { GET } = await import('@/app/api/admin/users/route');
    
    const req = new NextRequest('http://localhost/api/admin/users', {
      headers: { 'Authorization': 'Bearer student-token' },
    });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  // IT-ADM-003: approve menggunakan PUT, bukan PATCH
  it('IT-ADM-003: PUT /api/admin/courses/[id]/approve - Approve kursus', async () => {
    const { PUT } = await import('@/app/api/admin/courses/[id]/approve/route');
    prismaMock.course.findUnique.mockResolvedValue({ ...testCourses.pendingCourse, mentor: { user: testUsers.mentor } } as any);
    prismaMock.course.update.mockResolvedValue({ ...testCourses.pendingCourse, status: CourseStatus.PUBLISHED } as any);
    
    const req = new NextRequest('http://localhost/api/admin/courses/course-id/approve', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer admin-token' },
    });
    const res = await PUT(req, { params: { id: 'course-id' } });
    expect(res.status).toBe(200);
  });

  // IT-ADM-004: approve mentor menggunakan PUT
  it('IT-ADM-004: PUT /api/admin/mentors/[id]/approve - Approve mentor', async () => {
    const { PUT } = await import('@/app/api/admin/mentors/[id]/approve/route');
    prismaMock.mentorProfile.findUnique.mockResolvedValue(testMentorProfiles.pending as any);
    prismaMock.$transaction.mockResolvedValue([
      { ...testMentorProfiles.pending, status: MentorStatus.APPROVED },
      testUsers.mentor
    ] as any);
    
    const req = new NextRequest('http://localhost/api/admin/mentors/mentor-id/approve', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer admin-token' },
    });
    const res = await PUT(req, { params: { id: 'mentor-id' } });
    expect(res.status).toBe(200);
  });
});
