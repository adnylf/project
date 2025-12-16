# Rencana Pengujian (Test Plan)
## Platform E-Learning Inklusif

---

## 1. Pendahuluan

Dokumen ini berisi rencana pengujian komprehensif untuk platform e-learning inklusif yang dibangun menggunakan Next.js, Prisma ORM, dan PostgreSQL.

### 1.1 Lingkup Pengujian
- **Whitebox Testing**: Unit Test dan Integration Test (menggunakan Jest)
- **Blackbox Testing**: System Test dan Acceptance Test (menggunakan Katalon - tidak termasuk dalam dokumen ini)

### 1.2 Teknologi yang Digunakan
| Komponen | Teknologi |
|----------|-----------|
| Framework | Next.js 13.5.1 |
| Database | PostgreSQL via Prisma ORM |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Testing Framework | Jest + React Testing Library |
| Mocking | Jest Mock Functions |

---

## 2. Arsitektur Pengujian

```mermaid
flowchart TB
    subgraph Whitebox["Whitebox Testing"]
        UT["Unit Tests"]
        IT["Integration Tests"]
    end
    
    subgraph Blackbox["Blackbox Testing (Katalon)"]
        ST["System Tests"]
        AT["Acceptance Tests"]
    end
    
    UT --> IT --> ST --> AT
```

---

## 3. Test Cases - Unit Testing

### 3.1 Auth Service (`auth.service.ts`)

| ID | Fungsi | Skenario | Test Data | Expected Result |
|----|--------|----------|-----------|-----------------|
| UT-AUTH-001 | `register()` | Registrasi user baru berhasil | email: "test@example.com", password: "Test123!", full_name: "Test User" | Return user object dengan token |
| UT-AUTH-002 | `register()` | Email sudah terdaftar | email: "existing@example.com" | Throw Error "Email sudah terdaftar" |
| UT-AUTH-003 | `login()` | Login berhasil | email: "test@example.com", password: "Test123!" | Return user object dengan token |
| UT-AUTH-004 | `login()` | Email tidak ditemukan | email: "notfound@example.com" | Throw Error "Email atau password salah" |
| UT-AUTH-005 | `login()` | Password salah | email: "test@example.com", password: "wrong" | Throw Error "Email atau password salah" |
| UT-AUTH-006 | `login()` | Akun suspended | email: "suspended@example.com" | Throw Error "Akun Anda telah dinonaktifkan" |
| UT-AUTH-007 | `generateToken()` | Generate token valid | user: {id, email, role} | Return JWT string |
| UT-AUTH-008 | `verifyToken()` | Verify token valid | token: valid JWT | Return JwtPayload object |
| UT-AUTH-009 | `verifyToken()` | Verify token invalid | token: "invalid" | Return null |
| UT-AUTH-010 | `changePassword()` | Ganti password berhasil | userId, currentPassword, newPassword | Return {success: true} |
| UT-AUTH-011 | `changePassword()` | Password lama salah | wrong currentPassword | Throw Error "Password saat ini salah" |
| UT-AUTH-012 | `verifyEmail()` | Verifikasi email berhasil | valid token | Return {success: true} |
| UT-AUTH-013 | `verifyEmail()` | Token expired | expired token | Throw Error "Token sudah kadaluarsa" |

---

### 3.2 Course Service (`course.service.ts`)

