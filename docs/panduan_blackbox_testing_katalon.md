# Panduan Blackbox Testing dengan Katalon
## Platform E-Learning Inklusif

---

## 1. Persiapan Katalon Studio

### 1.1 Download & Instalasi
1. Download Katalon Studio dari https://katalon.com/download
2. Install dan buka Katalon Studio
3. Login dengan akun Katalon (bisa pakai akun gratis)

### 1.2 Buat Project Baru
1. **File** → **New Project**
2. **Name**: `E-Learning-Blackbox-Testing`
3. **Type**: `Web`
4. **Project Location**: Pilih folder yang diinginkan
5. Klik **OK**

### 1.3 Konfigurasi Browser
1. Buka **Project Settings** → **Execution**
2. Pilih browser utama: **Chrome** (disarankan)
3. Pastikan ChromeDriver sudah terinstall

---

## 2. Struktur Test Cases

```
E-Learning-Blackbox-Testing/
├── Test Cases/
│   ├── System Test/
│   │   ├── ST-AUTH-xxx (Authentication)
│   │   ├── ST-CRS-xxx (Course Management)
│   │   ├── ST-ENR-xxx (Enrollment)
│   │   ├── ST-REV-xxx (Review System)
│   │   └── ST-USR-xxx (User Management)
│   └── Acceptance Test/
│       ├── AT-STUDENT-xxx (Student Flows)
│       ├── AT-MENTOR-xxx (Mentor Flows)
│       └── AT-ADMIN-xxx (Admin Flows)
├── Object Repository/
│   ├── Page_Login/
│   ├── Page_Register/
│   ├── Page_Dashboard/
│   ├── Page_Courses/
│   └── ...
├── Test Suites/
│   ├── System_Test_Suite
│   └── Acceptance_Test_Suite
└── Data Files/
    ├── TestData_Users.xlsx
    └── TestData_Courses.xlsx
```

---

## 3. System Test

### 3.1 Authentication System Tests

#### ST-AUTH-001: Registrasi User Baru
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Buka halaman registrasi | URL: `/auth/register` | Halaman registrasi tampil |
| 2 | Isi nama lengkap | `Paijo Test` | Field terisi |
| 3 | Isi email | `paijo.test@gmail.com` | Field terisi |
| 4 | Isi password | `@Paijo123` | Field terisi (masked) |
| 5 | Isi confirm password | `@Paijo123` | Field terisi (masked) |
| 6 | Klik tombol "Daftar" | - | Loading indicator muncul |
| 7 | Verifikasi redirect | - | Redirect ke halaman login |
| 8 | Verifikasi pesan sukses | - | Alert "Registrasi berhasil" tampil |

**Katalon Script:**
```groovy
// ST-AUTH-001: Registrasi User Baru
WebUI.openBrowser('')
WebUI.navigateToUrl('http://localhost:3000/auth/register')
WebUI.setText(findTestObject('Page_Register/input_nama'), 'Paijo Test')
WebUI.setText(findTestObject('Page_Register/input_email'), 'paijo.test@gmail.com')
WebUI.setText(findTestObject('Page_Register/input_password'), '@Paijo123')
WebUI.setText(findTestObject('Page_Register/input_confirm_password'), '@Paijo123')
WebUI.click(findTestObject('Page_Register/button_daftar'))
WebUI.waitForPageLoad(10)
WebUI.verifyElementPresent(findTestObject('Page_Login/heading_login'), 10)
WebUI.closeBrowser()
```

---

#### ST-AUTH-002: Registrasi dengan Email Duplikat
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Buka halaman registrasi | URL: `/auth/register` | Halaman registrasi tampil |
| 2 | Isi data dengan email yang sudah terdaftar | `existing@gmail.com` | Field terisi |
| 3 | Klik tombol "Daftar" | - | Loading muncul |
| 4 | Verifikasi error | - | Pesan error "Email sudah terdaftar" |

---

