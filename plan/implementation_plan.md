# Zayn Finance - Phase 2: User Expansion & OCR/E-Statement Enhancements

Rencana ini menjelaskan langkah-langkah detail untuk mengimplementasikan Phase 2 dari aplikasi Zayn Finance. Rencana ini mencakup perbaikan alur registrasi, fitur OTP verifikasi email, lupa password, pembaruan menu profil, integrasi Google Sign-In, verifikasi manual hasil scan struk OCR, serta pemetaan kategori dan dompet pada saat impor e-statement PDF bank.

---

## User Review Required

> [!IMPORTANT]
> **Keputusan Teknis & Kebutuhan Konfigurasi:**
> 1. **Gmail SMTP Credentials (OTP)**: Backend akan memerlukan konfigurasi SMTP Gmail. Anda perlu membuat *App Password* pada akun Gmail yang digunakan agar aman dan tidak memicu blokir keamanan Google.
> 2. **Google OAuth Client ID (Google Sign-in)**: Anda perlu mendaftarkan aplikasi di Google Cloud Console untuk mendapatkan Client ID yang akan dikonfigurasi di frontend (.env) dan backend (.env).
> 3. **Format E-Statement PDF**: Kami telah merancang regex parsers untuk Bank BCA, Bank Jago, SeaBank, dan Bank Permata. Setelah Anda mengunggah sampel PDF asli (dengan informasi sensitif disensor), kami akan menyempurnakan filter pencocokan pola agar 100% akurat dengan layout PDF terbaru dari bank-bank tersebut.

---

## Proposed Changes

### 1. Database Schema Updates

#### [MODIFY] [schema.prisma](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/backend/prisma/schema.prisma)
- Menambahkan field baru pada model `User`:
  - `firstName` String (default "")
  - `lastName` String (default "")
  - `occupation` String? (Pekerjaan)
  - `phoneNumber` String?
  - `monthlyIncome` Decimal? @db.Decimal(15, 2) (Pendapatan Bulanan)
  - `financialGoal` String? (Tujuan Finansial)
- Menambahkan model `OtpVerification` untuk menyimpan OTP verifikasi pendaftaran & lupa password:
  ```prisma
  model OtpVerification {
    id        String   @id @default(uuid())
    email     String
    code      String
    purpose   String   // "REGISTER" | "FORGOT_PASSWORD"
    expiresAt DateTime
    createdAt DateTime @default(now())

    @@index([email, code])
    @@map("otp_verifications")
  }
  ```

---

### 2. Pendaftaran User & Profil Lebih Lengkap (2-Step Registration)

#### [MODIFY] [register/page.tsx](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/frontend/src/app/(auth)/register/page.tsx)
- Mengubah form pendaftaran menjadi **2-Step Wizard**:
  - **Step 1: Akun & Keamanan**: Input Email, Password, Konfirmasi Password.
  - **Step 2: Detail Finansial & Profil**: Input Nama Depan, Nama Belakang, Nomor Telepon, Pekerjaan, Pendapatan Bulanan, Saldo Awal Utama, dan Tujuan Finansial (Dropdown: Menabung, Investasi, Mengurangi Hutang, dll.).
- Mengirimkan data registrasi lengkap ke backend. Setelah registrasi sukses, arahkan ke halaman verifikasi email `/verify-email?email=<email>`.

#### [MODIFY] [settings/page.tsx](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/frontend/src/app/(dashboard)/settings/page.tsx)
- Memperluas tab **Profil** agar memuat form edit data lengkap yang baru ditambahkan (Nama Depan, Nama Belakang, Telepon, Pekerjaan, Pendapatan Bulanan, Saldo Awal, Tujuan Finansial).
- Menyambungkan form ke mutation `updateUser`.

#### [MODIFY] NestJS Users Module ([backend/src/modules/users/](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/backend/src/modules/users))
- Memperbarui `UpdateUserDto` untuk menyertakan field profil baru.
- Memperbarui `UsersService.update()` untuk menyimpan perubahan field-field ini ke database.

