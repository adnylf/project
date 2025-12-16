/**
 * Test Data Fixtures
 * Reusable test data for all unit and integration tests
 */

import { 
  UserRole, 
  UserStatus, 
  MentorStatus,
  CourseStatus, 
  CourseLevel,
  EnrollmentStatus,
  CertificateStatus,
  TransactionStatus,
  PaymentMethod
} from '@prisma/client';

// ============================================
// USER TEST DATA
// ============================================

export const testUsers = {
  admin: {
    id: 'user-admin-001',
    email: 'admin@test.com',
    password: '$2a$10$hashedPasswordForAdmin', // bcrypt hash of "Admin123!"
    full_name: 'Admin Test',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    avatar_url: null,
    bio: 'Administrator',
    phone: '+6281234567890',
    date_of_birth: new Date('1990-01-01'),
    address: 'Jakarta',
    city: 'Jakarta',
    disability_type: null,
    email_verified: true,
    email_verified_at: new Date(),
    last_login: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  mentor: {
    id: 'user-mentor-001',
    email: 'mentor@test.com',
    password: '$2a$10$hashedPasswordForMentor',
    full_name: 'Mentor Test',
    role: UserRole.MENTOR,
    status: UserStatus.ACTIVE,
    avatar_url: '/uploads/avatars/mentor.jpg',
    bio: 'Experienced mentor',
    phone: '+6281234567891',
    date_of_birth: new Date('1985-05-15'),
    address: 'Bandung',
    city: 'Bandung',
    disability_type: null,
    email_verified: true,
    email_verified_at: new Date(),
    last_login: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  student: {
    id: 'user-student-001',
    email: 'student@test.com',
    password: '$2a$10$hashedPasswordForStudent',
    full_name: 'Student Test',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    avatar_url: null,
    bio: 'Learning enthusiast',
    phone: '+6281234567892',
    date_of_birth: new Date('2000-08-20'),
    address: 'Surabaya',
    city: 'Surabaya',
    disability_type: null,
    email_verified: false,
    email_verified_at: null,
    last_login: null,
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  suspendedUser: {
    id: 'user-suspended-001',
    email: 'suspended@test.com',
    password: '$2a$10$hashedPasswordForSuspended',
    full_name: 'Suspended User',
    role: UserRole.STUDENT,
    status: UserStatus.SUSPENDED,
    avatar_url: null,
    bio: null,
    phone: null,
    date_of_birth: null,
    address: null,
    city: null,
    disability_type: null,
    email_verified: true,
    email_verified_at: new Date(),
    last_login: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
};

// Plain text passwords for login tests
export const testPasswords = {
  admin: 'Admin123!',
  mentor: 'Mentor123!',
  student: 'Student123!',
  suspended: 'Suspended123!',
  wrong: 'WrongPassword123!',
};

// ============================================
// MENTOR PROFILE TEST DATA
// ============================================

export const testMentorProfiles = {
  approved: {
    id: 'mentor-profile-001',
    user_id: testUsers.mentor.id,
    expertise: ['JavaScript', 'React', 'Node.js'],
    experience: 5,
    education: 'S1 Teknik Informatika',
    bio: 'Senior Software Engineer',
    headline: 'Full Stack Developer',
    website: 'https://mentor.example.com',
    linkedin: 'https://linkedin.com/in/mentor',
    twitter: null,
    portfolio: null,
    status: MentorStatus.APPROVED,
    approved_at: new Date(),
    rejected_at: null,
    rejection_reason: null,
    total_students: 150,
    total_courses: 5,
    average_rating: 4.8,
    total_reviews: 45,
    total_revenue: 50000000,
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  pending: {
    id: 'mentor-profile-002',
    user_id: 'user-mentor-pending',
    expertise: ['Python', 'Data Science'],
    experience: 3,
    education: 'S2 Data Science',
    bio: 'Data Scientist',
    headline: 'ML Engineer',
    website: null,
    linkedin: null,
    twitter: null,
    portfolio: null,
    status: MentorStatus.PENDING,
    approved_at: null,
    rejected_at: null,
    rejection_reason: null,
    total_students: 0,
    total_courses: 0,
    average_rating: 0,
    total_reviews: 0,
    total_revenue: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
};

// ============================================
// CATEGORY TEST DATA
// ============================================

export const testCategories = {
  programming: {
    id: 'cat-programming-001',
    name: 'Programming',
    slug: 'programming',
    description: 'Learn programming languages',
    parent_id: null,
    order: 1,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  webDev: {
    id: 'cat-webdev-001',
    name: 'Web Development',
    slug: 'web-development',
    description: 'Frontend and backend development',
    parent_id: 'cat-programming-001',
    order: 1,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  design: {
    id: 'cat-design-001',
    name: 'Design',
    slug: 'design',
    description: 'UI/UX and graphic design',
    parent_id: null,
    order: 2,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
};

// ============================================
// COURSE TEST DATA  
// ============================================

export const testCourses = {
  freeCourse: {
    id: 'course-free-001',
    mentor_id: testMentorProfiles.approved.id,
    title: 'Belajar JavaScript Dasar',
    slug: 'belajar-javascript-dasar-abc123',
    description: 'Kursus gratis untuk belajar JavaScript dari dasar',
    short_description: 'JavaScript untuk pemula',
    thumbnail: '/uploads/courses/js-thumbnail.jpg',
    cover_image: null,
    category_id: testCategories.programming.id,
    level: CourseLevel.BEGINNER,
    language: 'id',
    price: 0,
    discount_price: null,
    is_free: true,
    is_premium: false,
    is_featured: false,
    status: CourseStatus.PUBLISHED,
    published_at: new Date(),
    requirements: ['Laptop/komputer', 'Koneksi internet'],
    what_you_will_learn: ['Dasar JavaScript', 'DOM manipulation'],
    target_audience: ['Pemula yang ingin belajar programming'],
    total_duration: 3600, // 1 hour in seconds
    total_lectures: 10,
    total_students: 100,
    average_rating: 4.5,
    total_reviews: 25,
    total_views: 500,
    tags: ['javascript', 'pemula', 'gratis'],
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  paidCourse: {
    id: 'course-paid-001',
    mentor_id: testMentorProfiles.approved.id,
    title: 'React Advanced Masterclass',
    slug: 'react-advanced-masterclass-xyz789',
    description: 'Kursus lengkap React untuk developer berpengalaman',
    short_description: 'React untuk level advanced',
    thumbnail: '/uploads/courses/react-thumbnail.jpg',
    cover_image: null,
    category_id: testCategories.webDev.id,
    level: CourseLevel.ADVANCED,
    language: 'id',
    price: 299000,
    discount_price: 199000,
    is_free: false,
    is_premium: true,
    is_featured: true,
    status: CourseStatus.PUBLISHED,
    published_at: new Date(),
    requirements: ['JavaScript dasar', 'HTML/CSS', 'React basics'],
    what_you_will_learn: ['React Hooks', 'State Management', 'Performance'],
    target_audience: ['Developer dengan pengalaman React'],
    total_duration: 36000, // 10 hours
    total_lectures: 50,
    total_students: 250,
    average_rating: 4.9,
    total_reviews: 80,
    total_views: 1500,
    tags: ['react', 'advanced', 'frontend'],
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  draftCourse: {
    id: 'course-draft-001',
    mentor_id: testMentorProfiles.approved.id,
    title: 'Node.js API Development',
    slug: 'nodejs-api-development-draft',
    description: 'Kursus backend dengan Node.js (draft)',
    short_description: 'Node.js untuk backend',
    thumbnail: null,
    cover_image: null,
    category_id: testCategories.webDev.id,
    level: CourseLevel.INTERMEDIATE,
    language: 'id',
    price: 150000,
    discount_price: null,
    is_free: false,
    is_premium: false,
    is_featured: false,
    status: CourseStatus.DRAFT,
    published_at: null,
    requirements: [],
    what_you_will_learn: [],
    target_audience: [],
    total_duration: 0,
    total_lectures: 0,
    total_students: 0,
    average_rating: 0,
    total_reviews: 0,
    total_views: 0,
    tags: [],
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  pendingCourse: {
    id: 'course-pending-001',
    mentor_id: testMentorProfiles.approved.id,
    title: 'TypeScript Fundamentals',
    slug: 'typescript-fundamentals-pending',
    description: 'Belajar TypeScript dari awal',
    short_description: 'TypeScript basics',
    thumbnail: '/uploads/courses/ts-thumbnail.jpg',
    cover_image: null,
    category_id: testCategories.programming.id,
    level: CourseLevel.BEGINNER,
    language: 'id',
    price: 100000,
    discount_price: null,
    is_free: false,
    is_premium: false,
    is_featured: false,
    status: CourseStatus.PENDING_REVIEW,
    published_at: null,
    requirements: ['JavaScript dasar'],
    what_you_will_learn: ['TypeScript syntax', 'Type system'],
    target_audience: ['JavaScript developer'],
    total_duration: 7200,
    total_lectures: 15,
    total_students: 0,
    average_rating: 0,
    total_reviews: 0,
    total_views: 0,
    tags: ['typescript', 'pemula'],
    created_at: new Date(),
    updated_at: new Date(),
  },
};

// ============================================
// ENROLLMENT TEST DATA
// ============================================

export const testEnrollments = {
  activeEnrollment: {
    id: 'enrollment-001',
    user_id: testUsers.student.id,
    course_id: testCourses.freeCourse.id,
    status: EnrollmentStatus.ACTIVE,
    progress: 45.5,
    completed_at: null,
    expires_at: null,
    last_accessed_at: new Date(),
    certificate_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  completedEnrollment: {
    id: 'enrollment-002',
    user_id: testUsers.student.id,
    course_id: testCourses.paidCourse.id,
    status: EnrollmentStatus.COMPLETED,
    progress: 100,
    completed_at: new Date(),
    expires_at: null,
    last_accessed_at: new Date(),
    certificate_id: 'cert-001',
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  lowProgressEnrollment: {
    id: 'enrollment-003',
    user_id: 'user-low-progress',
    course_id: testCourses.freeCourse.id,
    status: EnrollmentStatus.ACTIVE,
    progress: 5, // Less than 10%
    completed_at: null,
    expires_at: null,
    last_accessed_at: new Date(),
    certificate_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  },
};

// ============================================
// REVIEW TEST DATA
// ============================================

export const testReviews = {
  validReview: {
    id: 'review-001',
    user_id: testUsers.student.id,
    course_id: testCourses.freeCourse.id,
    rating: 5,
    comment: 'Kursus yang sangat bagus dan mudah dipahami!',
    is_anonymous: false,
    helpful_count: 10,
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  anonymousReview: {
    id: 'review-002',
    user_id: 'user-anonymous',
    course_id: testCourses.paidCourse.id,
    rating: 4,
    comment: 'Materi cukup baik, tapi bisa lebih detail.',
    is_anonymous: true,
    helpful_count: 5,
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  noCommentReview: {
    id: 'review-003',
    user_id: 'user-no-comment',
    course_id: testCourses.freeCourse.id,
    rating: 3,
    comment: null,
    is_anonymous: false,
    helpful_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
};

// ============================================
// TRANSACTION TEST DATA
// ============================================

export const testTransactions = {
  pendingTransaction: {
    id: 'transaction-001',
    user_id: testUsers.student.id,
    course_id: testCourses.paidCourse.id,
    order_id: 'ORD-20241214-001',
    amount: 299000,
    discount: 100000,
    total_amount: 199000,
    payment_method: PaymentMethod.QRIS,
    status: TransactionStatus.PENDING,
    payment_url: 'https://payment.example.com/pay/xxx',
    paid_at: null,
    expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    metadata: null,
    created_at: new Date(),
    updated_at: new Date(),
  },
  
  successTransaction: {
    id: 'transaction-002',
    user_id: testUsers.student.id,
    course_id: testCourses.paidCourse.id,
    order_id: 'ORD-20241214-002',
    amount: 299000,
    discount: 100000,
    total_amount: 199000,
    payment_method: PaymentMethod.BANK_TRANSFER,
    status: TransactionStatus.SUCCESS,
    payment_url: null,
    paid_at: new Date(),
    expired_at: null,
    metadata: { bank: 'BCA', va_number: '1234567890' },
    created_at: new Date(),
    updated_at: new Date(),
  },
};

// ============================================
// TOKEN TEST DATA
// ============================================

export const testTokens = {
  validToken: {
    id: 'token-001',
    user_id: testUsers.student.id,
    token: 'valid-verification-token-xxx',
    type: 'EMAIL_VERIFICATION',
    expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    used_at: null,
    created_at: new Date(),
  },
  
  expiredToken: {
    id: 'token-002',
    user_id: testUsers.student.id,
    token: 'expired-verification-token-xxx',
    type: 'EMAIL_VERIFICATION',
    expires_at: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    used_at: null,
    created_at: new Date(),
  },
  
  usedToken: {
    id: 'token-003',
    user_id: testUsers.student.id,
    token: 'used-verification-token-xxx',
    type: 'EMAIL_VERIFICATION',
    expires_at: new Date(Date.now() + 60 * 60 * 1000),
    used_at: new Date(),
    created_at: new Date(),
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a deep copy of test data to avoid mutation
 */
export function cloneTestData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Generate a unique ID for tests
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new date offset by given days
 */
export function dateOffset(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