#### ST-AUTH-003: Login dengan Kredensial Valid
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Buka halaman login | URL: `/auth/login` | Halaman login tampil |
| 2 | Isi email | `student@test.com` | Field terisi |
| 3 | Isi password | `@Student123` | Field terisi |
| 4 | Klik tombol "Masuk" | - | Loading indicator |
| 5 | Verifikasi redirect | - | Redirect ke dashboard |
| 6 | Verifikasi navbar | - | Nama user tampil di navbar |

---

#### ST-AUTH-004: Login dengan Password Salah
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Buka halaman login | URL: `/auth/login` | Halaman login tampil |
| 2 | Isi email valid | `student@test.com` | Field terisi |
| 3 | Isi password salah | `wrongpassword` | Field terisi |
| 4 | Klik tombol "Masuk" | - | Loading |
| 5 | Verifikasi error | - | Pesan "Email atau password salah" |

---

#### ST-AUTH-005: Login dengan Email Tidak Terdaftar
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Buka halaman login | URL: `/auth/login` | Halaman login tampil |
| 2 | Isi email tidak terdaftar | `notexist@test.com` | Field terisi |
| 3 | Isi password | `anypassword` | Field terisi |
| 4 | Klik tombol "Masuk" | - | Loading |
| 5 | Verifikasi error | - | Pesan "Email atau password salah" |

---

#### ST-AUTH-006: Logout
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Login terlebih dahulu | Valid credentials | Dashboard tampil |
| 2 | Klik menu user di navbar | - | Dropdown menu muncul |
| 3 | Klik "Keluar" | - | Konfirmasi muncul |
| 4 | Konfirmasi logout | - | Redirect ke login |
| 5 | Verifikasi token dihapus | - | Local storage kosong |

---

### 3.2 Course Management System Tests

#### ST-CRS-001: Lihat Daftar Kursus (Public)
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Buka halaman kursus | URL: `/courses` | Halaman kursus tampil |
| 2 | Verifikasi card kursus | - | Minimal 1 kursus tampil |
| 3 | Verifikasi info kursus | - | Judul, mentor, rating visible |
| 4 | Klik filter kategori | Kategori: "Programming" | Filter diterapkan |
| 5 | Verifikasi hasil filter | - | Kursus sesuai kategori |

---

#### ST-CRS-002: Lihat Detail Kursus
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Buka halaman kursus | URL: `/courses` | Halaman kursus tampil |
| 2 | Klik salah satu kursus | - | Redirect ke detail |
| 3 | Verifikasi info detail | - | Judul, deskripsi, silabus tampil |
| 4 | Verifikasi mentor info | - | Nama dan foto mentor tampil |
| 5 | Verifikasi tombol enroll | - | Tombol "Daftar" visible |

---

#### ST-CRS-003: Search Kursus
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Buka halaman kursus | URL: `/courses` | Halaman kursus tampil |
| 2 | Isi search box | `javascript` | Field terisi |
| 3 | Tekan Enter atau klik search | - | Loading |
| 4 | Verifikasi hasil | - | Kursus dengan "javascript" tampil |

---

### 3.3 Enrollment System Tests

#### ST-ENR-001: Enroll Kursus Gratis
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Login sebagai student | Valid credentials | Dashboard tampil |
| 2 | Buka detail kursus gratis | Kursus: is_free=true | Detail tampil |
| 3 | Klik tombol "Daftar Gratis" | - | Konfirmasi dialog |
| 4 | Konfirmasi enrollment | - | Loading |
| 5 | Verifikasi sukses | - | Alert "Berhasil terdaftar" |
| 6 | Verifikasi redirect | - | Redirect ke halaman kursus |

---

#### ST-ENR-002: Coba Enroll Kursus Berbayar
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Login sebagai student | Valid credentials | Dashboard tampil |
| 2 | Buka detail kursus berbayar | Kursus: is_free=false | Detail tampil |
| 3 | Verifikasi harga | - | Harga tampil (misal: Rp 150.000) |
| 4 | Klik tombol "Beli Sekarang" | - | Redirect ke pembayaran |

---