| ID | Fungsi | Skenario | Test Data | Expected Result |
|----|--------|----------|-----------|-----------------|
| UT-CRS-001 | `createCourse()` | Buat kursus baru berhasil | mentorId, title, description, category_id | Return course object dengan slug |
| UT-CRS-002 | `getCourseById()` | Ambil kursus dengan ID valid | courseId: valid UUID | Return course object |
| UT-CRS-003 | `getCourseById()` | Kursus tidak ditemukan | courseId: invalid UUID | Return null |
| UT-CRS-004 | `getCourseBySlug()` | Ambil kursus dengan slug valid | slug: "kursus-test-xxx" | Return course dengan relations |
| UT-CRS-005 | `updateCourse()` | Update kursus berhasil | id, mentorId (owner), data | Return updated course |
| UT-CRS-006 | `updateCourse()` | Bukan pemilik kursus | id, mentorId (bukan owner) | Throw Error "Tidak memiliki akses" |
| UT-CRS-007 | `deleteCourse()` | Hapus kursus berhasil | id, mentorId (owner) | Return deleted course |
| UT-CRS-008 | `deleteCourse()` | Admin hapus kursus | id, any mentorId, isAdmin: true | Return deleted course |
| UT-CRS-009 | `getCourses()` | Filter berdasarkan status | status: PUBLISHED | Return courses dengan status PUBLISHED |
| UT-CRS-010 | `getCourses()` | Filter berdasarkan category | categoryId | Return courses dengan category tertentu |
| UT-CRS-011 | `getCourses()` | Search by title | search: "javascript" | Return courses matching search |
| UT-CRS-012 | `submitForReview()` | Submit untuk review berhasil | id dengan section & material | Status berubah ke PENDING_REVIEW |
| UT-CRS-013 | `submitForReview()` | Kursus tanpa section | id tanpa section | Throw Error "minimal 1 section" |
| UT-CRS-014 | `approveCourse()` | Approve kursus | courseId | Status berubah ke PUBLISHED |
| UT-CRS-015 | `rejectCourse()` | Reject kursus dengan alasan | courseId, reason | Status berubah ke DRAFT |

---

### 3.3 Enrollment Service (`enrollment.service.ts`)

| ID | Fungsi | Skenario | Test Data | Expected Result |
|----|--------|----------|-----------|-----------------|
| UT-ENR-001 | `enrollUser()` | Enroll kursus gratis berhasil | userId, courseId (free) | Return enrollment object |
| UT-ENR-002 | `enrollUser()` | Kursus tidak ditemukan | courseId: invalid | Throw Error "Kursus tidak ditemukan" |
| UT-ENR-003 | `enrollUser()` | Kursus belum published | courseId: DRAFT status | Throw Error "Kursus tidak tersedia" |
| UT-ENR-004 | `enrollUser()` | Sudah terdaftar | existing enrollment | Throw Error "Anda sudah terdaftar" |
| UT-ENR-005 | `enrollUser()` | Kursus berbayar | courseId (paid) | Throw Error "lakukan pembayaran terlebih dahulu" |
| UT-ENR-006 | `getUserEnrollments()` | Ambil enrollments user | userId, options | Return paginated enrollments |
| UT-ENR-007 | `isUserEnrolled()` | User sudah enrolled | userId, courseId (enrolled) | Return true |
| UT-ENR-008 | `isUserEnrolled()` | User belum enrolled | userId, courseId (not enrolled) | Return false |
| UT-ENR-009 | `updateProgress()` | Update progress material | enrollmentId, materialId, data | Return progress object |
| UT-ENR-010 | `updateEnrollmentProgress()` | Hitung progress keseluruhan | enrollmentId | Update progress percentage |
| UT-ENR-011 | `getContinueLearning()` | Ambil kursus yang sedang dipelajari | userId | Return active enrollments < 100% |

---

### 3.4 Review Service (`review.service.ts`)

| ID | Fungsi | Skenario | Test Data | Expected Result |
|----|--------|----------|-----------|-----------------|
| UT-REV-001 | `createReview()` | Buat review berhasil | userId (enrolled, progress >= 10%), courseId, rating: 5 | Return review object |
| UT-REV-002 | `createReview()` | Belum terdaftar | userId (not enrolled) | Throw Error "harus terdaftar" |
| UT-REV-003 | `createReview()` | Progress < 10% | userId (progress < 10%) | Throw Error "Selesaikan minimal 10%" |
| UT-REV-004 | `createReview()` | Sudah pernah review | userId (already reviewed) | Throw Error "sudah memberikan review" |
| UT-REV-005 | `createReview()` | Rating invalid | rating: 0 atau 6 | Throw Error "Rating harus antara 1-5" |
| UT-REV-006 | `updateReview()` | Update review berhasil | reviewId, userId (owner) | Return updated review |
| UT-REV-007 | `updateReview()` | Bukan pemilik review | userId (not owner) | Throw Error "Tidak memiliki akses" |
| UT-REV-008 | `deleteReview()` | Hapus review berhasil | reviewId, userId (owner) | Return {success: true} |
| UT-REV-009 | `deleteReview()` | Admin hapus review | reviewId, isAdmin: true | Return {success: true} |
| UT-REV-010 | `getCourseReviews()` | Ambil reviews dengan pagination | courseId, page, limit | Return paginated reviews |
| UT-REV-011 | `markReviewHelpful()` | Tandai review helpful | reviewId | Increment helpful_count |

