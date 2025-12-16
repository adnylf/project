/**
 * Unit Tests for Course Service
 * Sesuai dengan rencana_pengujian.md: 15 test cases (UT-CRS-001 s/d UT-CRS-015)
 */

import { prismaMock } from '../../jest.setup';
import { testCourses, testMentorProfiles, testCategories } from '../../fixtures/test-data';
import { CourseStatus, CourseLevel } from '@prisma/client';

import {
  createCourse,
  getCourseById,
  getCourseBySlug,
  updateCourse,
  deleteCourse,
  getCourses,
  submitForReview,
  approveCourse,
  rejectCourse,
} from '@/services/course.service';

describe('Course Service', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // UT-CRS-001
  it('UT-CRS-001: createCourse() - Buat kursus baru berhasil', async () => {
    const expectedCourse = { id: 'new-course-id', mentor_id: 'mentor-id', title: 'Test', slug: 'test-xxx', status: CourseStatus.DRAFT } as any;
    prismaMock.course.create.mockResolvedValue(expectedCourse);
    const result = await createCourse('mentor-id', { title: 'Test', description: 'Desc', category_id: 'cat-id' });
    expect(result).toHaveProperty('slug');
  });

  // UT-CRS-002
  it('UT-CRS-002: getCourseById() - Ambil kursus dengan ID valid', async () => {
    prismaMock.course.findUnique.mockResolvedValue(testCourses.freeCourse as any);
    const result = await getCourseById(testCourses.freeCourse.id);
    expect(result).toEqual(testCourses.freeCourse);
  });

  // UT-CRS-003
  it('UT-CRS-003: getCourseById() - Kursus tidak ditemukan', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);
    const result = await getCourseById('invalid-id');
    expect(result).toBeNull();
  });

  // UT-CRS-004
  it('UT-CRS-004: getCourseBySlug() - Ambil kursus dengan slug valid', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ ...testCourses.freeCourse, category: {}, mentor: { user: {} }, sections: [] } as any);
    const result = await getCourseBySlug('kursus-test-xxx');
    expect(result).toHaveProperty('category');
  });

  // UT-CRS-005
  it('UT-CRS-005: updateCourse() - Update kursus berhasil', async () => {
    prismaMock.course.findUnique.mockResolvedValue(testCourses.freeCourse as any);
    prismaMock.course.update.mockResolvedValue({ ...testCourses.freeCourse, title: 'Updated' } as any);
    const result = await updateCourse(testCourses.freeCourse.id, testCourses.freeCourse.mentor_id, { title: 'Updated' });
    expect(result.title).toBe('Updated');
  });

  // UT-CRS-006
  it('UT-CRS-006: updateCourse() - Bukan pemilik kursus', async () => {
    prismaMock.course.findUnique.mockResolvedValue(testCourses.freeCourse as any);
    await expect(updateCourse(testCourses.freeCourse.id, 'different-mentor', { title: 'New' }))
      .rejects.toThrow('Tidak memiliki akses');
  });

  // UT-CRS-007
  it('UT-CRS-007: deleteCourse() - Hapus kursus berhasil', async () => {
    prismaMock.course.findUnique.mockResolvedValue(testCourses.freeCourse as any);
    prismaMock.course.delete.mockResolvedValue(testCourses.freeCourse as any);
    const result = await deleteCourse(testCourses.freeCourse.id, testCourses.freeCourse.mentor_id);
    expect(result).toEqual(testCourses.freeCourse);
  });

  // UT-CRS-008
  it('UT-CRS-008: deleteCourse() - Admin hapus kursus', async () => {
    prismaMock.course.findUnique.mockResolvedValue(testCourses.freeCourse as any);
    prismaMock.course.delete.mockResolvedValue(testCourses.freeCourse as any);
    const result = await deleteCourse(testCourses.freeCourse.id, 'any-mentor', true);
    expect(result).toEqual(testCourses.freeCourse);
  });

  // UT-CRS-009
  it('UT-CRS-009: getCourses() - Filter berdasarkan status', async () => {
    prismaMock.course.findMany.mockResolvedValue([testCourses.freeCourse] as any);
    prismaMock.course.count.mockResolvedValue(1);
    const result = await getCourses({ status: CourseStatus.PUBLISHED });
    expect(result.courses).toHaveLength(1);
  });

  // UT-CRS-010
  it('UT-CRS-010: getCourses() - Filter berdasarkan category', async () => {
    prismaMock.course.findMany.mockResolvedValue([testCourses.freeCourse] as any);
    prismaMock.course.count.mockResolvedValue(1);
    await getCourses({ categoryId: 'cat-id' });
    expect(prismaMock.course.findMany).toHaveBeenCalled();
  });

  // UT-CRS-011
  it('UT-CRS-011: getCourses() - Search by title', async () => {
    prismaMock.course.findMany.mockResolvedValue([testCourses.freeCourse] as any);
    prismaMock.course.count.mockResolvedValue(1);
    await getCourses({ search: 'javascript' });
    expect(prismaMock.course.findMany).toHaveBeenCalled();
  });

  // UT-CRS-012
  it('UT-CRS-012: submitForReview() - Submit untuk review berhasil', async () => {
    const courseWithSections = { ...testCourses.draftCourse, sections: [{ id: 's1', materials: [{ id: 'm1' }] }] };
    prismaMock.course.findUnique.mockResolvedValue(courseWithSections as any);
    prismaMock.course.update.mockResolvedValue({ ...testCourses.draftCourse, status: CourseStatus.PENDING_REVIEW } as any);
    const result = await submitForReview(testCourses.draftCourse.id, testCourses.draftCourse.mentor_id);
    expect(result.status).toBe(CourseStatus.PENDING_REVIEW);
  });

  // UT-CRS-013
  it('UT-CRS-013: submitForReview() - Kursus tanpa section', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ ...testCourses.draftCourse, sections: [] } as any);
    await expect(submitForReview(testCourses.draftCourse.id, testCourses.draftCourse.mentor_id))
      .rejects.toThrow('minimal 1 section');
  });

  // UT-CRS-014
  it('UT-CRS-014: approveCourse() - Approve kursus', async () => {
    prismaMock.course.update.mockResolvedValue({ ...testCourses.pendingCourse, status: CourseStatus.PUBLISHED, published_at: new Date() } as any);
    const result = await approveCourse(testCourses.pendingCourse.id);
    expect(result.status).toBe(CourseStatus.PUBLISHED);
  });

  // UT-CRS-015
  it('UT-CRS-015: rejectCourse() - Reject kursus dengan alasan', async () => {
    prismaMock.activityLog.create.mockResolvedValue({} as any);
    prismaMock.course.update.mockResolvedValue({ ...testCourses.pendingCourse, status: CourseStatus.DRAFT } as any);
    const result = await rejectCourse(testCourses.pendingCourse.id, 'reason');
    expect(result.status).toBe(CourseStatus.DRAFT);
  });
});