#### ST-ENR-003: Lihat Kursus yang Diikuti
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Login sebagai student | Valid credentials | Dashboard tampil |
| 2 | Buka menu "Kursus Saya" | URL: `/user/courses` | Daftar kursus tampil |
| 3 | Verifikasi enrollment | - | Kursus yang diikuti tampil |
| 4 | Verifikasi progress | - | Progress bar tampil |

---

### 3.4 Review System Tests

#### ST-REV-001: Buat Review Kursus
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Login sebagai student | Student dengan enrollment | Dashboard tampil |
| 2 | Buka kursus yang diikuti | Progress >= 10% | Halaman kursus tampil |
| 3 | Scroll ke section review | - | Form review visible |
| 4 | Pilih rating | 5 bintang | Rating terseleksi |
| 5 | Isi komentar | "Kursus sangat bagus!" | Field terisi |
| 6 | Klik "Kirim Review" | - | Loading |
| 7 | Verifikasi sukses | - | Review tampil di daftar |

---

#### ST-REV-002: Edit Review
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Login sebagai student | Student dengan review | Dashboard tampil |
| 2 | Buka menu "Review Saya" | URL: `/user/reviews` | Daftar review tampil |
| 3 | Klik "Edit" pada review | - | Form edit muncul |
| 4 | Ubah rating dan komentar | Rating: 4, "Updated" | Field terisi |
| 5 | Klik "Simpan" | - | Loading |
| 6 | Verifikasi update | - | Review terupdate |

---

### 3.5 User Management System Tests

#### ST-USR-001: Lihat Profil
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Login sebagai user | Valid credentials | Dashboard tampil |
| 2 | Klik avatar/nama di navbar | - | Dropdown muncul |
| 3 | Klik "Profil" | - | Halaman profil tampil |
| 4 | Verifikasi data profil | - | Foto, nama, email tampil |

---

#### ST-USR-002: Edit Profil
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Buka halaman profil | URL: `/user/profile` | Profil tampil |
| 2 | Klik "Edit Profil" | - | Form edit muncul |
| 3 | Ubah nama lengkap | "Nama Baru" | Field terisi |
| 4 | Ubah bio | "Bio baru saya" | Field terisi |
| 5 | Klik "Simpan" | - | Loading |
| 6 | Verifikasi update | - | Data terupdate |

---

#### ST-USR-003: Ganti Password
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Buka halaman settings | URL: `/user/settings` | Settings tampil |
| 2 | Isi password lama | Current password | Field terisi |
| 3 | Isi password baru | `@NewPass123` | Field terisi |
| 4 | Konfirmasi password | `@NewPass123` | Field terisi |
| 5 | Klik "Ganti Password" | - | Loading |
| 6 | Verifikasi sukses | - | Alert "Password berhasil diganti" |

---

## 4. Acceptance Test

### 4.1 Student User Stories

#### AT-STUDENT-001: User Journey - Registrasi hingga Belajar
```gherkin
Feature: Student Learning Journey

Scenario: New student registers and starts learning
  Given saya adalah pengunjung baru
  When saya membuka halaman registrasi
  And saya mengisi form registrasi dengan data valid
  And saya klik tombol "Daftar"
  Then saya berhasil terdaftar dan diarahkan ke login

  When saya login dengan kredensial yang baru dibuat
  Then saya masuk ke dashboard student

  When saya mencari kursus "JavaScript Dasar"
  And saya klik kursus tersebut
  And saya klik "Daftar Gratis"
  Then saya berhasil terdaftar di kursus

  When saya membuka materi pertama
  And saya menyelesaikan materi tersebut
  Then progress saya terupdate
```

**Langkah Katalon:**
| Step | Action | Expected |
|------|--------|----------|
| 1 | Registrasi akun baru | Redirect ke login |
| 2 | Login dengan akun baru | Dashboard tampil |
| 3 | Browse kursus | Daftar kursus tampil |
| 4 | Pilih kursus gratis | Detail kursus tampil |
| 5 | Enroll kursus | Berhasil terdaftar |
| 6 | Buka materi | Video/materi loading |
| 7 | Tandai selesai | Progress update |

---

