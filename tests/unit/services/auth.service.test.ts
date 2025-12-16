/**
 * Unit Tests for Auth Service
 * Sesuai dengan rencana_pengujian.md: 13 test cases (UT-AUTH-001 s/d UT-AUTH-013)
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../../jest.setup';
import { testUsers, testPasswords, testTokens } from '../../fixtures/test-data';
import { UserRole, UserStatus } from '@prisma/client';

import {
  register,
  login,
  generateToken,
  verifyToken,
  changePassword,
  verifyEmail,
} from '@/services/auth.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe('Auth Service', () => {
  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
  const mockedJwt = jwt as jest.Mocked<typeof jwt>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // UT-AUTH-001
  it('UT-AUTH-001: register() - Registrasi user baru berhasil', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
    const createdUser = {
      id: 'new-user-id',
      email: 'test@example.com',
      password: 'hashedPassword123',
      full_name: 'Test User',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      avatar_url: null,
      bio: null, phone: null, date_of_birth: null, address: null, city: null,
      disability_type: null, email_verified: false, email_verified_at: null,
      last_login: null, created_at: new Date(), updated_at: new Date(),
    };
    prismaMock.user.create.mockResolvedValue(createdUser);
    mockedJwt.sign.mockReturnValue('jwt-token-xxx' as never);

    const result = await register({ email: 'test@example.com', password: 'Test123!', full_name: 'Test User' });
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('token');
  });

  // UT-AUTH-002
  it('UT-AUTH-002: register() - Email sudah terdaftar', async () => {
    prismaMock.user.findUnique.mockResolvedValue(testUsers.student);
    await expect(register({ email: 'existing@example.com', password: 'Test123!', full_name: 'Test' }))
      .rejects.toThrow('Email sudah terdaftar');
  });

  // UT-AUTH-003
  it('UT-AUTH-003: login() - Login berhasil', async () => {
    prismaMock.user.findUnique.mockResolvedValue(testUsers.student);
    mockedBcrypt.compare.mockResolvedValue(true as never);
    prismaMock.user.update.mockResolvedValue(testUsers.student);
    mockedJwt.sign.mockReturnValue('jwt-token-xxx' as never);

    const result = await login('test@example.com', 'Test123!');
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('token');
  });

  // UT-AUTH-004
  it('UT-AUTH-004: login() - Email tidak ditemukan', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(login('notfound@example.com', 'password')).rejects.toThrow('Email atau password salah');
  });

  // UT-AUTH-005
  it('UT-AUTH-005: login() - Password salah', async () => {
    prismaMock.user.findUnique.mockResolvedValue(testUsers.student);
    mockedBcrypt.compare.mockResolvedValue(false as never);
    await expect(login('test@example.com', 'wrong')).rejects.toThrow('Email atau password salah');
  });

  // UT-AUTH-006
  it('UT-AUTH-006: login() - Akun suspended', async () => {
    prismaMock.user.findUnique.mockResolvedValue(testUsers.suspendedUser);
    await expect(login('suspended@example.com', 'password')).rejects.toThrow('Akun Anda telah dinonaktifkan');
  });

  // UT-AUTH-007
  it('UT-AUTH-007: generateToken() - Generate token valid', () => {
    mockedJwt.sign.mockReturnValue('generated-jwt-token' as never);
    const token = generateToken({ id: 'user-id', email: 'test@test.com', role: UserRole.STUDENT });
    expect(token).toBe('generated-jwt-token');
  });

  // UT-AUTH-008
  it('UT-AUTH-008: verifyToken() - Verify token valid', () => {
    const payload = { userId: 'user-id', email: 'test@test.com', role: UserRole.STUDENT };
    mockedJwt.verify.mockReturnValue(payload as never);
    const result = verifyToken('valid-token');
    expect(result).toEqual(payload);
  });

  // UT-AUTH-009
  it('UT-AUTH-009: verifyToken() - Verify token invalid', () => {
    mockedJwt.verify.mockImplementation(() => { throw new Error('Invalid'); });
    const result = verifyToken('invalid');
    expect(result).toBeNull();
  });

  // UT-AUTH-010
  it('UT-AUTH-010: changePassword() - Ganti password berhasil', async () => {
    prismaMock.user.findUnique.mockResolvedValue(testUsers.student);
    mockedBcrypt.compare.mockResolvedValue(true as never);
    mockedBcrypt.hash.mockResolvedValue('newHashedPassword' as never);
    prismaMock.user.update.mockResolvedValue(testUsers.student);

    const result = await changePassword('userId', 'currentPassword', 'newPassword');
    expect(result).toEqual({ success: true });
  });

  // UT-AUTH-011
  it('UT-AUTH-011: changePassword() - Password lama salah', async () => {
    prismaMock.user.findUnique.mockResolvedValue(testUsers.student);
    mockedBcrypt.compare.mockResolvedValue(false as never);
    await expect(changePassword('userId', 'wrongPassword', 'newPassword')).rejects.toThrow('Password saat ini salah');
  });

  // UT-AUTH-012
  it('UT-AUTH-012: verifyEmail() - Verifikasi email berhasil', async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(testTokens.validToken);
    prismaMock.user.update.mockResolvedValue(testUsers.student);
    prismaMock.verificationToken.update.mockResolvedValue({ ...testTokens.validToken, used_at: new Date() });

    const result = await verifyEmail('valid-token');
    expect(result).toEqual({ success: true });
  });

  // UT-AUTH-013
  it('UT-AUTH-013: verifyEmail() - Token expired', async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(testTokens.expiredToken);
    await expect(verifyEmail('expired-token')).rejects.toThrow('Token sudah kadaluarsa');
  });
});
