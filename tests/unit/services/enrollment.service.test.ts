/**
 * Unit Tests for Enrollment Service
 * Sesuai dengan rencana_pengujian.md: 11 test cases (UT-ENR-001 s/d UT-ENR-011)
 */

import { prismaMock } from '../../jest.setup';
import { testUsers, testCourses, testEnrollments } from '../../fixtures/test-data';
import { EnrollmentStatus, CourseStatus } from '@prisma/client';

import {
  enrollUser,
  getUserEnrollments,
  isUserEnrolled,
  updateProgress,
  updateEnrollmentProgress,
  getContinueLearning,
} from '@/services/enrollment.service';

describe('Enrollment Service', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // UT-ENR-001
  it('UT-ENR-001: enrollUser() - Enroll kursus gratis berhasil', async () => {
    prismaMock.course.findUnique.mockResolvedValue(testCourses.freeCourse as any);
    prismaMock.enrollment.findUnique.mockResolvedValue(null);
    prismaMock.enrollment.create.mockResolvedValue({ id: 'enr-id', status: EnrollmentStatus.ACTIVE } as any);
    prismaMock.course.update.mockResolvedValue({} as any);
    const result = await enrollUser('userId', testCourses.freeCourse.id);
    expect(result.status).toBe(EnrollmentStatus.ACTIVE);
  });

  // UT-ENR-002
  it('UT-ENR-002: enrollUser() - Kursus tidak ditemukan', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);
    await expect(enrollUser('userId', 'invalid')).rejects.toThrow('Kursus tidak ditemukan');
  });

  // UT-ENR-003
  it('UT-ENR-003: enrollUser() - Kursus belum published', async () => {
    prismaMock.course.findUnique.mockResolvedValue(testCourses.draftCourse as any);
    await expect(enrollUser('userId', testCourses.draftCourse.id)).rejects.toThrow('Kursus tidak tersedia');
  });

  // UT-ENR-004
  it('UT-ENR-004: enrollUser() - Sudah terdaftar', async () => {
    prismaMock.course.findUnique.mockResolvedValue(testCourses.freeCourse as any);
    prismaMock.enrollment.findUnique.mockResolvedValue(testEnrollments.activeEnrollment as any);
    await expect(enrollUser('userId', testCourses.freeCourse.id)).rejects.toThrow('Anda sudah terdaftar');
  });

  // UT-ENR-005
  it('UT-ENR-005: enrollUser() - Kursus berbayar', async () => {
    prismaMock.course.findUnique.mockResolvedValue(testCourses.paidCourse as any);
    prismaMock.enrollment.findUnique.mockResolvedValue(null);
    await expect(enrollUser('userId', testCourses.paidCourse.id)).rejects.toThrow('pembayaran');
  });

  // UT-ENR-006
  it('UT-ENR-006: getUserEnrollments() - Ambil enrollments user', async () => {
    prismaMock.enrollment.findMany.mockResolvedValue([testEnrollments.activeEnrollment] as any);
    prismaMock.enrollment.count.mockResolvedValue(1);
    const result = await getUserEnrollments('userId', {});
    expect(result.enrollments).toHaveLength(1);
  });

  // UT-ENR-007
  it('UT-ENR-007: isUserEnrolled() - User sudah enrolled', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue(testEnrollments.activeEnrollment as any);
    const result = await isUserEnrolled('userId', 'courseId');
    expect(result).toBe(true);
  });

  // UT-ENR-008
  it('UT-ENR-008: isUserEnrolled() - User belum enrolled', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue(null);
    const result = await isUserEnrolled('userId', 'courseId');
    expect(result).toBe(false);
  });

  // UT-ENR-009
  it('UT-ENR-009: updateProgress() - Update progress material', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue(testEnrollments.activeEnrollment as any);
    prismaMock.progress.upsert.mockResolvedValue({ id: 'prog-id', is_completed: true } as any);
    prismaMock.enrollment.findUnique.mockResolvedValue({ ...testEnrollments.activeEnrollment, course: { sections: [{ materials: [{}] }] }, progress_records: [{ is_completed: true }] } as any);
    prismaMock.enrollment.update.mockResolvedValue({} as any);
    const result = await updateProgress(testEnrollments.activeEnrollment.id, 'mat-id', testUsers.student.id, { is_completed: true });
    expect(result).toHaveProperty('is_completed');
  });

  // UT-ENR-010
  it('UT-ENR-010: updateEnrollmentProgress() - Hitung progress keseluruhan', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue({
      ...testEnrollments.activeEnrollment,
      course: { sections: [{ materials: [{ id: 'm1' }, { id: 'm2' }] }] },
      progress_records: [{ is_completed: true }, { is_completed: false }]
    } as any);
    prismaMock.enrollment.update.mockResolvedValue({} as any);
    await updateEnrollmentProgress(testEnrollments.activeEnrollment.id);
    expect(prismaMock.enrollment.update).toHaveBeenCalled();
  });

  // UT-ENR-011
  it('UT-ENR-011: getContinueLearning() - Ambil kursus yang sedang dipelajari', async () => {
    prismaMock.enrollment.findMany.mockResolvedValue([{ ...testEnrollments.activeEnrollment, course: testCourses.freeCourse }] as any);
    const result = await getContinueLearning('userId', 5);
    expect(result).toHaveLength(1);
  });
});
