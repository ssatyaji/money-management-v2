# Zayn Finance — Workspace Agent Instructions (ECC Integrated)

Sistem instruksi ini menggabungkan pedoman pengembangan Zayn Finance dengan standar performa dan keandalan agen dari **Everything Claude Code (ECC)**.

---

## 1. Prinsip Utama (Core Principles)

1. **Plan Before Execute** — Rancang dan dokumentasikan rencana implementasi sebelum menyentuh atau memodifikasi kode sumber.
2. **Test-Driven Development (TDD)** — Tulis tes sebelum menulis kode implementasi. Pertahankan cakupan pengujian (test coverage) minimal 80%.
3. **Security-First** — Jangan pernah membocorkan kredensial atau mengabaikan validasi input di sistem boundary.
4. **Immutability** — Selalu buat objek baru dan hindari mutasi langsung pada objek state yang ada (khususnya pada state React/Next.js).

---

## 2. Gaya Pengodean (Coding Style)

### KISS, DRY, & YAGNI
* Sederhanakan solusi, hindari generalisasi prematur (KISS).
* Ekstrak logika berulang ke dalam utilitas bersama (DRY).
* Jangan menulis kode atau abstraksi spekulatif sebelum benar-benar dibutuhkan (YAGNI).

### Pengorganisasian File
* **Banyak File Kecil > Sedikit File Besar**: Pecah modul besar menjadi komponen-komponen dengan tanggung jawab tunggal (*single responsibility*).
* Target ukuran file: 200–400 baris, maksimal 800 baris.

### Validasi Input & Penanganan Error
* Validasi seluruh input pengguna di batas sistem (boundary) menggunakan skema validasi (seperti Zod).
* Berikan pesan error yang ramah pengguna di sisi frontend, dan log konteks error yang detail di sisi backend. Jangan pernah membiarkan error ditelan secara senyap.

---

## 3. Panduan Keamanan (Security Guidelines)

Sebelum melakukan commit, pastikan daftar periksa berikut terpenuhi:
- [ ] **Tidak ada rahasia yang bocor**: Tidak ada kunci API, kata sandi, atau token yang ditulis langsung (hardcoded). Gunakan `.env` atau secret manager.
- [ ] **Validasi input**: Semua input eksternal disanitasi untuk mencegah SQL Injection (gunakan parameterized query/Prisma) dan XSS.
- [ ] **Data Bocor**: Pesan kesalahan sistem (error stack traces) tidak boleh bocor ke pengguna akhir di frontend.

---

## 4. Persyaratan Pengujian (Testing Requirements)

Ikuti siklus TDD (Test-Driven Development) berikut:
1. **RED**: Tulis tes yang gagal terlebih dahulu untuk memverifikasi perilaku yang diinginkan.
2. **GREEN**: Tulis implementasi kode seminimal mungkin untuk membuat tes tersebut lulus.
3. **REFACTOR**: Rapikan dan optimalkan kode tanpa merusak pengujian yang ada.

Gunakan pola **AAA (Arrange-Act-Assert)** dalam penulisan tes:
```typescript
test('should calculate overall savings progress correctly', () => {
  // Arrange (Siapkan data & mock)
  const totalTarget = 1000000;
  const totalSaved = 500000;

  // Act (Jalankan fungsi yang diuji)
  const progress = calculateProgress(totalSaved, totalTarget);

  // Assert (Verifikasi hasil)
  expect(progress).toBe(50);
});
```

---

## 5. Pola Arsitektur TypeScript & React (Next.js/NestJS)

### API Response Format
Seluruh respons API harus dibungkus dalam bentuk envelop yang konsisten:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}
```

### Custom Hooks
Gunakan custom hooks untuk memisahkan logika efek samping (side-effects) dari presentasi UI React:
* Nama hook harus diawali dengan kata `use` (contoh: `useDebounce`, `useAccounts`).