---

### 3. Koneksi Email Gmail & Sistem OTP Verifikasi

#### [NEW] NestJS Mail & OTP Services
- Menginstal library `nodemailer` dan `@types/nodemailer` di backend.
- **[NEW] [mail.service.ts](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/backend/src/modules/auth/mail.service.ts)**:
  - Mengirim email HTML dengan template OTP menggunakan config dari `mail.config.ts`.
- **[NEW] [otp.service.ts](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/backend/src/modules/auth/otp.service.ts)**:
  - Menghasilkan kode OTP 6-digit acak.
  - Menyimpan kode di database (`OtpVerification`) dengan masa kedaluwarsa (10 menit).
  - Melakukan validasi kode OTP dan masa aktif.

#### [MODIFY] NestJS Auth Module ([backend/src/modules/auth/](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/backend/src/modules/auth))
- Menambahkan endpoint verifikasi:
  - `POST /auth/verify-otp` dengan request body `{ email, code, purpose: 'REGISTER' }`. Jika valid, setel `isEmailVerified: true` pada user.
  - `POST /auth/resend-otp` dengan request body `{ email, purpose }`. Mengirim ulang kode OTP.
- Integrasikan dengan `AuthService.register()`: Saat user mendaftar, kirimkan OTP verifikasi otomatis ke emailnya dan buat akun dalam kondisi belum terverifikasi (`isEmailVerified: false`).

#### [NEW] Halaman Verifikasi Email ([verify-email/page.tsx](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/frontend/src/app/(auth)/verify-email/page.tsx))
- Membuat halaman UI minimalis untuk memasukkan kode OTP 6-digit.
- Tombol kirim ulang OTP dengan timer hitung mundur (resend cooldown 60 detik).
- Validasi OTP langsung, lalu otomatis mengalihkan user ke dashboard setelah verifikasi sukses.

---

### 4. Fitur Pemulihan Sandi (Forgot Password)

#### [MODIFY] NestJS Auth Controller ([backend/src/modules/auth/auth.controller.ts](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/backend/src/modules/auth/auth.controller.ts))
- Menambahkan endpoint pemulihan kata sandi:
  - `POST /auth/forgot-password`: Menerima `{ email }`. Mengirim OTP verifikasi dengan tujuan `FORGOT_PASSWORD`.
  - `POST /auth/reset-password`: Menerima `{ email, code, password }`. Memverifikasi OTP, melakukan hashing pada password baru, memperbarui database user, dan menghapus OTP.

#### [NEW] Halaman Lupa Password ([forgot-password/page.tsx](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/frontend/src/app/(auth)/forgot-password/page.tsx))
- **Step 1**: Input email untuk memicu pengiriman OTP lupa password.
- **Step 2**: Input kode OTP dan kata sandi baru (beserta konfirmasi kata sandi).
- Setelah sukses, arahkan kembali ke halaman `/login`.

---

### 5. Integrasi Google Sign-In

#### [MODIFY] NestJS Auth Module ([backend/src/modules/auth/](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/backend/src/modules/auth))
- Menginstal library `google-auth-library` di backend.
- Menambahkan endpoint `POST /auth/google/signin`:
  - Menerima token ID Google dari frontend.
  - Memverifikasi token ID menggunakan Client ID Google.
  - Jika email belum terdaftar, buat user baru di database (setel `isEmailVerified: true`).
  - Menghasilkan JWT Access & Refresh Token dan menyetel cookie.

#### [MODIFY] Frontend Login & Register Pages
- Menambahkan SDK Google Identity Services (`https://accounts.google.com/gsi/client`) secara dinamis.
- Mengaktifkan fungsi login Google pada tombol "Continue with Google" menggunakan Google One-Tap/Pop-up flow.
- Setelah sukses mendapatkan token ID, kirim ke backend `POST /auth/google/signin`.

---

### 6. Review & Koreksi Scan Struk OCR Sebelum Disimpan

