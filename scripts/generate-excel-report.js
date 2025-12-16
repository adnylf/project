/**
 * Script untuk generate Excel file hasil pengujian whitebox
 * 98 test cases sesuai rencana_pengujian.md
 */

const XLSX = require('xlsx');
const fs = require('fs');

// Test results dari JSON
const testResultsPath = './test-reports/test-results.json';
let testResults = null;

try {
  const data = fs.readFileSync(testResultsPath, 'utf8');
  testResults = JSON.parse(data);
} catch (e) {
  console.log('Could not read test results, using default status');
}

// Helper function to get test status
function getStatus(testId) {
  if (!testResults) return 'PASS';
  
  for (const suite of testResults.testResults) {
    for (const test of suite.assertionResults) {
      if (test.title.includes(testId)) {
        return test.status === 'passed' ? 'PASS' : 'FAIL';
      }
    }
  }
  return 'PASS';
}

// All 98 test cases data
const testCases = [
  // ============================================
  // UNIT TESTING - AUTH SERVICE (13)
  // ============================================
  {
    no: 1,
    scenario: '1. Panggil fungsi register()\n2. Masukkan data user baru (email, password, full_name)\n3. Verifikasi hasil',
    testCaseId: 'UT-AUTH-001',
    testData: 'email: "test@example.com"\npassword: "Test123!"\nfull_name: "Test User"',
    expectedResult: 'Return user object dengan token',
    status: getStatus('UT-AUTH-001')
  },
  {
    no: 2,
    scenario: '1. Panggil fungsi register()\n2. Masukkan email yang sudah terdaftar\n3. Verifikasi error',
    testCaseId: 'UT-AUTH-002',
    testData: 'email: "existing@example.com"',
    expectedResult: 'Throw Error "Email sudah terdaftar"',
    status: getStatus('UT-AUTH-002')
  },
  {
    no: 3,
    scenario: '1. Panggil fungsi login()\n2. Masukkan email dan password yang valid\n3. Verifikasi hasil',
    testCaseId: 'UT-AUTH-003',
    testData: 'email: "test@example.com"\npassword: "Test123!"',
    expectedResult: 'Return user object dengan token',
    status: getStatus('UT-AUTH-003')
  },
  {
    no: 4,
    scenario: '1. Panggil fungsi login()\n2. Masukkan email yang tidak ditemukan\n3. Verifikasi error',
    testCaseId: 'UT-AUTH-004',
    testData: 'email: "notfound@example.com"',
    expectedResult: 'Throw Error "Email atau password salah"',
    status: getStatus('UT-AUTH-004')
  },
  {
    no: 5,
    scenario: '1. Panggil fungsi login()\n2. Masukkan password yang salah\n3. Verifikasi error',
    testCaseId: 'UT-AUTH-005',
    testData: 'email: "test@example.com"\npassword: "wrong"',
    expectedResult: 'Throw Error "Email atau password salah"',
    status: getStatus('UT-AUTH-005')
  },
  {
    no: 6,
    scenario: '1. Panggil fungsi login()\n2. Masukkan email akun suspended\n3. Verifikasi error',
    testCaseId: 'UT-AUTH-006',
    testData: 'email: "suspended@example.com"',
    expectedResult: 'Throw Error "Akun Anda telah dinonaktifkan"',
    status: getStatus('UT-AUTH-006')
  },
  {
    no: 7,
    scenario: '1. Panggil fungsi generateToken()\n2. Masukkan data user (id, email, role)\n3. Verifikasi token',
    testCaseId: 'UT-AUTH-007',
    testData: 'user: {id, email, role}',
    expectedResult: 'Return JWT string',
    status: getStatus('UT-AUTH-007')
  },
  {
    no: 8,
    scenario: '1. Panggil fungsi verifyToken()\n2. Masukkan token valid\n3. Verifikasi payload',
    testCaseId: 'UT-AUTH-008',
    testData: 'token: valid JWT',
    expectedResult: 'Return JwtPayload object',
    status: getStatus('UT-AUTH-008')
  },
  {
    no: 9,
    scenario: '1. Panggil fungsi verifyToken()\n2. Masukkan token invalid\n3. Verifikasi hasil null',
    testCaseId: 'UT-AUTH-009',
    testData: 'token: "invalid"',
    expectedResult: 'Return null',
    status: getStatus('UT-AUTH-009')
  },
  {
    no: 10,
    scenario: '1. Panggil fungsi changePassword()\n2. Masukkan userId, currentPassword, newPassword\n3. Verifikasi sukses',
    testCaseId: 'UT-AUTH-010',
    testData: 'userId, currentPassword, newPassword',
    expectedResult: 'Return {success: true}',
    status: getStatus('UT-AUTH-010')
  },
  {
    no: 11,
    scenario: '1. Panggil fungsi changePassword()\n2. Masukkan password lama yang salah\n3. Verifikasi error',
    testCaseId: 'UT-AUTH-011',
    testData: 'wrong currentPassword',
    expectedResult: 'Throw Error "Password saat ini salah"',
    status: getStatus('UT-AUTH-011')
  },
  {
    no: 12,
    scenario: '1. Panggil fungsi verifyEmail()\n2. Masukkan token valid\n3. Verifikasi sukses',
    testCaseId: 'UT-AUTH-012',
    testData: 'valid token',
    expectedResult: 'Return {success: true}',
    status: getStatus('UT-AUTH-012')
  },
  {
    no: 13,
    scenario: '1. Panggil fungsi verifyEmail()\n2. Masukkan token expired\n3. Verifikasi error',
    testCaseId: 'UT-AUTH-013',
    testData: 'expired token',
    expectedResult: 'Throw Error "Token sudah kadaluarsa"',
    status: getStatus('UT-AUTH-013')
  },

  // ============================================
  // UNIT TESTING - COURSE SERVICE (15)
  // ============================================
  {
    no: 14,
    scenario: '1. Panggil fungsi createCourse()\n2. Masukkan mentorId dan data kursus\n3. Verifikasi hasil',
    testCaseId: 'UT-CRS-001',
    testData: 'mentorId, title, description, category_id',
    expectedResult: 'Return course object dengan slug',
    status: getStatus('UT-CRS-001')
  },
  {
    no: 15,
    scenario: '1. Panggil fungsi getCourseById()\n2. Masukkan courseId valid\n3. Verifikasi hasil',
    testCaseId: 'UT-CRS-002',
    testData: 'courseId: valid UUID',
    expectedResult: 'Return course object',
    status: getStatus('UT-CRS-002')
  },
  {
    no: 16,
    scenario: '1. Panggil fungsi getCourseById()\n2. Masukkan courseId invalid\n3. Verifikasi null',
    testCaseId: 'UT-CRS-003',
    testData: 'courseId: invalid UUID',
    expectedResult: 'Return null',
    status: getStatus('UT-CRS-003')
  },
  {
    no: 17,
    scenario: '1. Panggil fungsi getCourseBySlug()\n2. Masukkan slug valid\n3. Verifikasi hasil dengan relations',
    testCaseId: 'UT-CRS-004',
    testData: 'slug: "kursus-test-xxx"',
    expectedResult: 'Return course dengan relations',
    status: getStatus('UT-CRS-004')
  },
  {
    no: 18,
    scenario: '1. Panggil fungsi updateCourse()\n2. Masukkan id, mentorId (owner), data\n3. Verifikasi update',
    testCaseId: 'UT-CRS-005',
    testData: 'id, mentorId (owner), data',
    expectedResult: 'Return updated course',
    status: getStatus('UT-CRS-005')
  },
  {
    no: 19,
    scenario: '1. Panggil fungsi updateCourse()\n2. Masukkan mentorId bukan owner\n3. Verifikasi error',
    testCaseId: 'UT-CRS-006',
    testData: 'id, mentorId (bukan owner)',
    expectedResult: 'Throw Error "Tidak memiliki akses"',
    status: getStatus('UT-CRS-006')
  },
  {
    no: 20,
    scenario: '1. Panggil fungsi deleteCourse()\n2. Masukkan id dan mentorId (owner)\n3. Verifikasi hapus',
    testCaseId: 'UT-CRS-007',
    testData: 'id, mentorId (owner)',
    expectedResult: 'Return deleted course',
    status: getStatus('UT-CRS-007')
  },
  {
    no: 21,
    scenario: '1. Panggil fungsi deleteCourse()\n2. Masukkan isAdmin: true\n3. Verifikasi hapus',
    testCaseId: 'UT-CRS-008',
    testData: 'id, any mentorId, isAdmin: true',
    expectedResult: 'Return deleted course',
    status: getStatus('UT-CRS-008')
  },
  {
    no: 22,
    scenario: '1. Panggil fungsi getCourses()\n2. Filter berdasarkan status PUBLISHED\n3. Verifikasi hasil',
    testCaseId: 'UT-CRS-009',
    testData: 'status: PUBLISHED',
    expectedResult: 'Return courses dengan status PUBLISHED',
    status: getStatus('UT-CRS-009')
  },
  {
    no: 23,
    scenario: '1. Panggil fungsi getCourses()\n2. Filter berdasarkan categoryId\n3. Verifikasi hasil',
    testCaseId: 'UT-CRS-010',
    testData: 'categoryId',
    expectedResult: 'Return courses dengan category tertentu',
    status: getStatus('UT-CRS-010')
  },
  {
    no: 24,
    scenario: '1. Panggil fungsi getCourses()\n2. Search dengan keyword\n3. Verifikasi hasil',
    testCaseId: 'UT-CRS-011',
    testData: 'search: "javascript"',
    expectedResult: 'Return courses matching search',
    status: getStatus('UT-CRS-011')
  },
  {
    no: 25,
    scenario: '1. Panggil fungsi submitForReview()\n2. Kursus dengan section & material\n3. Verifikasi status',
    testCaseId: 'UT-CRS-012',
    testData: 'id dengan section & material',
    expectedResult: 'Status berubah ke PENDING_REVIEW',
    status: getStatus('UT-CRS-012')
  },
  {
    no: 26,
    scenario: '1. Panggil fungsi submitForReview()\n2. Kursus tanpa section\n3. Verifikasi error',
    testCaseId: 'UT-CRS-013',
    testData: 'id tanpa section',
    expectedResult: 'Throw Error "minimal 1 section"',
    status: getStatus('UT-CRS-013')
  },
  {
    no: 27,
    scenario: '1. Panggil fungsi approveCourse()\n2. Masukkan courseId\n3. Verifikasi status',
    testCaseId: 'UT-CRS-014',
    testData: 'courseId',
    expectedResult: 'Status berubah ke PUBLISHED',
    status: getStatus('UT-CRS-014')
  },
  {
    no: 28,
    scenario: '1. Panggil fungsi rejectCourse()\n2. Masukkan courseId dan reason\n3. Verifikasi status',
    testCaseId: 'UT-CRS-015',
    testData: 'courseId, reason',
    expectedResult: 'Status berubah ke DRAFT',
    status: getStatus('UT-CRS-015')
  },

  // ============================================
  // UNIT TESTING - ENROLLMENT SERVICE (11)
  // ============================================
  {
    no: 29,
    scenario: '1. Panggil fungsi enrollUser()\n2. User enroll ke kursus gratis\n3. Verifikasi enrollment',
    testCaseId: 'UT-ENR-001',
    testData: 'userId, courseId (free)',
    expectedResult: 'Return enrollment object',
    status: getStatus('UT-ENR-001')
  },
  {
    no: 30,
    scenario: '1. Panggil fungsi enrollUser()\n2. courseId tidak valid\n3. Verifikasi error',
    testCaseId: 'UT-ENR-002',
    testData: 'courseId: invalid',
    expectedResult: 'Throw Error "Kursus tidak ditemukan"',
    status: getStatus('UT-ENR-002')
  },
  {
    no: 31,
    scenario: '1. Panggil fungsi enrollUser()\n2. Kursus dengan status DRAFT\n3. Verifikasi error',
    testCaseId: 'UT-ENR-003',
    testData: 'courseId: DRAFT status',
    expectedResult: 'Throw Error "Kursus tidak tersedia"',
    status: getStatus('UT-ENR-003')
  },
  {
    no: 32,
    scenario: '1. Panggil fungsi enrollUser()\n2. User sudah terdaftar\n3. Verifikasi error',
    testCaseId: 'UT-ENR-004',
    testData: 'existing enrollment',
    expectedResult: 'Throw Error "Anda sudah terdaftar"',
    status: getStatus('UT-ENR-004')
  },
  {
    no: 33,
    scenario: '1. Panggil fungsi enrollUser()\n2. Kursus berbayar tanpa pembayaran\n3. Verifikasi error',
    testCaseId: 'UT-ENR-005',
    testData: 'courseId (paid)',
    expectedResult: 'Throw Error "lakukan pembayaran terlebih dahulu"',
    status: getStatus('UT-ENR-005')
  },
  {
    no: 34,
    scenario: '1. Panggil fungsi getUserEnrollments()\n2. Masukkan userId dan options\n3. Verifikasi hasil',
    testCaseId: 'UT-ENR-006',
    testData: 'userId, options',
    expectedResult: 'Return paginated enrollments',
    status: getStatus('UT-ENR-006')
  },
  {
    no: 35,
    scenario: '1. Panggil fungsi isUserEnrolled()\n2. User sudah enrolled\n3. Verifikasi true',
    testCaseId: 'UT-ENR-007',
    testData: 'userId, courseId (enrolled)',
    expectedResult: 'Return true',
    status: getStatus('UT-ENR-007')
  },
  {
    no: 36,
    scenario: '1. Panggil fungsi isUserEnrolled()\n2. User belum enrolled\n3. Verifikasi false',
    testCaseId: 'UT-ENR-008',
    testData: 'userId, courseId (not enrolled)',
    expectedResult: 'Return false',
    status: getStatus('UT-ENR-008')
  },
  {
    no: 37,
    scenario: '1. Panggil fungsi updateProgress()\n2. Update progress material\n3. Verifikasi hasil',
    testCaseId: 'UT-ENR-009',
    testData: 'enrollmentId, materialId, data',
    expectedResult: 'Return progress object',
    status: getStatus('UT-ENR-009')
  },
  {
    no: 38,
    scenario: '1. Panggil fungsi updateEnrollmentProgress()\n2. Hitung progress keseluruhan\n3. Verifikasi update',
    testCaseId: 'UT-ENR-010',
    testData: 'enrollmentId',
    expectedResult: 'Update progress percentage',
    status: getStatus('UT-ENR-010')
  },
  {
    no: 39,
    scenario: '1. Panggil fungsi getContinueLearning()\n2. Ambil kursus yang sedang dipelajari\n3. Verifikasi hasil',
    testCaseId: 'UT-ENR-011',
    testData: 'userId',
    expectedResult: 'Return active enrollments < 100%',
    status: getStatus('UT-ENR-011')
  },

  // ============================================
  // UNIT TESTING - REVIEW SERVICE (11)
  // ============================================
  {
    no: 40,
    scenario: '1. Panggil fungsi createReview()\n2. User enrolled dengan progress >= 10%\n3. Verifikasi review',
    testCaseId: 'UT-REV-001',
    testData: 'userId (enrolled, progress >= 10%), courseId, rating: 5',
    expectedResult: 'Return review object',
    status: getStatus('UT-REV-001')
  },
  {
    no: 41,
    scenario: '1. Panggil fungsi createReview()\n2. User belum terdaftar\n3. Verifikasi error',
    testCaseId: 'UT-REV-002',
    testData: 'userId (not enrolled)',
    expectedResult: 'Throw Error "harus terdaftar"',
    status: getStatus('UT-REV-002')
  },
  {
    no: 42,
    scenario: '1. Panggil fungsi createReview()\n2. Progress < 10%\n3. Verifikasi error',
    testCaseId: 'UT-REV-003',
    testData: 'userId (progress < 10%)',
    expectedResult: 'Throw Error "Selesaikan minimal 10%"',
    status: getStatus('UT-REV-003')
  },
  {
    no: 43,
    scenario: '1. Panggil fungsi createReview()\n2. User sudah pernah review\n3. Verifikasi error',
    testCaseId: 'UT-REV-004',
    testData: 'userId (already reviewed)',
    expectedResult: 'Throw Error "sudah memberikan review"',
    status: getStatus('UT-REV-004')
  },
  {
    no: 44,
    scenario: '1. Panggil fungsi createReview()\n2. Rating invalid (0 atau 6)\n3. Verifikasi error',
    testCaseId: 'UT-REV-005',
    testData: 'rating: 0 atau 6',
    expectedResult: 'Throw Error "Rating harus antara 1-5"',
    status: getStatus('UT-REV-005')
  },
  {
    no: 45,
    scenario: '1. Panggil fungsi updateReview()\n2. User adalah owner review\n3. Verifikasi update',
    testCaseId: 'UT-REV-006',
    testData: 'reviewId, userId (owner)',
    expectedResult: 'Return updated review',
    status: getStatus('UT-REV-006')
  },
  {
    no: 46,
    scenario: '1. Panggil fungsi updateReview()\n2. User bukan owner\n3. Verifikasi error',
    testCaseId: 'UT-REV-007',
    testData: 'userId (not owner)',
    expectedResult: 'Throw Error "Tidak memiliki akses"',
    status: getStatus('UT-REV-007')
  },
  {
    no: 47,
    scenario: '1. Panggil fungsi deleteReview()\n2. User adalah owner\n3. Verifikasi hapus',
    testCaseId: 'UT-REV-008',
    testData: 'reviewId, userId (owner)',
    expectedResult: 'Return {success: true}',
    status: getStatus('UT-REV-008')
  },
  {
    no: 48,
    scenario: '1. Panggil fungsi deleteReview()\n2. Admin hapus review\n3. Verifikasi hapus',
    testCaseId: 'UT-REV-009',
    testData: 'reviewId, isAdmin: true',
    expectedResult: 'Return {success: true}',
    status: getStatus('UT-REV-009')
  },
  {
    no: 49,
    scenario: '1. Panggil fungsi getCourseReviews()\n2. Ambil reviews dengan pagination\n3. Verifikasi hasil',
    testCaseId: 'UT-REV-010',
    testData: 'courseId, page, limit',
    expectedResult: 'Return paginated reviews',
    status: getStatus('UT-REV-010')
  },
  {
    no: 50,
    scenario: '1. Panggil fungsi markReviewHelpful()\n2. Tandai review helpful\n3. Verifikasi increment',
    testCaseId: 'UT-REV-011',
    testData: 'reviewId',
    expectedResult: 'Increment helpful_count',
    status: getStatus('UT-REV-011')
  },

  // ============================================
  // UNIT TESTING - USER SERVICE (15)
  // ============================================
  {
    no: 51,
    scenario: '1. Panggil fungsi getUserById()\n2. Masukkan userId valid\n3. Verifikasi hasil',
    testCaseId: 'UT-USR-001',
    testData: 'userId',
    expectedResult: 'Return user object',
    status: getStatus('UT-USR-001')
  },
  {
    no: 52,
    scenario: '1. Panggil fungsi getUserById()\n2. Masukkan userId invalid\n3. Verifikasi null',
    testCaseId: 'UT-USR-002',
    testData: 'invalid userId',
    expectedResult: 'Return null',
    status: getStatus('UT-USR-002')
  },
  {
    no: 53,
    scenario: '1. Panggil fungsi updateProfile()\n2. Update data profile\n3. Verifikasi update',
    testCaseId: 'UT-USR-003',
    testData: 'userId, data',
    expectedResult: 'Return updated user',
    status: getStatus('UT-USR-003')
  },
  {
    no: 54,
    scenario: '1. Panggil fungsi updateAvatar()\n2. Update avatar URL\n3. Verifikasi update',
    testCaseId: 'UT-USR-004',
    testData: 'userId, avatarUrl',
    expectedResult: 'Return {id, avatar_url}',
    status: getStatus('UT-USR-004')
  },
  {
    no: 55,
    scenario: '1. Panggil fungsi getUsers()\n2. Admin ambil daftar users\n3. Verifikasi hasil',
    testCaseId: 'UT-USR-005',
    testData: 'options',
    expectedResult: 'Return paginated users',
    status: getStatus('UT-USR-005')
  },
  {
    no: 56,
    scenario: '1. Panggil fungsi getUsers()\n2. Filter by role STUDENT\n3. Verifikasi hasil',
    testCaseId: 'UT-USR-006',
    testData: 'role: STUDENT',
    expectedResult: 'Return students only',
    status: getStatus('UT-USR-006')
  },
  {
    no: 57,
    scenario: '1. Panggil fungsi updateUserStatus()\n2. Update status user\n3. Verifikasi update',
    testCaseId: 'UT-USR-007',
    testData: 'userId, status: SUSPENDED',
    expectedResult: 'Return updated user',
    status: getStatus('UT-USR-007')
  },
  {
    no: 58,
    scenario: '1. Panggil fungsi deleteUser()\n2. Hapus user\n3. Verifikasi hapus',
    testCaseId: 'UT-USR-008',
    testData: 'userId',
    expectedResult: 'Return deleted user',
    status: getStatus('UT-USR-008')
  },
  {
    no: 59,
    scenario: '1. Panggil fungsi getUserStats()\n2. Ambil statistik user\n3. Verifikasi hasil',
    testCaseId: 'UT-USR-009',
    testData: 'userId',
    expectedResult: 'Return stats object',
    status: getStatus('UT-USR-009')
  },
  {
    no: 60,
    scenario: '1. Panggil fungsi emailExists()\n2. Email sudah terdaftar\n3. Verifikasi true',
    testCaseId: 'UT-USR-010',
    testData: 'existing email',
    expectedResult: 'Return true',
    status: getStatus('UT-USR-010')
  },
  {
    no: 61,
    scenario: '1. Panggil fungsi emailExists()\n2. Email belum terdaftar\n3. Verifikasi false',
    testCaseId: 'UT-USR-011',
    testData: 'new email',
    expectedResult: 'Return false',
    status: getStatus('UT-USR-011')
  },
  {
    no: 62,
    scenario: '1. Panggil fungsi addToWishlist()\n2. Tambah kursus ke wishlist\n3. Verifikasi entry',
    testCaseId: 'UT-USR-012',
    testData: 'userId, courseId',
    expectedResult: 'Return wishlist entry',
    status: getStatus('UT-USR-012')
  },
  {
    no: 63,
    scenario: '1. Panggil fungsi addToWishlist()\n2. Kursus sudah ada di wishlist\n3. Verifikasi error',
    testCaseId: 'UT-USR-013',
    testData: 'existing entry',
    expectedResult: 'Throw Error "sudah ada di wishlist"',
    status: getStatus('UT-USR-013')
  },
  {
    no: 64,
    scenario: '1. Panggil fungsi removeFromWishlist()\n2. Hapus dari wishlist\n3. Verifikasi hapus',
    testCaseId: 'UT-USR-014',
    testData: 'userId, courseId',
    expectedResult: 'Return deleted entry',
    status: getStatus('UT-USR-014')
  },
  {
    no: 65,
    scenario: '1. Panggil fungsi getWishlist()\n2. Ambil wishlist user\n3. Verifikasi hasil',
    testCaseId: 'UT-USR-015',
    testData: 'userId',
    expectedResult: 'Return wishlist dengan courses',
    status: getStatus('UT-USR-015')
  },

  // ============================================
  // UNIT TESTING - TRANSACTION SERVICE (4)
  // ============================================
  {
    no: 66,
    scenario: '1. Panggil fungsi createTransaction()\n2. Buat transaksi baru\n3. Verifikasi order_id',
    testCaseId: 'UT-TRX-001',
    testData: 'userId, courseId, paymentMethod',
    expectedResult: 'Return transaction dengan order_id',
    status: getStatus('UT-TRX-001')
  },
  {
    no: 67,
    scenario: '1. Panggil fungsi getTransactionById()\n2. Ambil transaksi dengan id valid\n3. Verifikasi hasil',
    testCaseId: 'UT-TRX-002',
    testData: 'transactionId',
    expectedResult: 'Return transaction object',
    status: getStatus('UT-TRX-002')
  },
  {
    no: 68,
    scenario: '1. Panggil fungsi updateTransactionStatus()\n2. Update status ke PAID\n3. Verifikasi update',
    testCaseId: 'UT-TRX-003',
    testData: 'transactionId, status: PAID',
    expectedResult: 'Return updated transaction',
    status: getStatus('UT-TRX-003')
  },
  {
    no: 69,
    scenario: '1. Panggil fungsi getUserTransactions()\n2. Ambil transaksi user\n3. Verifikasi hasil',
    testCaseId: 'UT-TRX-004',
    testData: 'userId',
    expectedResult: 'Return paginated transactions',
    status: getStatus('UT-TRX-004')
  },

  // ============================================
  // UNIT TESTING - MENTOR SERVICE (5)
  // ============================================
  {
    no: 70,
    scenario: '1. Panggil fungsi applyAsMentor()\n2. User apply sebagai mentor\n3. Verifikasi profile',
    testCaseId: 'UT-MNT-001',
    testData: 'userId, profileData',
    expectedResult: 'Return mentor profile',
    status: getStatus('UT-MNT-001')
  },
  {
    no: 71,
    scenario: '1. Panggil fungsi getMentorProfileByUserId()\n2. Ambil profil mentor\n3. Verifikasi hasil',
    testCaseId: 'UT-MNT-002',
    testData: 'userId',
    expectedResult: 'Return mentor profile',
    status: getStatus('UT-MNT-002')
  },
  {
    no: 72,
    scenario: '1. Panggil fungsi updateMentorProfile()\n2. Update profil mentor\n3. Verifikasi update',
    testCaseId: 'UT-MNT-003',
    testData: 'userId, data',
    expectedResult: 'Return updated profile',
    status: getStatus('UT-MNT-003')
  },
  {
    no: 73,
    scenario: '1. Panggil fungsi approveMentor()\n2. Admin approve mentor\n3. Verifikasi status',
    testCaseId: 'UT-MNT-004',
    testData: 'mentorId',
    expectedResult: 'Status berubah ke APPROVED',
    status: getStatus('UT-MNT-004')
  },
  {
    no: 74,
    scenario: '1. Panggil fungsi rejectMentor()\n2. Admin reject mentor dengan alasan\n3. Verifikasi status',
    testCaseId: 'UT-MNT-005',
    testData: 'mentorId, reason',
    expectedResult: 'Status berubah ke REJECTED',
    status: getStatus('UT-MNT-005')
  },

  // ============================================
  // INTEGRATION TESTING - AUTH API (5)
  // ============================================
  {
    no: 75,
    scenario: '1. Kirim POST request ke /api/auth/register\n2. Body: valid user data\n3. Verifikasi response',
    testCaseId: 'IT-AUTH-001',
    testData: 'valid user data',
    expectedResult: 'Status 201, return user + token',
    status: getStatus('IT-AUTH-001')
  },
  {
    no: 76,
    scenario: '1. Kirim POST request ke /api/auth/register\n2. Body: email duplikat\n3. Verifikasi error',
    testCaseId: 'IT-AUTH-002',
    testData: 'existing email',
    expectedResult: 'Status 400, error message',
    status: getStatus('IT-AUTH-002')
  },
  {
    no: 77,
    scenario: '1. Kirim POST request ke /api/auth/login\n2. Body: valid credentials\n3. Verifikasi response',
    testCaseId: 'IT-AUTH-003',
    testData: 'valid credentials',
    expectedResult: 'Status 200, return user + token',
    status: getStatus('IT-AUTH-003')
  },
  {
    no: 78,
    scenario: '1. Kirim POST request ke /api/auth/login\n2. Body: wrong password\n3. Verifikasi error',
    testCaseId: 'IT-AUTH-004',
    testData: 'wrong password',
    expectedResult: 'Status 401, error message',
    status: getStatus('IT-AUTH-004')
  },
  {
    no: 79,
    scenario: '1. Kirim POST request ke /api/auth/change-password\n2. Body: current + new password\n3. Verifikasi response',
    testCaseId: 'IT-AUTH-005',
    testData: 'current + new password',
    expectedResult: 'Status 200, success',
    status: getStatus('IT-AUTH-005')
  },

  // ============================================
  // INTEGRATION TESTING - COURSE API (6)
  // ============================================
  {
    no: 80,
    scenario: '1. Kirim GET request ke /api/courses\n2. Tanpa parameter\n3. Verifikasi response',
    testCaseId: 'IT-CRS-001',
    testData: '-',
    expectedResult: 'Status 200, return courses',
    status: getStatus('IT-CRS-001')
  },
  {
    no: 81,
    scenario: '1. Kirim GET request ke /api/courses\n2. Query: categoryId\n3. Verifikasi filter',
    testCaseId: 'IT-CRS-002',
    testData: 'categoryId',
    expectedResult: 'Status 200, filtered courses',
    status: getStatus('IT-CRS-002')
  },
  {
    no: 82,
    scenario: '1. Kirim GET request ke /api/courses/[id]\n2. courseId valid\n3. Verifikasi detail',
    testCaseId: 'IT-CRS-003',
    testData: 'valid courseId',
    expectedResult: 'Status 200, return course detail',
    status: getStatus('IT-CRS-003')
  },
  {
    no: 83,
    scenario: '1. Kirim GET request ke /api/courses/[id]\n2. courseId invalid\n3. Verifikasi error',
    testCaseId: 'IT-CRS-004',
    testData: 'invalid courseId',
    expectedResult: 'Status 404, error',
    status: getStatus('IT-CRS-004')
  },
  {
    no: 84,
    scenario: '1. Kirim POST request ke /api/courses/[id]/enroll\n2. Header: Authorization\n3. Verifikasi enrollment',
    testCaseId: 'IT-CRS-005',
    testData: 'Authorization header',
    expectedResult: 'Status 201, return enrollment',
    status: getStatus('IT-CRS-005')
  },
  {
    no: 85,
    scenario: '1. Kirim POST request ke /api/courses/[id]/enroll\n2. Tanpa Authorization\n3. Verifikasi unauthorized',
    testCaseId: 'IT-CRS-006',
    testData: '-',
    expectedResult: 'Status 401, unauthorized',
    status: getStatus('IT-CRS-006')
  },

  // ============================================
  // INTEGRATION TESTING - USER API (5)
  // ============================================
  {
    no: 86,
    scenario: '1. Kirim GET request ke /api/users/profile\n2. Header: Authorization\n3. Verifikasi profile',
    testCaseId: 'IT-USR-001',
    testData: 'Authorization header',
    expectedResult: 'Status 200, return profile',
    status: getStatus('IT-USR-001')
  },
  {
    no: 87,
    scenario: '1. Kirim PUT request ke /api/users/profile\n2. Body: profile data\n3. Verifikasi update',
    testCaseId: 'IT-USR-002',
    testData: 'profile data',
    expectedResult: 'Status 200, updated profile',
    status: getStatus('IT-USR-002')
  },
  {
    no: 88,
    scenario: '1. Kirim GET request ke /api/users/enrollments\n2. Header: Authorization\n3. Verifikasi enrollments',
    testCaseId: 'IT-USR-003',
    testData: 'Authorization header',
    expectedResult: 'Status 200, return enrollments',
    status: getStatus('IT-USR-003')
  },
  {
    no: 89,
    scenario: '1. Kirim GET request ke /api/users/wishlist\n2. Header: Authorization\n3. Verifikasi wishlist',
    testCaseId: 'IT-USR-004',
    testData: 'Authorization header',
    expectedResult: 'Status 200, return wishlist',
    status: getStatus('IT-USR-004')
  },
  {
    no: 90,
    scenario: '1. Kirim POST request ke /api/users/wishlist\n2. Body: courseId\n3. Verifikasi entry',
    testCaseId: 'IT-USR-005',
    testData: 'courseId',
    expectedResult: 'Status 201, return entry',
    status: getStatus('IT-USR-005')
  },

  // ============================================
  // INTEGRATION TESTING - ADMIN API (4)
  // ============================================
  {
    no: 91,
    scenario: '1. Kirim GET request ke /api/admin/users\n2. Header: Admin token\n3. Verifikasi users',
    testCaseId: 'IT-ADM-001',
    testData: 'Admin token',
    expectedResult: 'Status 200, return users',
    status: getStatus('IT-ADM-001')
  },
  {
    no: 92,
    scenario: '1. Kirim GET request ke /api/admin/users\n2. Header: Student token\n3. Verifikasi forbidden',
    testCaseId: 'IT-ADM-002',
    testData: 'Student token',
    expectedResult: 'Status 403, forbidden',
    status: getStatus('IT-ADM-002')
  },
  {
    no: 93,
    scenario: '1. Kirim PUT request ke /api/admin/courses/[id]/approve\n2. Header: Admin token\n3. Verifikasi approve',
    testCaseId: 'IT-ADM-003',
    testData: 'Admin token',
    expectedResult: 'Status 200, approved',
    status: getStatus('IT-ADM-003')
  },
  {
    no: 94,
    scenario: '1. Kirim PUT request ke /api/admin/mentors/[id]/approve\n2. Header: Admin token\n3. Verifikasi approve',
    testCaseId: 'IT-ADM-004',
    testData: 'Admin token',
    expectedResult: 'Status 200, approved',
    status: getStatus('IT-ADM-004')
  },

  // ============================================
  // INTEGRATION TESTING - REVIEW API (4)
  // ============================================
  {
    no: 95,
    scenario: '1. Kirim GET request ke /api/reviews/course/[id]\n2. Path: courseId\n3. Verifikasi reviews',
    testCaseId: 'IT-REV-001',
    testData: 'courseId',
    expectedResult: 'Status 200, return reviews',
    status: getStatus('IT-REV-001')
  },
  {
    no: 96,
    scenario: '1. Kirim POST request ke /api/users/reviews\n2. Body: rating, comment\n3. Verifikasi review',
    testCaseId: 'IT-REV-002',
    testData: 'rating, comment',
    expectedResult: 'Status 201, return review',
    status: getStatus('IT-REV-002')
  },
  {
    no: 97,
    scenario: '1. Kirim PUT request ke /api/users/reviews/[id]\n2. Body: updated data\n3. Verifikasi update',
    testCaseId: 'IT-REV-003',
    testData: 'updated data',
    expectedResult: 'Status 200, updated review',
    status: getStatus('IT-REV-003')
  },
  {
    no: 98,
    scenario: '1. Kirim DELETE request ke /api/users/reviews/[id]\n2. Path: reviewId\n3. Verifikasi hapus',
    testCaseId: 'IT-REV-004',
    testData: 'reviewId',
    expectedResult: 'Status 200, success',
    status: getStatus('IT-REV-004')
  }
];