#### AT-STUDENT-002: User Journey - Review Kursus
```gherkin
Feature: Course Review

Scenario: Student gives review after completing course
  Given saya sudah menyelesaikan 10% kursus
  When saya membuka halaman kursus
  And saya scroll ke bagian review
  And saya memberikan rating 5 bintang
  And saya menulis komentar "Sangat membantu!"
  And saya klik "Kirim Review"
  Then review saya berhasil tersimpan
  And rating kursus terupdate
```

---

#### AT-STUDENT-003: User Journey - Wishlist
```gherkin
Feature: Course Wishlist

Scenario: Student adds course to wishlist
  Given saya sudah login sebagai student
  When saya membuka halaman kursus
  And saya klik icon hati pada kursus yang menarik
  Then kursus ditambahkan ke wishlist

  When saya membuka halaman wishlist
  Then kursus yang saya simpan tampil
```

---

### 4.2 Mentor User Stories

#### AT-MENTOR-001: User Journey - Buat Kursus
```gherkin
Feature: Course Creation

Scenario: Mentor creates a new course
  Given saya sudah login sebagai mentor
  When saya membuka halaman "Kursus Saya"
  And saya klik "Buat Kursus Baru"
  And saya mengisi judul "JavaScript Advanced"
  And saya mengisi deskripsi
  And saya memilih kategori "Programming"
  And saya upload thumbnail
  And saya klik "Simpan"
  Then kursus berhasil dibuat dengan status DRAFT
```

**Langkah Katalon:**
| Step | Action | Expected |
|------|--------|----------|
| 1 | Login sebagai mentor | Dashboard mentor |
| 2 | Buka menu "Kursus Saya" | Daftar kursus tampil |
| 3 | Klik "Buat Kursus Baru" | Form muncul |
| 4 | Isi judul dan deskripsi | Field terisi |
| 5 | Pilih kategori | Dropdown terseleksi |
| 6 | Upload thumbnail | Preview tampil |
| 7 | Klik Simpan | Alert sukses |

---

#### AT-MENTOR-002: User Journey - Tambah Materi
```gherkin
Feature: Add Course Material

Scenario: Mentor adds video material
  Given saya sudah membuat kursus
  When saya membuka detail kursus
  And saya klik "Tambah Section"
  And saya isi nama section "Pengenalan"
  And saya klik "Tambah Materi"
  And saya upload video
  And saya isi judul materi
  And saya simpan
  Then materi berhasil ditambahkan
```

---

#### AT-MENTOR-003: User Journey - Submit untuk Review
```gherkin
Feature: Submit Course for Review

Scenario: Mentor submits course for admin review
  Given kursus saya memiliki minimal 1 section dan materi
  When saya membuka detail kursus
  And saya klik "Submit untuk Review"
  Then konfirmasi dialog muncul
  When saya konfirmasi
  Then status kursus berubah ke PENDING_REVIEW
```

---

### 4.3 Admin User Stories

#### AT-ADMIN-001: User Journey - Approve Kursus
```gherkin
Feature: Course Approval

Scenario: Admin approves pending course
  Given saya sudah login sebagai admin
  When saya membuka menu "Kursus"
  And saya filter status "Menunggu Review"
  Then daftar kursus pending tampil

  When saya klik detail kursus
  And saya review konten kursus
  And saya klik "Setujui"
  Then kursus berubah status ke PUBLISHED
  And mentor menerima notifikasi
```

---

#### AT-ADMIN-002: User Journey - Kelola User
```gherkin
Feature: User Management

Scenario: Admin suspends a user
  Given saya sudah login sebagai admin
  When saya membuka menu "Pengguna"
  And saya cari user tertentu
  And saya klik "Suspend"
  And saya konfirmasi
  Then user berubah status ke SUSPENDED
```

---

#### AT-ADMIN-003: User Journey - Approve Mentor
```gherkin
Feature: Mentor Approval

Scenario: Admin approves mentor application
  Given saya sudah login sebagai admin
  When saya membuka menu "Mentor"
  And saya filter "Menunggu Persetujuan"
  And saya review profil mentor
  And saya klik "Setujui"
  Then mentor berubah status ke APPROVED
  And user role berubah ke MENTOR
```