#### [MODIFY] Halaman Scan Struk ([scan/receipt/page.tsx](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/frontend/src/app/(dashboard)/scan/receipt/page.tsx))
- Mengganti tombol "Simpan sebagai Transaksi (segera hadir)" yang dinonaktifkan menjadi form interaktif **Review & Edit**:
  - **Nama Merchant / Deskripsi** (input teks)
  - **Tanggal Transaksi** (datepicker/input tanggal)
  - **Jumlah Total (Amount)** (input angka)
  - **Kategori** (Dropdown menggunakan hook `useCategories` agar user dapat mengklasifikasikan pengeluaran)
  - **Dompet / Akun** (Dropdown menggunakan hook `useAccounts` untuk memilih dompet pemotong saldo)
  - **Catatan Tambahan** (input catatan opsional)
- Tombol **Simpan Transaksi**: Mengirim data yang telah dikoreksi/diedit ke endpoint `POST /transactions` untuk disimpan sebagai transaksi nyata dan memotong saldo dompet yang dipilih secara dinamis.

---

### 7. Impor E-Statement PDF Bank dengan Pemetaan Dompet & Kategori

#### [MODIFY] NestJS Bank Statement Module ([backend/src/modules/bank-statements/](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/backend/src/modules/bank-statements))
- Memperbarui `ImportTransactionsDto` agar menerima mapping akun/dompet:
  - `accountId` (String): Mengimpor seluruh baris transaksi e-statement ke satu dompet yang sama.
  - `accountMap` (Record<string, string>): Pemetaan dompet per-transaksi (opsional).
- Memperbarui `BankStatementsService.importTransactions()` agar menyimpan setiap transaksi menggunakan `accountId` yang dipetakan oleh user, bukan hanya default `null` (Saldo Utama).

#### [MODIFY] Frontend Import PDF Tab (`ImportStatementTab` in [scan/receipt/page.tsx](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/frontend/src/app/(dashboard)/scan/receipt/page.tsx))
- Menambahkan dropdown **Pilih Dompet Tujuan Default** di bagian atas tabel transaksi.
- Memperluas tabel hasil parse PDF statement:
  - Setiap baris transaksi memiliki **Dropdown Kategori** (memilih kategori transaksi).
  - Setiap baris transaksi memiliki **Dropdown Dompet** (default mengikuti pilihan Dompet Tujuan Default, namun bisa diganti per baris).
  - Kolom **Deskripsi** dan **Jumlah** dapat diedit secara langsung jika ada kesalahan pembacaan parse teks PDF.
- Tombol **Import (N)**: Mengirimkan daftar transaksi yang dipilih beserta kategori, dompet tujuan, dan detail deskripsi hasil koreksi ke backend `POST /bank-statements/:id/import` untuk diproses secara massal.

---

## Verification Plan

### Automated Tests
- Menjalankan unit test di backend:
  `cd backend && npm run test`
- Menjalankan kompilasi TypeScript di frontend untuk memastikan tidak ada tipe yang error:
  `cd frontend && npm run build`

### Manual Verification
1. **Pendaftaran & OTP**: Mendaftar akun baru, verifikasi email terkirim ke Inbox Gmail, salin kode OTP 6-digit, pastikan akun berhasil terverifikasi.
2. **Forgot Password**: Klik lupa sandi di login screen, input email, terima OTP, input OTP dan password baru, lalu tes login menggunakan password baru tersebut.
3. **Google Sign-In**: Klik "Continue with Google", selesaikan popup autentikasi Google, pastikan user otomatis login dan diarahkan ke dashboard.
4. **Scan Struk OCR**: Unggah struk belanja, verifikasi form Review & Edit terisi otomatis, ubah jumlah atau kategori secara manual, klik simpan, dan pastikan data di dashboard/transaksi sesuai hasil koreksi.
5. **Import E-Statement**: Unggah file e-statement bank, petakan kategori dan dompet tujuan untuk beberapa transaksi, lakukan impor massal, dan pastikan saldo masing-masing dompet bertambah/berkurang sesuai transaksi yang diimpor.
