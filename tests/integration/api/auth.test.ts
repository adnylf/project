/**
 * Integration Tests for Auth API Routes
 * Sesuai dengan rencana_pengujian.md: 5 test cases (IT-AUTH-001 s/d IT-AUTH-005)
 */

import { NextRequest } from 'next/server';
import { prismaMock } from '../../jest.setup';
import { testUsers, testPasswords } from '../../fixtures/test-data';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'user-id', email: 'test@test.com', role: 'STUDENT' }),
}));

describe('Auth API Routes', () => {
  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
  beforeEach(() => { jest.clearAllMocks(); });

  // IT-AUTH-001
  it('IT-AUTH-001: POST /api/auth/register - Registrasi berhasil', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    prismaMock.user.findUnique.mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue('hashed' as never);
    prismaMock.user.create.mockResolvedValue({ id: 'new-id', email: 'test@test.com', role: UserRole.STUDENT } as any);
    
    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'Test123!', full_name: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  // IT-AUTH-002
  it('IT-AUTH-002: POST /api/auth/register - Email duplikat', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    prismaMock.user.findUnique.mockResolvedValue(testUsers.student);
    
    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'existing@test.com', password: 'Test123!', full_name: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // IT-AUTH-003
  it('IT-AUTH-003: POST /api/auth/login - Login berhasil', async () => {
    const { POST } = await import('@/app/api/auth/login/route');
    prismaMock.user.findUnique.mockResolvedValue(testUsers.student);
    mockedBcrypt.compare.mockResolvedValue(true as never);
    prismaMock.user.update.mockResolvedValue(testUsers.student);
    
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'Test123!' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  // IT-AUTH-004
  it('IT-AUTH-004: POST /api/auth/login - Credentials invalid', async () => {
    const { POST } = await import('@/app/api/auth/login/route');
    prismaMock.user.findUnique.mockResolvedValue(testUsers.student);
    mockedBcrypt.compare.mockResolvedValue(false as never);
    
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  // IT-AUTH-005
  it('IT-AUTH-005: POST /api/auth/change-password - Ganti password', async () => {
    const { POST } = await import('@/app/api/auth/change-password/route');
    prismaMock.user.findUnique.mockResolvedValue(testUsers.student);
    mockedBcrypt.compare.mockResolvedValue(true as never);
    mockedBcrypt.hash.mockResolvedValue('newHashed' as never);
    prismaMock.user.update.mockResolvedValue(testUsers.student);
    
    const req = new NextRequest('http://localhost/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: 'old', newPassword: 'New123!' }),
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