---

## 5. Object Repository Setup

### 5.1 Membuat Object Repository

1. Klik kanan pada **Object Repository**
2. **New** → **Folder** → Buat struktur folder
3. **New** → **Test Object** untuk setiap elemen

### 5.2 Contoh Object Repository

```
Object Repository/
├── Page_Login/
│   ├── input_email (id=email)
│   ├── input_password (id=password)
│   ├── button_login (xpath=//button[text()='Masuk'])
│   └── link_register (xpath=//a[contains(@href, 'register')])
├── Page_Register/
│   ├── input_nama (id=full_name)
│   ├── input_email (id=email)
│   ├── input_password (id=password)
│   ├── input_confirm_password (id=confirm_password)
│   └── button_daftar (xpath=//button[text()='Daftar'])
├── Page_Dashboard/
│   ├── heading_welcome (xpath=//h1[contains(text(), 'Dashboard')])
│   ├── card_statistics (css=.stat-card)
│   └── navbar_user_menu (id=user-menu)
└── Page_Courses/
    ├── input_search (id=search)
    ├── filter_category (id=category-filter)
    ├── card_course (css=.course-card)
    └── button_enroll (xpath=//button[text()='Daftar'])
```

---

## 6. Test Data Files

### 6.1 TestData_Users.xlsx

| Username | Email | Password | Role | Status |
|----------|-------|----------|------|--------|
| admin_test | admin@test.com | @Admin123 | ADMIN | ACTIVE |
| mentor_test | mentor@test.com | @Mentor123 | MENTOR | ACTIVE |
| student_test | student@test.com | @Student123 | STUDENT | ACTIVE |
| new_user | new@test.com | @NewUser123 | STUDENT | NEW |

### 6.2 TestData_Courses.xlsx

| CourseID | Title | Category | IsFree | Price | Status |
|----------|-------|----------|--------|-------|--------|
| CRS-001 | JavaScript Dasar | Programming | TRUE | 0 | PUBLISHED |
| CRS-002 | Web Design | Design | FALSE | 150000 | PUBLISHED |
| CRS-003 | Python Basics | Programming | TRUE | 0 | PUBLISHED |

---

## 7. Test Suite Configuration

### 7.1 System Test Suite
1. Klik kanan **Test Suites** → **New** → **Test Suite**
2. Name: `System_Test_Suite`
3. Tambahkan semua ST-xxx test cases
4. Set execution order: Sequential

### 7.2 Acceptance Test Suite
1. Buat Test Suite: `Acceptance_Test_Suite`
2. Tambahkan semua AT-xxx test cases
3. Set data-driven jika perlu

---

## 8. Execution & Reporting

### 8.1 Menjalankan Test

1. Pilih Test Suite
2. Klik **Run** atau tekan **Ctrl+Shift+A**
3. Pilih browser: Chrome
4. Tunggu eksekusi selesai

### 8.2 Melihat Report

1. Buka folder **Reports**
2. Klik report terakhir
3. Export ke HTML/PDF jika diperlukan

---

## 9. Ringkasan Test Cases

### System Test (20 test cases)
| ID | Kategori | Jumlah |
|----|----------|--------|
| ST-AUTH | Authentication | 6 |
| ST-CRS | Course Management | 3 |
| ST-ENR | Enrollment | 3 |
| ST-REV | Review System | 2 |
| ST-USR | User Management | 3 |
| ST-MNT | Mentor | 3 |
| **Total** | | **20** |

### Acceptance Test (10 test cases)
| ID | Kategori | Jumlah |
|----|----------|--------|
| AT-STUDENT | Student Journey | 3 |
| AT-MENTOR | Mentor Journey | 3 |
| AT-ADMIN | Admin Journey | 4 |
| **Total** | | **10** |

---

*Dokumen ini untuk pengujian blackbox menggunakan Katalon Studio*
*Platform E-Learning Inklusif - 14 Desember 2024*