---

### 3.5 User Service (`user.service.ts`)

| ID | Fungsi | Skenario | Test Data | Expected Result |
|----|--------|----------|-----------|-----------------|
| UT-USR-001 | `getUserById()` | Ambil user dengan ID valid | userId | Return user object |
| UT-USR-002 | `getUserById()` | User tidak ditemukan | invalid userId | Return null |
| UT-USR-003 | `updateProfile()` | Update profile berhasil | userId, data | Return updated user |
| UT-USR-004 | `updateAvatar()` | Update avatar berhasil | userId, avatarUrl | Return {id, avatar_url} |
| UT-USR-005 | `getUsers()` | Admin ambil daftar users | options | Return paginated users |
| UT-USR-006 | `getUsers()` | Filter by role | role: STUDENT | Return students only |
| UT-USR-007 | `updateUserStatus()` | Update status user | userId, status: SUSPENDED | Return updated user |
| UT-USR-008 | `deleteUser()` | Hapus user | userId | Return deleted user |
| UT-USR-009 | `getUserStats()` | Ambil statistik user | userId | Return stats object |
| UT-USR-010 | `emailExists()` | Email sudah ada | existing email | Return true |
| UT-USR-011 | `emailExists()` | Email belum ada | new email | Return false |
| UT-USR-012 | `addToWishlist()` | Tambah ke wishlist | userId, courseId | Return wishlist entry |
| UT-USR-013 | `addToWishlist()` | Sudah ada di wishlist | existing entry | Throw Error "sudah ada di wishlist" |
| UT-USR-014 | `removeFromWishlist()` | Hapus dari wishlist | userId, courseId | Return deleted entry |
| UT-USR-015 | `getWishlist()` | Ambil wishlist user | userId | Return wishlist dengan courses |

---

### 3.6 Transaction Service (`transaction.service.ts`)

| ID | Fungsi | Skenario | Test Data | Expected Result |
|----|--------|----------|-----------|-----------------|
| UT-TRX-001 | `createTransaction()` | Buat transaksi baru | userId, courseId, paymentMethod | Return transaction dengan order_id |
| UT-TRX-002 | `getTransactionById()` | Ambil transaksi valid | transactionId | Return transaction object |
| UT-TRX-003 | `updateTransactionStatus()` | Update status ke PAID | transactionId, status: PAID | Return updated transaction |
| UT-TRX-004 | `getUserTransactions()` | Ambil transaksi user | userId | Return paginated transactions |

---

### 3.7 Mentor Service (`mentor.service.ts`)

| ID | Fungsi | Skenario | Test Data | Expected Result |
|----|--------|----------|-----------|-----------------|
| UT-MNT-001 | `applyAsMentor()` | Apply sebagai mentor | userId, profileData | Return mentor profile |
| UT-MNT-002 | `getMentorProfile()` | Ambil profil mentor | userId | Return mentor profile |
| UT-MNT-003 | `updateMentorProfile()` | Update profil mentor | userId, data | Return updated profile |
| UT-MNT-004 | `approveMentor()` | Admin approve mentor | mentorId | Status berubah ke APPROVED |
| UT-MNT-005 | `rejectMentor()` | Admin reject mentor | mentorId, reason | Status berubah ke REJECTED |

---

## 4. Test Cases - Integration Testing

### 4.1 API Authentication Routes

