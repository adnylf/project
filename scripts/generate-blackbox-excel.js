/**
 * Script untuk generate Excel file blackbox test cases untuk Katalon
 * 30 test cases (20 System Test + 10 Acceptance Test)
 */

const XLSX = require('xlsx');

// All 30 blackbox test cases
const testCases = [
  // ============================================
  // SYSTEM TEST - AUTHENTICATION (6)
  // ============================================
  {
    no: 1,
    scenario: '1. Buka halaman registrasi\n2. Isi nama lengkap, email, password, confirm password\n3. Klik tombol "Daftar"',
    testCaseId: 'ST-AUTH-001',
    testData: 'nama: Paijo Test\nemail: paijo.test@gmail.com\npassword: @Paijo123\nconfirm: @Paijo123',
    expectedResult: 'Registrasi berhasil, redirect ke halaman login',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 2,
    scenario: '1. Buka halaman registrasi\n2. Isi data dengan email yang sudah terdaftar\n3. Klik tombol "Daftar"',
    testCaseId: 'ST-AUTH-002',
    testData: 'email: existing@gmail.com',
    expectedResult: 'Error "Email sudah terdaftar" tampil',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 3,
    scenario: '1. Buka halaman login\n2. Isi email dan password valid\n3. Klik tombol "Masuk"',
    testCaseId: 'ST-AUTH-003',
    testData: 'email: student@test.com\npassword: @Student123',
    expectedResult: 'Login berhasil, redirect ke dashboard',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 4,
    scenario: '1. Buka halaman login\n2. Isi email valid dan password salah\n3. Klik tombol "Masuk"',
    testCaseId: 'ST-AUTH-004',
    testData: 'email: student@test.com\npassword: wrongpassword',
    expectedResult: 'Error "Email atau password salah" tampil',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 5,
    scenario: '1. Buka halaman login\n2. Isi email tidak terdaftar\n3. Klik tombol "Masuk"',
    testCaseId: 'ST-AUTH-005',
    testData: 'email: notexist@test.com\npassword: anypassword',
    expectedResult: 'Error "Email atau password salah" tampil',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 6,
    scenario: '1. Login terlebih dahulu\n2. Klik menu user di navbar\n3. Klik "Keluar"\n4. Konfirmasi logout',
    testCaseId: 'ST-AUTH-006',
    testData: 'user: logged in student',
    expectedResult: 'Logout berhasil, redirect ke login, token dihapus',
    actualResult: '',
    status: '',
    defectId: ''
  },

  // ============================================
  // SYSTEM TEST - COURSE MANAGEMENT (3)
  // ============================================
  {
    no: 7,
    scenario: '1. Buka halaman kursus (public)\n2. Verifikasi card kursus tampil\n3. Klik filter kategori\n4. Verifikasi hasil filter',
    testCaseId: 'ST-CRS-001',
    testData: 'URL: /courses\nFilter: Programming',
    expectedResult: 'Daftar kursus tampil, filter berfungsi',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 8,
    scenario: '1. Buka halaman kursus\n2. Klik salah satu kursus\n3. Verifikasi detail kursus',
    testCaseId: 'ST-CRS-002',
    testData: 'Kursus: JavaScript Dasar',
    expectedResult: 'Detail kursus tampil: judul, deskripsi, silabus, mentor',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 9,
    scenario: '1. Buka halaman kursus\n2. Isi search box\n3. Tekan Enter\n4. Verifikasi hasil',
    testCaseId: 'ST-CRS-003',
    testData: 'search: javascript',
    expectedResult: 'Kursus yang mengandung "javascript" tampil',
    actualResult: '',
    status: '',
    defectId: ''
  },

  // ============================================
  // SYSTEM TEST - ENROLLMENT (3)
  // ============================================
  {
    no: 10,
    scenario: '1. Login sebagai student\n2. Buka detail kursus gratis\n3. Klik "Daftar Gratis"\n4. Konfirmasi',
    testCaseId: 'ST-ENR-001',
    testData: 'user: student@test.com\nkursus: Kursus Gratis (is_free=true)',
    expectedResult: 'Enrollment berhasil, alert sukses, redirect ke kursus',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 11,
    scenario: '1. Login sebagai student\n2. Buka detail kursus berbayar\n3. Verifikasi harga\n4. Klik "Beli Sekarang"',
    testCaseId: 'ST-ENR-002',
    testData: 'kursus: Kursus Berbayar (price: 150000)',
    expectedResult: 'Redirect ke halaman pembayaran',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 12,
    scenario: '1. Login sebagai student\n2. Buka menu "Kursus Saya"\n3. Verifikasi daftar enrollment',
    testCaseId: 'ST-ENR-003',
    testData: 'URL: /user/courses',
    expectedResult: 'Daftar kursus yang diikuti tampil dengan progress',
    actualResult: '',
    status: '',
    defectId: ''
  },

  // ============================================
  // SYSTEM TEST - REVIEW (2)
  // ============================================
  {
    no: 13,
    scenario: '1. Login sebagai student (progress >= 10%)\n2. Buka kursus yang diikuti\n3. Scroll ke section review\n4. Pilih rating 5 bintang\n5. Isi komentar\n6. Klik "Kirim Review"',
    testCaseId: 'ST-REV-001',
    testData: 'rating: 5\ncomment: "Kursus sangat bagus!"',
    expectedResult: 'Review berhasil disimpan, tampil di daftar review',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 14,
    scenario: '1. Login sebagai student\n2. Buka menu "Review Saya"\n3. Klik "Edit" pada review\n4. Ubah rating dan komentar\n5. Klik "Simpan"',
    testCaseId: 'ST-REV-002',
    testData: 'rating: 4\ncomment: "Updated comment"',
    expectedResult: 'Review berhasil diupdate',
    actualResult: '',
    status: '',
    defectId: ''
  },

  // ============================================
  // SYSTEM TEST - USER MANAGEMENT (3)
  // ============================================
  {
    no: 15,
    scenario: '1. Login sebagai user\n2. Klik avatar di navbar\n3. Klik "Profil"\n4. Verifikasi data profil',
    testCaseId: 'ST-USR-001',
    testData: 'URL: /user/profile',
    expectedResult: 'Halaman profil tampil dengan foto, nama, email',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 16,
    scenario: '1. Buka halaman profil\n2. Klik "Edit Profil"\n3. Ubah nama dan bio\n4. Klik "Simpan"',
    testCaseId: 'ST-USR-002',
    testData: 'nama: Nama Baru\nbio: Bio baru saya',
    expectedResult: 'Profil berhasil diupdate',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 17,
    scenario: '1. Buka halaman settings\n2. Isi password lama dan baru\n3. Konfirmasi password\n4. Klik "Ganti Password"',
    testCaseId: 'ST-USR-003',
    testData: 'password lama: @Student123\npassword baru: @NewPass123',
    expectedResult: 'Password berhasil diganti, alert sukses',
    actualResult: '',
    status: '',
    defectId: ''
  },

  // ============================================
  // SYSTEM TEST - MENTOR (3)
  // ============================================
  {
    no: 18,
    scenario: '1. Login sebagai mentor\n2. Buka menu "Kursus Saya"\n3. Klik "Buat Kursus Baru"\n4. Isi form\n5. Simpan',
    testCaseId: 'ST-MNT-001',
    testData: 'judul: JavaScript Advanced\nkategori: Programming',
    expectedResult: 'Kursus berhasil dibuat dengan status DRAFT',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 19,
    scenario: '1. Buka detail kursus (mentor)\n2. Klik "Tambah Section"\n3. Isi nama section\n4. Klik "Tambah Materi"\n5. Upload video\n6. Simpan',
    testCaseId: 'ST-MNT-002',
    testData: 'section: Pengenalan\nmateri: Video intro',
    expectedResult: 'Section dan materi berhasil ditambahkan',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 20,
    scenario: '1. Buka detail kursus (sudah ada section/materi)\n2. Klik "Submit untuk Review"\n3. Konfirmasi',
    testCaseId: 'ST-MNT-003',
    testData: 'kursus dengan minimal 1 section dan materi',
    expectedResult: 'Status berubah ke PENDING_REVIEW',
    actualResult: '',
    status: '',
    defectId: ''
  },

  // ============================================
  // ACCEPTANCE TEST - STUDENT (3)
  // ============================================
  {
    no: 21,
    scenario: 'User Journey: Registrasi hingga Belajar\n1. Registrasi akun baru\n2. Login\n3. Browse kursus\n4. Enroll kursus gratis\n5. Buka materi\n6. Tandai selesai',
    testCaseId: 'AT-STUDENT-001',
    testData: 'new user: newstudent@test.com\nkursus: Kursus Gratis',
    expectedResult: 'User berhasil belajar, progress terupdate',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 22,
    scenario: 'User Journey: Review Kursus\n1. Login (progress >= 10%)\n2. Buka kursus\n3. Beri rating 5\n4. Tulis komentar\n5. Submit review',
    testCaseId: 'AT-STUDENT-002',
    testData: 'user dengan enrollment >= 10%\nrating: 5',
    expectedResult: 'Review tersimpan, rating kursus terupdate',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 23,
    scenario: 'User Journey: Wishlist\n1. Login\n2. Browse kursus\n3. Klik icon hati\n4. Buka halaman wishlist',
    testCaseId: 'AT-STUDENT-003',
    testData: 'kursus yang menarik',
    expectedResult: 'Kursus tersimpan di wishlist',
    actualResult: '',
    status: '',
    defectId: ''
  },

  // ============================================
  // ACCEPTANCE TEST - MENTOR (3)
  // ============================================
  {
    no: 24,
    scenario: 'User Journey: Buat Kursus\n1. Login mentor\n2. Buka "Kursus Saya"\n3. Buat kursus baru\n4. Isi form lengkap\n5. Simpan',
    testCaseId: 'AT-MENTOR-001',
    testData: 'mentor: mentor@test.com\njudul: New Course',
    expectedResult: 'Kursus berhasil dibuat (DRAFT)',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 25,
    scenario: 'User Journey: Tambah Materi\n1. Buka kursus\n2. Tambah section\n3. Tambah materi video\n4. Simpan',
    testCaseId: 'AT-MENTOR-002',
    testData: 'section: Bab 1\nmateri: video.mp4',
    expectedResult: 'Materi berhasil ditambahkan',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 26,
    scenario: 'User Journey: Submit untuk Review\n1. Kursus sudah ada materi\n2. Klik Submit\n3. Konfirmasi',
    testCaseId: 'AT-MENTOR-003',
    testData: 'kursus lengkap',
    expectedResult: 'Status: PENDING_REVIEW',
    actualResult: '',
    status: '',
    defectId: ''
  },

  // ============================================
  // ACCEPTANCE TEST - ADMIN (4)
  // ============================================
  {
    no: 27,
    scenario: 'User Journey: Approve Kursus\n1. Login admin\n2. Buka menu Kursus\n3. Filter "Menunggu"\n4. Review kursus\n5. Klik Setujui',
    testCaseId: 'AT-ADMIN-001',
    testData: 'admin: admin@test.com',
    expectedResult: 'Kursus status: PUBLISHED',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 28,
    scenario: 'User Journey: Kelola User\n1. Login admin\n2. Buka menu Pengguna\n3. Cari user\n4. Klik Suspend\n5. Konfirmasi',
    testCaseId: 'AT-ADMIN-002',
    testData: 'user target: user@test.com',
    expectedResult: 'User status: SUSPENDED',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 29,
    scenario: 'User Journey: Approve Mentor\n1. Login admin\n2. Buka menu Mentor\n3. Filter pending\n4. Review profil\n5. Klik Setujui',
    testCaseId: 'AT-ADMIN-003',
    testData: 'mentor pending',
    expectedResult: 'Mentor status: APPROVED, role: MENTOR',
    actualResult: '',
    status: '',
    defectId: ''
  },
  {
    no: 30,
    scenario: 'User Journey: Reject Kursus\n1. Login admin\n2. Buka kursus pending\n3. Review\n4. Klik Tolak\n5. Isi alasan',
    testCaseId: 'AT-ADMIN-004',
    testData: 'alasan: Konten tidak lengkap',
    expectedResult: 'Kursus status: DRAFT dengan alasan',
    actualResult: '',
    status: '',
    defectId: ''
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
    tc.actualResult,
    tc.status,
    tc.defectId
  ]);
});

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(wsData);

// Set column widths
ws['!cols'] = [
  { wch: 5 },   // No
  { wch: 60 },  // Test Scenario
  { wch: 18 },  // Test Case ID
  { wch: 40 },  // Test Data
  { wch: 45 },  // Expected Result
  { wch: 20 },  // Actual Result
  { wch: 10 },  // Status
  { wch: 15 }   // Defect ID
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Blackbox Test Cases');

// Write file
const outputPath = './test-reports/laporan_pengujian_blackbox.xlsx';
XLSX.writeFile(wb, outputPath);

console.log(`\n✅ Excel file berhasil dibuat: ${outputPath}`);
console.log(`Total test cases: ${testCases.length}`);
console.log(`System Test: 20`);
console.log(`Acceptance Test: 10`);
