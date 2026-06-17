# Software Requirements Specification (SRS)

## Zayn Finance — Money Management Application

| Informasi | Detail |
|---|---|
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 16 Juni 2026 |
| **Nama Produk** | Zayn Finance |
| **Tipe Aplikasi** | Progressive Web Application (PWA) |
| **Status** | Active Development |
| **Standar Acuan** | IEEE 830-1998 |

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Deskripsi Umum](#2-deskripsi-umum)
3. [Kebutuhan Fungsional](#3-kebutuhan-fungsional)
4. [Kebutuhan Non-Fungsional](#4-kebutuhan-non-fungsional)
5. [Antarmuka Eksternal](#5-antarmuka-eksternal)
6. [Skema Database](#6-skema-database)
7. [API Specification](#7-api-specification)
8. [Lampiran](#8-lampiran)

---

## 1. Pendahuluan

### 1.1 Tujuan Dokumen

Dokumen SRS ini mendefinisikan seluruh kebutuhan fungsional dan non-fungsional untuk aplikasi **Zayn Finance** — sebuah aplikasi manajemen keuangan pribadi berbasis web. Dokumen ini ditujukan kepada developer, QA tester, dan stakeholder untuk memahami spesifikasi teknis sistem secara menyeluruh.

### 1.2 Ruang Lingkup Produk

Zayn Finance adalah aplikasi PWA (Progressive Web Application) yang memungkinkan pengguna untuk:

- Mencatat dan mengelola transaksi pemasukan & pengeluaran
- Mengimpor transaksi dari e-statement bank (Permata, Jago, SeaBank, BCA)
- Memindai struk belanja melalui teknologi OCR
- Mengatur budget per kategori dengan period tertentu
- Mengatur reminder untuk tagihan/pembayaran
- Melihat laporan keuangan bulanan dan tahunan
- Menerima push notification untuk reminder
- Mengelola multiple wallet/account

### 1.3 Definisi, Akronim, dan Singkatan

| Istilah | Definisi |
|---|---|
| **PWA** | Progressive Web Application — web app yang dapat diinstal layaknya native app |
| **OCR** | Optical Character Recognition — teknologi pengenalan teks dari gambar |
| **JWT** | JSON Web Token — standar token untuk autentikasi |
| **OTP** | One-Time Password — kode verifikasi sekali pakai |
| **RBAC** | Role-Based Access Control — kontrol akses berdasarkan peran |
| **CRUD** | Create, Read, Update, Delete — operasi dasar data |
| **e-Statement** | Laporan mutasi rekening digital dalam format PDF |
| **VAPID** | Voluntary Application Server Identification — standar untuk web push |

### 1.4 Referensi Teknologi

| Layer | Teknologi | Versi |
|---|---|---|
| Frontend Framework | Next.js (App Router) | 15.x |
| Frontend Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | Shadcn UI | Latest |
| State Management | TanStack Query | 5.x |
| Backend Framework | NestJS | 10.x |
| Backend Language | TypeScript | 5.x |
| Database | PostgreSQL | 16 (Alpine) |
| ORM | Prisma | Latest |
| Caching | Redis | 7 (Alpine) |
| OCR Engine | Tesseract.js | Latest |
| Push Notifications | Web Push (VAPID) | — |
| PWA Toolkit | Serwist | Latest |
| API Documentation | Swagger (OpenAPI) | 3.0 |
| Containerization | Docker Compose | 3.8 |

---

## 2. Deskripsi Umum

### 2.1 Perspektif Produk

Zayn Finance adalah sistem client-server terpisah (decoupled) yang terdiri dari:

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser/PWA)                  │
│  Next.js 15 + TypeScript + Tailwind + Shadcn UI         │
│  Port: 3000                                             │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (REST API)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (API Server)                  │
│  NestJS + TypeScript + Prisma ORM                       │
│  Port: 3001 | Prefix: /api/v1                           │
├──────────────────┬──────────────────┬───────────────────┤
│   PostgreSQL     │      Redis       │   File Storage    │
│   Port: 5435     │   Port: 6379     │   ./uploads/      │
└──────────────────┴──────────────────┴───────────────────┘
```

### 2.2 Fungsi Utama Produk

| # | Modul | Deskripsi |
|---|---|---|
| 1 | Autentikasi | Register, login, Google OAuth, OTP verification, forgot/reset password |
| 2 | Dashboard | Ringkasan keuangan, grafik tren, transaksi terbaru |
| 3 | Transaksi | CRUD transaksi income/expense/transfer dengan multi-account |
| 4 | Kategori | Manajemen kategori default & custom per user |
| 5 | Budget | Perencanaan anggaran per kategori (weekly/monthly/yearly) |
| 6 | Laporan | Laporan keuangan bulanan dan tahunan dengan export Excel/PDF |
| 7 | Reminder | Pengingat tagihan/pembayaran dengan recurring support |
| 8 | OCR | Scan struk belanja via upload gambar |
| 9 | Bank Statement | Import transaksi dari e-statement PDF (4 bank) |
| 10 | Notifikasi | Web push notification untuk reminder |
| 11 | Akun/Wallet | Manajemen multiple account/dompet |
| 12 | Admin Panel | Statistik global & manajemen user (Admin only) |
| 13 | Profil User | Update profil, avatar, change password |

### 2.3 Karakteristik Pengguna

| Role | Deskripsi | Hak Akses |
|---|---|---|
| **USER** | Pengguna akhir yang mengelola keuangan pribadinya | Semua fitur personal (transaksi, budget, reminder, scan, laporan, settings) |
| **ADMIN** | Administrator sistem | Semua hak USER + akses panel admin (statistik global, manajemen user, CRUD user) |

### 2.4 Batasan Sistem

- Aplikasi hanya mendukung mata uang **Rupiah (IDR)**
- OCR hanya mendukung format gambar: JPEG, PNG, JPG, WebP (maks. 10MB)
- Bank statement hanya mendukung format PDF (maks. 20MB) dari 4 bank: Permata, Jago, SeaBank, BCA
- Autentikasi menggunakan JWT dengan access token + refresh token (cookie-based)
- Rate limiting global: 60 requests/menit

### 2.5 Asumsi dan Dependensi

- Pengguna memiliki browser modern yang mendukung Service Worker (untuk PWA & push notification)
- Server memiliki koneksi internet untuk pengiriman email OTP dan Google OAuth
- Docker Desktop tersedia untuk menjalankan PostgreSQL & Redis secara lokal
- Tesseract.js OCR engine menggunakan model bahasa Indonesia (`ind`) dan Inggris (`eng`)

---

## 3. Kebutuhan Fungsional

### 3.1 Modul Autentikasi (AUTH)

#### FR-AUTH-001: Registrasi User Baru

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | `name`, `email`, `password` |
| **Proses** | Validasi email unik → Hash password (bcrypt) → Simpan user → Generate JWT pair → Kirim OTP email |
| **Output** | User object, accessToken, refreshToken (cookie) |
| **Rate Limit** | 5 requests / 60 detik |

#### FR-AUTH-002: Login

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | `email`, `password` |
| **Proses** | Verifikasi credential → Generate JWT access token + refresh token |
| **Output** | User object, accessToken, refreshToken (set sebagai HttpOnly cookie) |
| **Rate Limit** | 5 requests / 60 detik |

#### FR-AUTH-003: Login dengan Google

| Atribut | Detail |
|---|---|
| **Prioritas** | Sedang |
| **Input** | Google OAuth `token` |
| **Proses** | Verifikasi token Google → Buat/cari user → Generate JWT pair |
| **Output** | User object, accessToken, refreshToken |
| **Rate Limit** | 10 requests / 60 detik |

#### FR-AUTH-004: Verifikasi Email via OTP

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | `email`, `code`, `purpose` (REGISTER / FORGOT_PASSWORD) |
| **Proses** | Cocokkan OTP dengan database → Set `isEmailVerified = true` |
| **Output** | Pesan sukses |

#### FR-AUTH-005: Resend OTP

| Atribut | Detail |
|---|---|
| **Prioritas** | Sedang |
| **Input** | `email`, `purpose` |
| **Proses** | Generate OTP baru → Kirim email |
| **Output** | Pesan sukses |

#### FR-AUTH-006: Forgot Password

| Atribut | Detail |
|---|---|
| **Prioritas** | Sedang |
| **Input** | `email` |
| **Proses** | Generate OTP → Kirim ke email user |
| **Output** | Pesan sukses |

#### FR-AUTH-007: Reset Password

| Atribut | Detail |
|---|---|
| **Prioritas** | Sedang |
| **Input** | `email`, `code` (OTP), `password` (baru) |
| **Proses** | Verifikasi OTP → Update password (bcrypt hash) |
| **Output** | Pesan sukses |

#### FR-AUTH-008: Change Password

| Atribut | Detail |
|---|---|
| **Prioritas** | Sedang |
| **Input** | `currentPassword`, `newPassword` |
| **Proses** | Verifikasi password lama → Update ke password baru |
| **Output** | Pesan sukses |
| **Autentikasi** | Bearer Token (wajib login) |

#### FR-AUTH-009: Refresh Token

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | Refresh token (dari cookie) |
| **Proses** | Verifikasi refresh token → Generate token pair baru |
| **Output** | accessToken, refreshToken baru |

#### FR-AUTH-010: Logout

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Proses** | Invalidate refresh token → Clear cookie |
| **Output** | Pesan sukses |

#### FR-AUTH-011: Get Profile (Me)

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Proses** | Ambil data user berdasarkan JWT |
| **Output** | User object lengkap |

---

### 3.2 Modul Transaksi (TRX)

#### FR-TRX-001: Buat Transaksi Baru

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | `amount`, `type` (INCOME/EXPENSE/TRANSFER), `date`, `categoryId`, `description?`, `note?`, `receipt?`, `accountId?`, `destinationAccountId?` |
| **Proses** | Validasi data → Simpan transaksi → Update budget spent (jika EXPENSE) |
| **Output** | Transaction object |
| **Aturan Bisnis** | Jika `type = TRANSFER`, wajib memiliki `accountId` dan `destinationAccountId` |

#### FR-TRX-002: Lihat Daftar Transaksi

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | Filter: `type?`, `categoryId?`, `startDate?`, `endDate?`, `search?`, `page`, `limit`, `sortBy`, `sortOrder` |
| **Proses** | Query dengan pagination dan filter |
| **Output** | Array transaksi + metadata pagination (`total`, `page`, `limit`, `totalPages`) |

#### FR-TRX-003: Lihat Detail Transaksi

| Atribut | Detail |
|---|---|
| **Prioritas** | Sedang |
| **Input** | Transaction ID |
| **Output** | Transaction object dengan relasi category & account |

#### FR-TRX-004: Update Transaksi

| Atribut | Detail |
|---|---|
| **Prioritas** | Sedang |
| **Input** | Transaction ID + field yang diupdate |
| **Aturan Bisnis** | User hanya bisa update transaksi milik sendiri |

#### FR-TRX-005: Hapus Transaksi

| Atribut | Detail |
|---|---|
| **Prioritas** | Sedang |
| **Input** | Transaction ID |
| **Aturan Bisnis** | Cascade update budget spent setelah hapus |

#### FR-TRX-006: Ringkasan Bulanan

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | `month`, `year` |
| **Output** | Total income, total expense, balance, transaction count |

#### FR-TRX-007: Breakdown per Kategori

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | `month`, `year`, `type` (default: EXPENSE) |
| **Output** | Array: `{ categoryId, categoryName, icon, color, total, percentage }` |

#### FR-TRX-008: Tren Harian

| Atribut | Detail |
|---|---|
| **Prioritas** | Sedang |
| **Input** | `month`, `year` |
| **Output** | Array per hari: `{ date, income, expense }` |

#### FR-TRX-009: Transaksi Terbaru

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | `limit` (default: 5) |
| **Output** | Array transaksi terbaru |

#### FR-TRX-010: Export Transaksi

| Atribut | Detail |
|---|---|
| **Prioritas** | Sedang |
| **Input** | `format` (excel/pdf), `period` (monthly/yearly), `month`, `year` |
| **Output** | File binary (XLSX atau PDF) sebagai download |

---

### 3.3 Modul Kategori (CAT)

#### FR-CAT-001: Lihat Semua Kategori

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | `type?` (INCOME/EXPENSE/TRANSFER) |
| **Output** | Kategori default + kategori custom milik user |

#### FR-CAT-002: Buat Kategori Custom

| Atribut | Detail |
|---|---|
| **Input** | `name`, `type`, `icon?`, `color?` |
| **Aturan Bisnis** | Nama kategori harus unik per user. Constraint: `@@unique([name, userId])` |

#### FR-CAT-003: Update Kategori Custom

| Atribut | Detail |
|---|---|
| **Aturan Bisnis** | Hanya kategori custom (bukan default) yang dapat diupdate |

#### FR-CAT-004: Hapus Kategori Custom

| Atribut | Detail |
|---|---|
| **Aturan Bisnis** | Hanya kategori custom yang dapat dihapus. Kategori default tidak bisa dihapus. |

---

### 3.4 Modul Budget (BDG)

#### FR-BDG-001: Buat Budget

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | `amount`, `categoryId`, `period` (WEEKLY/MONTHLY/YEARLY), `startDate`, `endDate`, `alertAt?` (default: 80%) |
| **Proses** | Validasi period → Simpan budget |
| **Aturan Bisnis** | Constraint unik: `@@unique([userId, categoryId, startDate, endDate])` — tidak boleh duplikasi budget untuk kategori dan periode yang sama |

#### FR-BDG-002: Lihat Semua Budget

| Atribut | Detail |
|---|---|
| **Output** | Array budget beserta field `spent` (pengeluaran terkini) |

#### FR-BDG-003: Lihat Budget Aktif

| Atribut | Detail |
|---|---|
| **Proses** | Filter budget yang `startDate <= today <= endDate` |
| **Output** | Array budget aktif dengan progress spending |

#### FR-BDG-004: Ringkasan Budget

| Atribut | Detail |
|---|---|
| **Input** | `date?` (default: hari ini) |
| **Output** | Total budget, total spent, remaining, percentage used |

#### FR-BDG-005: Update Budget

| Atribut | Detail |
|---|---|
| **Input** | `amount?`, `alertAt?` |

#### FR-BDG-006: Hapus Budget

| Atribut | Detail |
|---|---|
| **Aturan Bisnis** | Soft-check: konfirmasi dari frontend sebelum hapus |

---

### 3.5 Modul Laporan (RPT)

#### FR-RPT-001: Laporan Bulanan

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | `month`, `year` |
| **Output** | Object berisi: |

```json
{
  "month": 6,
  "year": 2026,
  "totalIncome": 10000000,
  "totalExpense": 7500000,
  "balance": 2500000,
  "transactionCount": 45,
  "categoryBreakdown": [
    {
      "categoryId": "uuid",
      "name": "Makanan",
      "icon": "🍔",
      "color": "#f59e0b",
      "type": "EXPENSE",
      "total": 2500000,
      "count": 15
    }
  ],
  "dailyTrend": [
    { "date": "2026-06-01", "income": 0, "expense": 150000 }
  ]
}
```

#### FR-RPT-002: Laporan Tahunan

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | `year` |
| **Output** | Object berisi: |

```json
{
  "year": 2026,
  "totalIncome": 120000000,
  "totalExpense": 90000000,
  "balance": 30000000,
  "avgMonthlyIncome": 10000000,
  "avgMonthlyExpense": 7500000,
  "months": [
    { "month": 1, "name": "Jan", "income": 10000000, "expense": 7500000, "balance": 2500000, "count": 45 }
  ],
  "categoryBreakdown": []
}
```

---

### 3.6 Modul Reminder (RMD)

#### FR-RMD-001: Buat Reminder

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | `title`, `description?`, `amount?`, `dueDate`, `isRecurring?`, `frequency?` (DAILY/WEEKLY/MONTHLY/YEARLY), `notifyBefore?` (hari, default: 1) |
| **Proses** | Simpan reminder → Jadwalkan push notification |

#### FR-RMD-002: Lihat Semua Reminder

| Atribut | Detail |
|---|---|
| **Input** | `filter?` (upcoming / overdue / completed) |
| **Output** | Array reminder sesuai filter |

#### FR-RMD-003: Lihat Reminder Upcoming

| Atribut | Detail |
|---|---|
| **Proses** | Filter reminder dengan `dueDate` dalam 7 hari ke depan dan `isCompleted = false` |

#### FR-RMD-004: Lihat Reminder Overdue

| Atribut | Detail |
|---|---|
| **Proses** | Filter reminder dengan `dueDate < today` dan `isCompleted = false` |

#### FR-RMD-005: Update Reminder

| Atribut | Detail |
|---|---|
| **Input** | Field yang diupdate |

#### FR-RMD-006: Tandai Selesai (Mark Complete)

| Atribut | Detail |
|---|---|
| **Proses** | Set `isCompleted = true`. Jika `isRecurring = true`, otomatis buat reminder baru dengan `dueDate` berikutnya berdasarkan `frequency`. |
| **Aturan Bisnis** | Auto-create next occurrence jika recurring |

#### FR-RMD-007: Hapus Reminder

| Atribut | Detail |
|---|---|
| **Aturan Bisnis** | Hard delete |

---

### 3.7 Modul OCR — Scan Struk (OCR)

#### FR-OCR-001: Upload & Proses Struk

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | File gambar (JPEG/PNG/JPG/WebP, maks. 10MB), `description?` |
| **Proses** | Simpan file ke `./uploads/receipts/` → Jalankan Tesseract.js (bahasa: `ind+eng`) → Parse teks OCR → Simpan hasil |
| **Output** | `{ id, result: ParsedReceipt }` |
| **ParsedReceipt** | `{ storeName?, date?, items: [{ name, qty, price }], total?, rawText }` |
| **Error Handling** | Jika OCR gagal, file dihapus & throw BadRequestException |

#### FR-OCR-002: Cek Status OCR

| Atribut | Detail |
|---|---|
| **Input** | Record ID |
| **Output** | `{ id, status, processedAt, fileName }` |

#### FR-OCR-003: Lihat Hasil OCR

| Atribut | Detail |
|---|---|
| **Input** | Record ID |
| **Output** | `{ id, fileName, status, processedAt, result: ParsedReceipt }` |

---

### 3.8 Modul Bank Statement (BST)

#### FR-BST-001: Upload & Parse E-Statement

| Atribut | Detail |
|---|---|
| **Prioritas** | Tinggi |
| **Input** | File PDF (maks. 20MB), `bankName` (PERMATA / JAGO / SEABANK / BCA) |
| **Proses** | Simpan PDF → Deteksi parser berdasarkan bankName → Extract teks → Parse transaksi → Simpan parsed result |
| **Output** | BankStatement object + array parsed transactions |
| **Bank Parsers** | |

| Bank | Parser Class | Pola Parsing |
|---|---|---|
| Bank Permata | `PermataParser` | Pattern matching: tanggal, deskripsi, debit/kredit, saldo |
| Bank Jago | `JagoParser` | Pattern matching: format Jago e-statement |
| SeaBank | `SeabankParser` | Pattern matching: format SeaBank e-statement |
| Bank BCA | `BcaParser` | Pattern matching: DD/MM + Keterangan + Amount + DB/CR |

#### FR-BST-002: Lihat Daftar Upload

| Atribut | Detail |
|---|---|
| **Output** | Array BankStatement dengan status (PENDING/PROCESSING/COMPLETED/FAILED) |

#### FR-BST-003: Lihat Detail Statement

| Atribut | Detail |
|---|---|
| **Input** | Statement ID |
| **Output** | BankStatement object |

#### FR-BST-004: Lihat Parsed Transactions

| Atribut | Detail |
|---|---|
| **Input** | Statement ID |
| **Output** | Array transaksi yang berhasil di-parse dari PDF |

#### FR-BST-005: Import Transaksi Terpilih

| Atribut | Detail |
|---|---|
| **Input** | Statement ID + array transaksi yang dipilih user untuk diimport |
| **Proses** | Buat Transaction records dari parsed data → Link ke BankStatement |
| **Aturan Bisnis** | User dapat memilih transaksi mana yang ingin diimport (tidak harus semua) |

---

### 3.9 Modul Notifikasi Push (NTF)

#### FR-NTF-001: Subscribe Push Notification

| Atribut | Detail |
|---|---|
| **Prioritas** | Sedang |
| **Input** | `endpoint`, `keys.p256dh`, `keys.auth` (Web Push Subscription) |
| **Proses** | Simpan subscription ke database |
| **Output** | `{ success: true }` |

#### FR-NTF-002: Unsubscribe Push Notification

| Atribut | Detail |
|---|---|
| **Input** | `endpoint` |
| **Proses** | Hapus subscription dari database |

#### FR-NTF-003: Kirim Push Notification (Internal)

| Atribut | Detail |
|---|---|
| **Trigger** | Cron job untuk reminder yang `dueDate - notifyBefore <= today` |
| **Proses** | Cari reminder → Kirim push ke semua subscription user → Tampilkan notification di device |
| **Payload** | `{ title, body, url }` |

---

### 3.10 Modul Akun / Wallet (ACC)

#### FR-ACC-001: Buat Akun Wallet

| Atribut | Detail |
|---|---|
| **Input** | `name`, `color?` (default: `#3b82f6`), `startingBalance?` (default: 0) |
| **Aturan Bisnis** | Nama akun unik per user: `@@unique([name, userId])` |

#### FR-ACC-002: Lihat Semua Akun

| Atribut | Detail |
|---|---|
| **Output** | Array akun dengan calculated balance (startingBalance + sum(income) - sum(expense)) |

#### FR-ACC-003: Lihat Detail Akun

| Atribut | Detail |
|---|---|
| **Input** | Account ID |

#### FR-ACC-004: Update Akun

| Atribut | Detail |
|---|---|
| **Input** | `name?`, `color?`, `startingBalance?` |

#### FR-ACC-005: Hapus Akun

| Atribut | Detail |
|---|---|
| **Aturan Bisnis** | Cascade delete semua transaksi terkait (`onDelete: Cascade`) |

---

### 3.11 Modul User Management (USR)

#### FR-USR-001: Lihat Daftar User (Admin Only)

| Atribut | Detail |
|---|---|
| **Prioritas** | Sedang |
| **Input** | Filter: `search?`, `role?`, `page`, `limit` |
| **Output** | Array user + pagination |
| **Otorisasi** | Role = ADMIN |

#### FR-USR-002: Lihat Detail User (Admin Only)

| Atribut | Detail |
|---|---|
| **Input** | User ID |
| **Otorisasi** | Role = ADMIN |

#### FR-USR-003: Update User

| Atribut | Detail |
|---|---|
| **Input** | `name?`, `firstName?`, `lastName?`, `occupation?`, `phoneNumber?`, `monthlyIncome?`, `financialGoal?`, `avatar?` |
| **Otorisasi** | ADMIN bisa update semua user; USER hanya bisa update data sendiri |

#### FR-USR-004: Hapus User (Admin Only)

| Atribut | Detail |
|---|---|
| **Otorisasi** | Role = ADMIN |
| **Aturan Bisnis** | Cascade delete semua data terkait |

---

### 3.12 Modul Admin Panel (ADM)

#### FR-ADM-001: Dashboard Statistik Global

| Atribut | Detail |
|---|---|
| **Prioritas** | Sedang |
| **Otorisasi** | Role = ADMIN |
| **Output** | `{ totalUsers, totalTransactions, totalRevenue, activeUsers, ... }` |

---

### 3.13 Modul PWA (PWA)

#### FR-PWA-001: Installable Web App

| Atribut | Detail |
|---|---|
| **Manifest** | `name: "Zayn Finance"`, `display: "standalone"`, `start_url: "/dashboard"`, `theme_color: "#0ea5e9"` |
| **Icons** | 192x192 (maskable), 512x512 |
| **Categories** | finance, productivity |

#### FR-PWA-002: Service Worker

| Atribut | Detail |
|---|---|
| **Engine** | Serwist (next-pwa replacement) |
| **Strategi Caching** | Precache + runtime caching (defaultCache) |
| **Features** | `skipWaiting: true`, `clientsClaim: true`, `navigationPreload: true` |

#### FR-PWA-003: Offline Support

| Atribut | Detail |
|---|---|
| **Proses** | Service worker meng-cache halaman & assets untuk akses offline |

#### FR-PWA-004: Push Event Handler

| Atribut | Detail |
|---|---|
| **Proses** | Service worker mendengar event `push` → Tampilkan notification → Handle click → Buka URL terkait |

---

## 4. Kebutuhan Non-Fungsional

### 4.1 Keamanan (Security)

| ID | Requirement | Implementasi |
|---|---|---|
| NFR-SEC-001 | Enkripsi password | bcrypt hashing |
| NFR-SEC-002 | Autentikasi JWT | Access token (Bearer) + Refresh token (HttpOnly cookie, 7 hari) |
| NFR-SEC-003 | HTTP Security Headers | Helmet.js middleware |
| NFR-SEC-004 | CORS Policy | Whitelist origin (configurable) |
| NFR-SEC-005 | Rate Limiting | Global: 60 req/min; Auth endpoints: 5-10 req/min |
| NFR-SEC-006 | Input Validation | ValidationPipe (whitelist, forbidNonWhitelisted, transform) |
| NFR-SEC-007 | Role-Based Access Control | Global JwtAuthGuard + RolesGuard |
| NFR-SEC-008 | Cookie Security | Production: `secure: true`, `sameSite: 'none'` |
| NFR-SEC-009 | SQL Injection Prevention | Prisma ORM parameterized queries |

### 4.2 Performa (Performance)

| ID | Requirement | Target |
|---|---|---|
| NFR-PERF-001 | API Response Time | < 500ms untuk operasi CRUD standar |
| NFR-PERF-002 | File Upload | Mendukung hingga 20MB (PDF) dan 10MB (gambar) |
| NFR-PERF-003 | Database Indexing | Index pada kolom yang sering di-query (userId+date, userId+type, userId+categoryId, userId+status, userId+dueDate, userId+isCompleted) |
| NFR-PERF-004 | Pagination | Semua list endpoint mendukung pagination (default: 10 items/page) |
| NFR-PERF-005 | PWA Caching | Assets di-precache oleh Service Worker untuk load time < 2 detik |

### 4.3 Ketersediaan (Availability)

| ID | Requirement |
|---|---|
| NFR-AVL-001 | Database menggunakan Docker container dengan health check (interval 10s, retries 5) |
| NFR-AVL-002 | Redis container dengan health check |
| NFR-AVL-003 | Container restart policy: `unless-stopped` |

### 4.4 Skalabilitas (Scalability)

| ID | Requirement |
|---|---|
| NFR-SCL-001 | Database mendukung presisi keuangan tinggi: `Decimal(15,2)` |
| NFR-SCL-002 | Arsitektur modular (NestJS modules) memungkinkan scaling per modul |
| NFR-SCL-003 | Stateless API server mendukung horizontal scaling |
| NFR-SCL-004 | Redis untuk caching dan task scheduling |

### 4.5 Maintainability

| ID | Requirement | Implementasi |
|---|---|---|
| NFR-MNT-001 | Clean Code | SOLID principles, modular architecture |
| NFR-MNT-002 | Separation of Concerns | Controller → Service → Repository pattern |
| NFR-MNT-003 | Consistent API Response | Global TransformInterceptor |
| NFR-MNT-004 | Request Logging | Global LoggingInterceptor |
| NFR-MNT-005 | Error Handling | Global HttpExceptionFilter + PrismaExceptionFilter |
| NFR-MNT-006 | API Documentation | Swagger auto-generated (http://localhost:3001/api/docs) |
| NFR-MNT-007 | Database Migration | Prisma Migrate for version-controlled schema changes |
| NFR-MNT-008 | Code Formatting | Prettier + EditorConfig |

### 4.6 Usability

| ID | Requirement |
|---|---|
| NFR-USE-001 | Responsive design (mobile-first) menggunakan Tailwind CSS |
| NFR-USE-002 | PWA installable di mobile & desktop |
| NFR-USE-003 | Bahasa Indonesia sebagai bahasa utama antarmuka |
| NFR-USE-004 | Dark mode support |
| NFR-USE-005 | Push notification untuk reminder tagihan |

---

## 5. Antarmuka Eksternal

### 5.1 User Interface (Frontend Pages)

| Route | Halaman | Deskripsi |
|---|---|---|
| `/` | Landing / Redirect | Redirect ke `/dashboard` |
| `/login` | Login | Form email + password, tombol Google sign-in |
| `/register` | Register | Form nama + email + password |
| `/verify-email` | Verifikasi Email | Input OTP 6 digit |
| `/forgot-password` | Lupa Password | Input email untuk reset |
| `/dashboard` | Dashboard | Overview keuangan: saldo, grafik, transaksi terbaru |
| `/transactions` | Transaksi | Daftar transaksi + filter + CRUD |
| `/budgets` | Budget | Daftar budget + progress bar + CRUD |
| `/reminders` | Reminder | Daftar reminder + status + CRUD |
| `/reports` | Laporan | Laporan bulanan & tahunan + chart |
| `/scan/receipt` | Scan Struk | Upload gambar struk → hasil OCR |
| `/settings` | Pengaturan | Profil user, change password, preferences |
| `/admin` | Admin Panel | Statistik global, manajemen user (Admin only) |

### 5.2 Hardware Interface

Tidak ada antarmuka hardware khusus. Kamera device diakses melalui browser API standar (`<input type="file" accept="image/*" capture>`) untuk fitur scan struk.

### 5.3 Software Interface

| Komponen | Interface | Protokol |
|---|---|---|
| Frontend ↔ Backend | REST API | HTTP/HTTPS |
| Backend ↔ PostgreSQL | Prisma Client | TCP (port 5435) |
| Backend ↔ Redis | ioredis | TCP (port 6379) |
| Backend → Google OAuth | Google API | HTTPS |
| Backend → Email Service | SMTP / Email API | SMTP/HTTPS |
| Browser ↔ Push Server | Web Push Protocol | HTTPS (VAPID) |

### 5.4 Communication Interface

- **API Base URL**: `http://localhost:3001/api/v1`
- **Frontend URL**: `http://localhost:3000`
- **Content-Type**: `application/json` (default), `multipart/form-data` (file upload)
- **Authentication**: `Authorization: Bearer <accessToken>` header
- **Refresh Token**: `refresh_token` HttpOnly cookie

---

## 6. Skema Database

### 6.1 Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Transaction : "has many"
    User ||--o{ Category : "has many custom"
    User ||--o{ Budget : "has many"
    User ||--o{ Reminder : "has many"
    User ||--o{ BankStatement : "has many"
    User ||--o{ PushSubscription : "has many"
    User ||--o{ Account : "has many"

    Category ||--o{ Transaction : "categorizes"
    Category ||--o{ Budget : "budgeted"

    Account ||--o{ Transaction : "source account"
    Account ||--o{ Transaction : "destination account"

    BankStatement ||--o{ Transaction : "imported from"
```

### 6.2 Tabel Detail

#### `users`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK, default uuid() | |
| email | String | UNIQUE | |
| password | String | | bcrypt hash |
| name | String | | |
| firstName | String | default "" | |
| lastName | String | default "" | |
| occupation | String? | nullable | |
| phoneNumber | String? | nullable | |
| monthlyIncome | Decimal(15,2)? | nullable | |
| financialGoal | String? | nullable | |
| role | Role (enum) | default USER | ADMIN / USER |
| avatar | String? | nullable | URL avatar |
| isEmailVerified | Boolean | default false | |
| refreshToken | String? | nullable | Hashed refresh token |
| startingBalance | Decimal(15,2) | default 0 | |
| createdAt | DateTime | default now() | |
| updatedAt | DateTime | auto update | |

#### `categories`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK | |
| name | String | unique per userId | |
| icon | String? | | Emoji |
| color | String? | | Hex color |
| type | TransactionType | | INCOME/EXPENSE/TRANSFER |
| isDefault | Boolean | default false | Kategori bawaan sistem |
| userId | String? | FK → users.id | null = default category |
| **Unique** | | `@@unique([name, userId])` | |

#### `transactions`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK | |
| amount | Decimal(15,2) | | |
| type | TransactionType | | INCOME/EXPENSE/TRANSFER |
| description | String? | | |
| note | String? | | |
| date | DateTime | | Tanggal transaksi |
| receipt | String? | | URL/path gambar struk |
| source | TransactionSource | default MANUAL | MANUAL/OCR/BANK_IMPORT |
| categoryId | String | FK → categories.id | |
| userId | String | FK → users.id (CASCADE) | |
| accountId | String? | FK → accounts.id (CASCADE) | Source account |
| destinationAccountId | String? | FK → accounts.id (CASCADE) | Untuk transfer |
| bankStatementId | String? | FK → bank_statements.id | Jika dari import |
| **Index** | | `@@index([userId, date])` | |
| **Index** | | `@@index([userId, type])` | |
| **Index** | | `@@index([userId, categoryId])` | |

#### `budgets`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK | |
| amount | Decimal(15,2) | | Target budget |
| spent | Decimal(15,2) | default 0 | Pengeluaran aktual |
| period | BudgetPeriod | | WEEKLY/MONTHLY/YEARLY |
| startDate | DateTime | | |
| endDate | DateTime | | |
| alertAt | Int | default 80 | Alert threshold (%) |
| categoryId | String | FK → categories.id | |
| userId | String | FK → users.id (CASCADE) | |
| **Unique** | | `@@unique([userId, categoryId, startDate, endDate])` | |
| **Index** | | `@@index([userId, period])` | |

#### `reminders`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK | |
| title | String | | |
| description | String? | | |
| amount | Decimal(15,2)? | | Nominal tagihan |
| dueDate | DateTime | | Tanggal jatuh tempo |
| isRecurring | Boolean | default false | |
| frequency | ReminderFrequency? | | DAILY/WEEKLY/MONTHLY/YEARLY |
| isCompleted | Boolean | default false | |
| notifyBefore | Int | default 1 | Hari sebelum jatuh tempo |
| userId | String | FK → users.id (CASCADE) | |
| **Index** | | `@@index([userId, dueDate])` | |
| **Index** | | `@@index([userId, isCompleted])` | |

#### `bank_statements`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK | |
| fileName | String | | Nama file original |
| filePath | String | | Path di server |
| bankName | BankName | | PERMATA/JAGO/SEABANK/BCA |
| statementDate | DateTime? | | Tanggal statement |
| status | ProcessingStatus | default PENDING | PENDING/PROCESSING/COMPLETED/FAILED |
| errorMessage | String? | | Pesan error / JSON OCR result |
| processedAt | DateTime? | | |
| userId | String | FK → users.id (CASCADE) | |
| **Index** | | `@@index([userId, status])` | |

#### `push_subscriptions`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK | |
| endpoint | String | UNIQUE | Web Push endpoint URL |
| p256dh | String | | Public key |
| auth | String | | Auth secret |
| userId | String | FK → users.id (CASCADE) | |
| **Index** | | `@@index([userId])` | |

#### `accounts`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK | |
| name | String | unique per userId | Nama wallet |
| color | String? | default #3b82f6 | Warna identitas |
| startingBalance | Decimal(15,2) | default 0 | Saldo awal |
| userId | String | FK → users.id (CASCADE) | |
| **Unique** | | `@@unique([name, userId])` | |

#### `otp_verifications`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK | |
| email | String | | |
| code | String | | OTP 6 digit |
| purpose | String | | "REGISTER" / "FORGOT_PASSWORD" |
| expiresAt | DateTime | | Waktu kadaluarsa |
| **Index** | | `@@index([email, code])` | |

### 6.3 Enum Definitions

```
Role:              ADMIN | USER
TransactionType:   INCOME | EXPENSE | TRANSFER
TransactionSource: MANUAL | OCR | BANK_IMPORT
BudgetPeriod:      WEEKLY | MONTHLY | YEARLY
ReminderFrequency: DAILY | WEEKLY | MONTHLY | YEARLY
BankName:          PERMATA | JAGO | SEABANK | BCA
ProcessingStatus:  PENDING | PROCESSING | COMPLETED | FAILED
```

---

## 7. API Specification

**Base URL**: `/api/v1`
**Auth**: Semua endpoint memerlukan `Authorization: Bearer <token>` kecuali yang ditandai 🔓 (Public)

### 7.1 Auth Endpoints

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/auth/register` | Registrasi user baru | 🔓 Public |
| POST | `/auth/login` | Login email + password | 🔓 Public |
| POST | `/auth/google/signin` | Login dengan Google | 🔓 Public |
| POST | `/auth/verify-otp` | Verifikasi OTP | 🔓 Public |
| POST | `/auth/verify-email` | Verifikasi email user login | 🔒 Bearer |
| POST | `/auth/resend-otp` | Kirim ulang OTP | 🔓 Public |
| POST | `/auth/forgot-password` | Request reset password | 🔓 Public |
| POST | `/auth/reset-password` | Reset password dengan OTP | 🔓 Public |
| POST | `/auth/change-password` | Ganti password (logged in) | 🔒 Bearer |
| POST | `/auth/refresh` | Refresh access token | 🔓 Public (RefreshToken Guard) |
| POST | `/auth/logout` | Logout & clear token | 🔒 Bearer |
| GET | `/auth/me` | Get current user profile | 🔒 Bearer |

### 7.2 Transaction Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/transactions` | Buat transaksi baru |
| GET | `/transactions` | Daftar transaksi (filter + pagination) |
| GET | `/transactions/summary` | Ringkasan bulanan |
| GET | `/transactions/category-breakdown` | Breakdown per kategori |
| GET | `/transactions/daily-trend` | Tren harian |
| GET | `/transactions/recent` | Transaksi terbaru |
| GET | `/transactions/export` | Export Excel/PDF |
| GET | `/transactions/:id` | Detail transaksi |
| PATCH | `/transactions/:id` | Update transaksi |
| DELETE | `/transactions/:id` | Hapus transaksi |

### 7.3 Category Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/categories` | Semua kategori (default + custom) |
| GET | `/categories/:id` | Detail kategori |
| POST | `/categories` | Buat kategori custom |
| PATCH | `/categories/:id` | Update kategori |
| DELETE | `/categories/:id` | Hapus kategori |

### 7.4 Budget Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/budgets` | Buat budget baru |
| GET | `/budgets` | Semua budget |
| GET | `/budgets/active` | Budget aktif saat ini |
| GET | `/budgets/summary` | Ringkasan budget |
| GET | `/budgets/:id` | Detail budget |
| PATCH | `/budgets/:id` | Update budget |
| DELETE | `/budgets/:id` | Hapus budget |

### 7.5 Report Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/reports/monthly` | Laporan bulanan |
| GET | `/reports/yearly` | Laporan tahunan |

### 7.6 Reminder Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/reminders` | Buat reminder |
| GET | `/reminders` | Semua reminder (filter) |
| GET | `/reminders/upcoming` | Reminder 7 hari ke depan |
| GET | `/reminders/overdue` | Reminder telat |
| GET | `/reminders/:id` | Detail reminder |
| PATCH | `/reminders/:id` | Update reminder |
| PATCH | `/reminders/:id/complete` | Tandai selesai |
| DELETE | `/reminders/:id` | Hapus reminder |

### 7.7 OCR Endpoints

| Method | Endpoint | Deskripsi | Content-Type |
|---|---|---|---|
| POST | `/ocr/receipt` | Upload & proses struk | multipart/form-data |
| GET | `/ocr/receipt/:id/status` | Status proses OCR | application/json |
| GET | `/ocr/receipt/:id/result` | Hasil OCR | application/json |

### 7.8 Bank Statement Endpoints

| Method | Endpoint | Deskripsi | Content-Type |
|---|---|---|---|
| POST | `/bank-statements/upload` | Upload e-statement PDF | multipart/form-data |
| GET | `/bank-statements` | Daftar upload statement | application/json |
| GET | `/bank-statements/:id` | Detail statement | application/json |
| GET | `/bank-statements/:id/transactions` | Transaksi parsed | application/json |
| POST | `/bank-statements/:id/import` | Import transaksi terpilih | application/json |

### 7.9 Notification Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/notifications/subscribe` | Subscribe push notification |
| DELETE | `/notifications/unsubscribe` | Unsubscribe push notification |

### 7.10 Account Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/accounts` | Buat akun wallet |
| GET | `/accounts` | Semua akun wallet |
| GET | `/accounts/:id` | Detail akun |
| PATCH | `/accounts/:id` | Update akun |
| DELETE | `/accounts/:id` | Hapus akun (cascade) |

### 7.11 User Endpoints

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/users` | Daftar semua user | 🔒 ADMIN |
| GET | `/users/:id` | Detail user | 🔒 ADMIN |
| PATCH | `/users/:id` | Update user | 🔒 ADMIN / Owner |
| DELETE | `/users/:id` | Hapus user | 🔒 ADMIN |

### 7.12 Admin Endpoints

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/admin/stats` | Statistik global sistem | 🔒 ADMIN |

---

## 8. Lampiran

### 8.1 Struktur Folder Backend

```
backend/src/
├── main.ts                          # Bootstrap & konfigurasi global
├── app.module.ts                    # Root module
├── config/                          # Environment configurations
│   ├── app.config.ts
│   ├── jwt.config.ts
│   ├── redis.config.ts
│   ├── mail.config.ts
│   └── storage.config.ts
├── common/                          # Shared utilities
│   ├── constants/                   # Enums & konstanta
│   ├── decorators/                  # @Public, @CurrentUser, @Roles
│   ├── dto/                         # Shared DTOs
│   ├── filters/                     # HttpExceptionFilter, PrismaExceptionFilter
│   ├── guards/                      # JwtAuthGuard, RolesGuard, RefreshTokenGuard
│   ├── interceptors/                # TransformInterceptor, LoggingInterceptor
│   └── interfaces/                  # Shared interfaces
├── prisma/                          # Prisma module & service
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── modules/                         # Feature modules
    ├── auth/                        # Autentikasi & otorisasi
    ├── users/                       # Manajemen user
    ├── categories/                  # Kategori transaksi
    ├── transactions/                # Transaksi keuangan
    ├── budgets/                     # Manajemen budget
    ├── reports/                     # Laporan keuangan
    ├── reminders/                   # Pengingat tagihan
    ├── ocr/                         # Scan struk (Tesseract.js)
    ├── bank-statements/             # Import e-statement bank
    │   └── parsers/                 # Parser per bank
    │       ├── base-statement.parser.ts
    │       ├── parser.factory.ts
    │       ├── bca.parser.ts
    │       ├── permata.parser.ts
    │       ├── jago.parser.ts
    │       └── seabank.parser.ts
    ├── notifications/               # Push notification (Web Push)
    ├── accounts/                    # Wallet management
    └── admin/                       # Admin panel
```

### 8.2 Struktur Folder Frontend

```
frontend/src/
├── app/                             # Next.js App Router
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Landing page (redirect)
│   ├── globals.css                  # Global styles
│   ├── sw.ts                        # Service Worker (Serwist)
│   ├── (auth)/                      # Auth route group
│   │   ├── layout.tsx
│   │   ├── login/
│   │   ├── register/
│   │   ├── verify-email/
│   │   └── forgot-password/
│   └── (dashboard)/                 # Dashboard route group
│       ├── layout.tsx               # Sidebar layout
│       ├── dashboard/
│       ├── transactions/
│       ├── budgets/
│       ├── reminders/
│       ├── reports/
│       ├── scan/receipt/
│       ├── settings/
│       └── admin/
├── components/                      # Reusable components
│   ├── ui/                          # Shadcn UI components
│   ├── layout/                      # Sidebar, Header, etc.
│   ├── admin/                       # Admin-specific components
│   └── pwa/                         # PWA install prompt, etc.
├── hooks/                           # Custom React hooks (TanStack Query)
│   ├── use-transactions.ts
│   ├── use-budgets.ts
│   ├── use-reminders.ts
│   ├── use-accounts.ts
│   ├── use-bank-statements.ts
│   ├── use-ocr.ts
│   ├── use-users.ts
│   ├── use-admin.ts
│   └── use-push-notifications.ts
├── lib/                             # Utilities & API layer
│   ├── api/                         # API client functions
│   │   ├── client.ts                # Axios instance + interceptors
│   │   ├── auth.api.ts
│   │   ├── transactions.api.ts
│   │   ├── budgets.api.ts
│   │   ├── reminders.api.ts
│   │   ├── accounts.api.ts
│   │   ├── bank-statements.api.ts
│   │   ├── ocr.api.ts
│   │   ├── users.api.ts
│   │   ├── admin.api.ts
│   │   └── notifications.api.ts
│   ├── constants/
│   └── utils/
├── providers/                       # Context providers
└── types/                           # TypeScript type definitions
    ├── api.types.ts
    ├── auth.types.ts
    ├── transaction.types.ts
    ├── bank-statement.types.ts
    └── reminder.types.ts
```

### 8.3 Environment Variables

#### Backend (`.env`)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5435/money_management
DIRECT_URL=postgresql://postgres:postgres123@localhost:5435/money_management

# Application
PORT=3001
CORS_ORIGIN=http://localhost:3000

# JWT
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Mail (SMTP)
MAIL_HOST=<smtp-host>
MAIL_PORT=587
MAIL_USER=<email>
MAIL_PASS=<password>
MAIL_FROM=<noreply@domain.com>

# Storage
UPLOAD_DIR=./uploads

# Google OAuth
GOOGLE_CLIENT_ID=<client-id>

# Web Push (VAPID)
VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
VAPID_SUBJECT=mailto:<email>
```

#### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=Money Management
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<vapid-public-key>
```

### 8.4 Global API Response Format

Semua response API di-wrap oleh `TransformInterceptor` dengan format:

**Success Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Validation failed",
  "details": [ ... ]
}
```

### 8.5 Revision History

| Versi | Tanggal | Perubahan | Penulis |
|---|---|---|---|
| 1.0 | 16 Juni 2026 | Dokumen awal — seluruh requirement berdasarkan codebase aktif | AI Assistant |

---

*Dokumen ini di-generate berdasarkan analisis codebase aktif Money Management v2 dan mengikuti standar IEEE 830-1998.*