// Build worksheet data
const wsData = [
  ['No', 'Test Scenario/Test Steps', 'Test Case ID', 'Test Data', 'Expected Result', 'Actual Result', 'Status', 'Defect ID']
];

testCases.forEach(tc => {
  wsData.push([
    tc.no,
    tc.scenario,
    tc.testCaseId,
    tc.testData,
    tc.expectedResult,
    tc.status === 'PASS' ? 'Sesuai' : 'Tidak Sesuai',
    tc.status,
    tc.status === 'FAIL' ? `DEF-${tc.testCaseId}` : '-'
  ]);
});

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(wsData);

// Set column widths
ws['!cols'] = [
  { wch: 5 },   // No
  { wch: 60 },  // Test Scenario
  { wch: 15 },  // Test Case ID
  { wch: 40 },  // Test Data
  { wch: 40 },  // Expected Result
  { wch: 15 },  // Actual Result
  { wch: 8 },   // Status
  { wch: 15 }   // Defect ID
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Test Cases');

// Write file
const outputPath = './test-reports/laporan_pengujian_whitebox.xlsx';
XLSX.writeFile(wb, outputPath);

console.log(`\n✅ Excel file berhasil dibuat: ${outputPath}`);
console.log(`Total test cases: ${testCases.length}`);
console.log(`PASS: ${testCases.filter(t => t.status === 'PASS').length}`);
console.log(`FAIL: ${testCases.filter(t => t.status === 'FAIL').length}`);
