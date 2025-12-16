/**
 * Unit Tests for User Service
 * Sesuai dengan rencana_pengujian.md: 15 test cases (UT-USR-001 s/d UT-USR-015)
 */

import bcrypt from 'bcryptjs';
import { prismaMock } from '../../jest.setup';
import { testUsers, testCourses } from '../../fixtures/test-data';
import { UserRole, UserStatus } from '@prisma/client';

import {
  getUserById,
  updateProfile,
  updateAvatar,
  getUsers,
  updateUserStatus,
  deleteUser,
  getUserStats,
  emailExists,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from '@/services/user.service';

jest.mock('bcryptjs', () => ({ hash: jest.fn() }));

describe('User Service', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // UT-USR-001
  it('UT-USR-001: getUserById() - Ambil user dengan ID valid', async () => {
    prismaMock.user.findUnique.mockResolvedValue(testUsers.student as any);
    const result = await getUserById(testUsers.student.id);
    expect(result?.id).toBe(testUsers.student.id);
  });

  // UT-USR-002
  it('UT-USR-002: getUserById() - User tidak ditemukan', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const result = await getUserById('invalid-id');
    expect(result).toBeNull();
  });

  // UT-USR-003
  it('UT-USR-003: updateProfile() - Update profile berhasil', async () => {
    prismaMock.user.update.mockResolvedValue({ ...testUsers.student, full_name: 'Updated' } as any);
    const result = await updateProfile('userId', { full_name: 'Updated' });
    expect(result.full_name).toBe('Updated');
  });

  // UT-USR-004
  it('UT-USR-004: updateAvatar() - Update avatar berhasil', async () => {
    prismaMock.user.update.mockResolvedValue({ id: 'userId', avatar_url: '/new-avatar.jpg' } as any);
    const result = await updateAvatar('userId', '/new-avatar.jpg');
    expect(result.avatar_url).toBe('/new-avatar.jpg');
  });

  // UT-USR-005
  it('UT-USR-005: getUsers() - Admin ambil daftar users', async () => {
    prismaMock.user.findMany.mockResolvedValue([testUsers.student] as any);
    prismaMock.user.count.mockResolvedValue(1);
    const result = await getUsers({});
    expect(result.users).toHaveLength(1);
  });

  // UT-USR-006
  it('UT-USR-006: getUsers() - Filter by role', async () => {
    prismaMock.user.findMany.mockResolvedValue([testUsers.student] as any);
    prismaMock.user.count.mockResolvedValue(1);
    await getUsers({ role: UserRole.STUDENT });
    expect(prismaMock.user.findMany).toHaveBeenCalled();
  });

  // UT-USR-007
  it('UT-USR-007: updateUserStatus() - Update status user', async () => {
    prismaMock.user.update.mockResolvedValue({ ...testUsers.student, status: UserStatus.SUSPENDED } as any);
    const result = await updateUserStatus('userId', UserStatus.SUSPENDED);
    expect(result.status).toBe(UserStatus.SUSPENDED);
  });

  // UT-USR-008
  it('UT-USR-008: deleteUser() - Hapus user', async () => {
    prismaMock.user.delete.mockResolvedValue(testUsers.student as any);
    const result = await deleteUser('userId');
    expect(result).toBeDefined();
  });

  // UT-USR-009
  it('UT-USR-009: getUserStats() - Ambil statistik user', async () => {
    prismaMock.enrollment.count.mockResolvedValue(5);
    prismaMock.certificate.count.mockResolvedValue(2);
    prismaMock.review.count.mockResolvedValue(3);
    const result = await getUserStats('userId');
    expect(result).toHaveProperty('total_enrollments');
  });

  // UT-USR-010
  it('UT-USR-010: emailExists() - Email sudah ada', async () => {
    prismaMock.user.findUnique.mockResolvedValue(testUsers.student as any);
    const result = await emailExists('existing@test.com');
    expect(result).toBe(true);
  });

  // UT-USR-011
  it('UT-USR-011: emailExists() - Email belum ada', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const result = await emailExists('new@test.com');
    expect(result).toBe(false);
  });

  // UT-USR-012
  it('UT-USR-012: addToWishlist() - Tambah ke wishlist', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValue(null);
    prismaMock.wishlist.create.mockResolvedValue({ id: 'wl-id' } as any);
    const result = await addToWishlist('userId', 'courseId');
    expect(result).toHaveProperty('id');
  });

  // UT-USR-013
  it('UT-USR-013: addToWishlist() - Sudah ada di wishlist', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValue({ id: 'existing' } as any);
    await expect(addToWishlist('userId', 'courseId')).rejects.toThrow('sudah ada di wishlist');
  });

  // UT-USR-014
  it('UT-USR-014: removeFromWishlist() - Hapus dari wishlist', async () => {
    prismaMock.wishlist.delete.mockResolvedValue({ id: 'wl-id' } as any);
    const result = await removeFromWishlist('userId', 'courseId');
    expect(result).toBeDefined();
  });

  // UT-USR-015
  it('UT-USR-015: getWishlist() - Ambil wishlist user', async () => {
    prismaMock.wishlist.findMany.mockResolvedValue([{ id: 'wl-id', course: testCourses.freeCourse }] as any);
    const result = await getWishlist('userId');
    expect(result).toHaveLength(1);
  });
});