| ID | Endpoint | Method | Skenario | Test Data | Expected Result |
|----|----------|--------|----------|-----------|-----------------|
| IT-AUTH-001 | `/api/auth/register` | POST | Registrasi berhasil | valid user data | Status 201, return user + token |
| IT-AUTH-002 | `/api/auth/register` | POST | Email duplikat | existing email | Status 400, error message |
| IT-AUTH-003 | `/api/auth/login` | POST | Login berhasil | valid credentials | Status 200, return user + token |
| IT-AUTH-004 | `/api/auth/login` | POST | Credentials invalid | wrong password | Status 401, error message |
| IT-AUTH-005 | `/api/auth/change-password` | POST | Ganti password | current + new password | Status 200, success |

---

### 4.2 API Course Routes

| ID | Endpoint | Method | Skenario | Test Data | Expected Result |
|----|----------|--------|-----------|-----------------|-----------------|
| IT-CRS-001 | `/api/courses` | GET | Ambil semua kursus published | - | Status 200, return courses |
| IT-CRS-002 | `/api/courses` | GET | Filter by category | categoryId | Status 200, filtered courses |
| IT-CRS-003 | `/api/courses/[id]` | GET | Ambil detail kursus | valid courseId | Status 200, return course detail |
| IT-CRS-004 | `/api/courses/[id]` | GET | Kursus tidak ada | invalid courseId | Status 404, error |
| IT-CRS-005 | `/api/courses/[id]/enroll` | POST | Enroll kursus gratis | Authorization header | Status 201, return enrollment |
| IT-CRS-006 | `/api/courses/[id]/enroll` | POST | Tanpa auth | - | Status 401, unauthorized |

---

### 4.3 API User Routes

| ID | Endpoint | Method | Skenario | Test Data | Expected Result |
|----|----------|--------|----------|-----------|-----------------|
| IT-USR-001 | `/api/users/profile` | GET | Ambil profil sendiri | Authorization header | Status 200, return profile |
| IT-USR-002 | `/api/users/profile` | PUT | Update profil | profile data | Status 200, updated profile |
| IT-USR-003 | `/api/users/enrollments` | GET | Ambil enrollments | Authorization header | Status 200, return enrollments |
| IT-USR-004 | `/api/users/wishlist` | GET | Ambil wishlist | Authorization header | Status 200, return wishlist |
| IT-USR-005 | `/api/users/wishlist` | POST | Tambah ke wishlist | courseId | Status 201, return entry |

---

### 4.4 API Admin Routes

| ID | Endpoint | Method | Skenario | Test Data | Expected Result |
|----|----------|--------|----------|-----------|-----------------|
| IT-ADM-001 | `/api/admin/users` | GET | Ambil semua users | Admin token | Status 200, return users |
| IT-ADM-002 | `/api/admin/users` | GET | Akses tanpa admin | Student token | Status 403, forbidden |
| IT-ADM-003 | `/api/admin/courses/[id]/approve` | PATCH | Approve kursus | Admin token | Status 200, approved |
| IT-ADM-004 | `/api/admin/mentors/[id]/approve` | PATCH | Approve mentor | Admin token | Status 200, approved |

---

### 4.5 API Review Routes

| ID | Endpoint | Method | Skenario | Test Data | Expected Result |
|----|----------|--------|----------|-----------|-----------------|
| IT-REV-001 | `/api/reviews/course/[id]` | GET | Ambil reviews kursus | courseId | Status 200, return reviews |
| IT-REV-002 | `/api/users/reviews` | POST | Buat review baru | rating, comment | Status 201, return review |
| IT-REV-003 | `/api/users/reviews/[id]` | PUT | Update review | updated data | Status 200, updated review |
| IT-REV-004 | `/api/users/reviews/[id]` | DELETE | Hapus review | reviewId | Status 200, success |

---

## 5. Test Data

### 5.1 User Test Data

```typescript
export const testUsers = {
  admin: {
    email: "admin@test.com",
    password: "Admin123!",
    full_name: "Admin Test",
    role: "ADMIN"
  },
  mentor: {
    email: "mentor@test.com",
    password: "Mentor123!",
    full_name: "Mentor Test",
    role: "MENTOR"
  },
  student: {
    email: "student@test.com",
    password: "Student123!",
    full_name: "Student Test",
    role: "STUDENT"
  }
};
```

