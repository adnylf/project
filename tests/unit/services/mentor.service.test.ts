/**
 * Unit Tests for Mentor Service
 * Sesuai dengan rencana_pengujian.md: 5 test cases (UT-MNT-001 s/d UT-MNT-005)
 */

import { prismaMock } from '../../jest.setup';
import { testUsers, testMentorProfiles } from '../../fixtures/test-data';
import { MentorStatus, UserRole } from '@prisma/client';

import {
  applyAsMentor,
  getMentorProfileByUserId,
  updateMentorProfile,
  approveMentor,
  rejectMentor,
} from '@/services/mentor.service';

describe('Mentor Service', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // UT-MNT-001
  it('UT-MNT-001: applyAsMentor() - Apply sebagai mentor', async () => {
    prismaMock.mentorProfile.findUnique.mockResolvedValue(null); // Not yet applied
    prismaMock.mentorProfile.create.mockResolvedValue({ 
      id: 'mentor-id', 
      user_id: testUsers.student.id,
      status: MentorStatus.PENDING 
    } as any);
    
    const result = await applyAsMentor(testUsers.student.id, { 
      expertise: ['JavaScript'], 
      experience: 3,
      education: 'S1 IT',
      bio: 'Developer'
    });
    expect(result).toHaveProperty('id');
    expect(result.status).toBe(MentorStatus.PENDING);
  });

  // UT-MNT-002: getMentorProfileByUserId (bukan getMentorProfile)
  it('UT-MNT-002: getMentorProfileByUserId() - Ambil profil mentor', async () => {
    prismaMock.mentorProfile.findUnique.mockResolvedValue({ 
      ...testMentorProfiles.approved, 
      user: { id: 'user-id', full_name: 'Mentor', email: 'mentor@test.com', avatar_url: null, bio: null } 
    } as any);
    
    const result = await getMentorProfileByUserId(testMentorProfiles.approved.user_id);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('user');
  });

  // UT-MNT-003
  it('UT-MNT-003: updateMentorProfile() - Update profil mentor', async () => {
    prismaMock.mentorProfile.update.mockResolvedValue({ ...testMentorProfiles.approved, bio: 'Updated bio' } as any);
    
    const result = await updateMentorProfile(testMentorProfiles.approved.user_id, { bio: 'Updated bio' });
    expect(result.bio).toBe('Updated bio');
  });

  // UT-MNT-004
  it('UT-MNT-004: approveMentor() - Admin approve mentor', async () => {
    prismaMock.mentorProfile.findUnique.mockResolvedValue(testMentorProfiles.pending as any);
    prismaMock.$transaction.mockResolvedValue([
      { ...testMentorProfiles.pending, status: MentorStatus.APPROVED, approved_at: new Date() },
      testUsers.mentor
    ] as any);
    
    const result = await approveMentor(testMentorProfiles.pending.id);
    expect(result.status).toBe(MentorStatus.APPROVED);
  });

  // UT-MNT-005
  it('UT-MNT-005: rejectMentor() - Admin reject mentor', async () => {
    prismaMock.mentorProfile.update.mockResolvedValue({ 
      ...testMentorProfiles.pending, 
      status: MentorStatus.REJECTED,
      rejection_reason: 'Need more experience'
    } as any);
    
    const result = await rejectMentor(testMentorProfiles.pending.id, 'Need more experience');
    expect(result.status).toBe(MentorStatus.REJECTED);
  });
});
