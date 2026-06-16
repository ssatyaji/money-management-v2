# Implementasi Google Analytics Menggunakan @next/third-parties

Menambahkan pelacakan Google Analytics ke dalam aplikasi Zayn Finance (frontend) menggunakan library resmi `@next/third-parties/google` untuk memantau aktivitas pengguna dan performa aplikasi secara optimal.

## User Review Required

> [!IMPORTANT]
> **Measurement ID Google Analytics:** Anda perlu menyediakan ID Google Analytics (`G-XXXXXXXXXX`) yang valid pada environment variable `NEXT_PUBLIC_GA_ID` agar pelacakan data berfungsi dengan benar di server staging/produksi.

## Open Questions

> [!NOTE]
> Apakah ada event kustom (custom events) tertentu yang ingin Anda lacak secara khusus sejak awal (misal: pendaftaran akun baru, pencatatan transaksi baru, atau pengunggahan berkas)? Jika ada, kami dapat menambahkan helper fungsi pelacakan event kustom tersebut.

## Proposed Changes

### Frontend Configuration & Dependencies

#### [MODIFY] [package.json](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/frontend/package.json)
- Menambahkan `@next/third-parties` ke dalam daftar dependensi aplikasi.

#### [MODIFY] [.env.local](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/frontend/.env.local)
- Menambahkan variabel `NEXT_PUBLIC_GA_ID` untuk menampung Measurement ID Google Analytics.

---

### Root Layout Integration

#### [MODIFY] [layout.tsx](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/frontend/src/app/layout.tsx)
- Mengimpor komponen `<GoogleAnalytics>` dari `@next/third-parties/google`.
- Memasang komponen `<GoogleAnalytics>` di dalam `RootLayout` ketika variabel lingkungan `NEXT_PUBLIC_GA_ID` didefinisikan.

## Verification Plan

### Automated Tests
- Menjalankan linting (`npm run lint`) di direktori `frontend` untuk memastikan tidak ada kesalahan sintaksis atau impor.
- Menjalankan build lokal (`npm run build`) untuk memverifikasi proses build berjalan tanpa kesalahan.

### Manual Verification
- Menjalankan server development (`npm run dev`) dan memverifikasi di browser bahwa script Google Analytics dimuat dengan benar (dapat diperiksa melalui Google Analytics Debugger Chrome extension atau tab Network di browser developer tools).
- Memastikan tidak ada error hidrasi (hydration error) atau error runtime lainnya di konsol browser.