### 5.2 Course Test Data

```typescript
export const testCourses = {
  freeCourse: {
    title: "Kursus Gratis Test",
    description: "Deskripsi kursus gratis untuk testing",
    category_id: "cat-uuid-001",
    level: "BEGINNER",
    is_free: true,
    price: 0
  },
  paidCourse: {
    title: "Kursus Berbayar Test",
    description: "Deskripsi kursus berbayar untuk testing",
    category_id: "cat-uuid-001",
    level: "INTERMEDIATE",
    is_free: false,
    price: 150000
  }
};
```

### 5.3 Review Test Data

```typescript
export const testReviews = {
  validReview: {
    rating: 5,
    comment: "Kursus sangat bagus dan mudah dipahami",
    is_anonymous: false
  },
  anonymousReview: {
    rating: 4,
    comment: "Materi cukup baik",
    is_anonymous: true
  }
};
```

---

## 6. Test Scenarios

### 6.1 Scenario: User Registration Flow

```gherkin
Feature: User Registration
  
  Scenario: Successful user registration
    Given user is on registration page
    When user enters valid email "newuser@test.com"
    And user enters password "NewUser123!"
    And user enters full name "New User"
    And user submits the form
    Then user should be registered successfully
    And user should receive a JWT token
    And user role should be "STUDENT"

  Scenario: Registration with existing email
    Given email "existing@test.com" is already registered
    When user tries to register with same email
    Then registration should fail
    And error message should be "Email sudah terdaftar"
```

### 6.2 Scenario: Course Enrollment Flow

```gherkin
Feature: Course Enrollment
  
  Scenario: Enroll in free course
    Given user is logged in as "student@test.com"
    And course "Kursus Gratis Test" is published and free
    When user enrolls in the course
    Then enrollment should be created
    And course total_students should increment by 1
    And enrollment progress should be 0%

  Scenario: Attempt to enroll in paid course without payment
    Given user is logged in as "student@test.com"
    And course "Kursus Berbayar Test" has price 150000
    When user tries to enroll directly
    Then enrollment should fail
    And error message should contain "pembayaran"
```

### 6.3 Scenario: Review Creation Flow

```gherkin
Feature: Course Review
  
  Scenario: Create review after completing 10% of course
    Given user is enrolled in course
    And user has completed 15% of the course
    When user submits a review with rating 5
    Then review should be created
    And course average_rating should be updated
    And course total_reviews should increment

  Scenario: Cannot review without enrollment
    Given user is not enrolled in course
    When user tries to submit a review
    Then review should not be created
    And error should mention enrollment requirement
```

---

## 7. Environment Setup

### 7.1 Test Database

```env
# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/elearning_test"
JWT_SECRET="test-secret-key-for-testing-only"
```

### 7.2 Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/app/api/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

---

## 8. Execution Plan

### 8.1 Phase 1: Unit Testing (Week 1)
1. Setup Jest environment
2. Implement auth.service tests
3. Implement user.service tests
4. Implement course.service tests
5. Implement enrollment.service tests
6. Implement review.service tests

### 8.2 Phase 2: Integration Testing (Week 2)
1. Setup test database and seed data
2. Implement API route tests for auth
3. Implement API route tests for courses
4. Implement API route tests for users
5. Implement API route tests for admin

### 8.3 Phase 3: Blackbox Testing (Katalon) - External
1. System Test menggunakan Katalon
2. Acceptance Test menggunakan Katalon

---

## 9. Test Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- auth.service.test.ts
```

---

## 10. Success Criteria

| Metric | Target |
|--------|--------|
| Code Coverage | ≥ 70% |
| Unit Test Pass Rate | 100% |
| Integration Test Pass Rate | 100% |
| Critical Bug Count | 0 |
| High Bug Count | ≤ 2 |

---

*Dokumen ini dibuat untuk kebutuhan pengujian platform e-learning inklusif.*
*Terakhir diperbarui: 14 Desember 2024*
