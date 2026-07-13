# Spesifikasi Desain: Optimasi Visual Dashboard Zayn Finance

Dokumen ini menjelaskan rancangan peningkatan visual dan micro-interactions pada dashboard Zayn Finance, mencakup efek radial glow pada kartu, grafik progres setengah lingkaran untuk Saving Goals, dan sparkline mini pada kartu dompet/akun.

---

## Deskripsi Goal

Meningkatkan estetika antarmuka dashboard agar terasa lebih premium, hidup, dan dinamis menggunakan teknik modern Tailwind CSS v4, SVG, dan manipulasi state mouse lokal di React tanpa menginstal pustaka eksternal tambahan.

---

## Rincian Perubahan yang Diusulkan

### 1. Komponen Kartu Pendar Radial (`GlowCard`)
* **Tujuan**: Memberikan efek pendaran cahaya (glow) yang lembut dan mengikuti pergerakan kursor mouse di dalam area kartu.
* **Perilaku**: Efek radial glow ini **hanya aktif/terlihat pada Dark Mode** saja demi menjaga kebersihan tampilan Light Mode.
* **Implementasi**: 
  * Membuat komponen `GlowCard` di `frontend/src/components/ui/glow-card.tsx`.
  * Memanfaatkan event listener `onMouseMove` untuk memperbarui custom CSS variables `--mouse-x` dan `--mouse-y` pada elemen kartu.
  * Menggunakan selector `dark:before:opacity-100` dengan gradien radial yang berpusat pada koordinat tersebut.

### 2. Progres Setengah Lingkaran (`Saving Goals Gauge`)
* **Tujuan**: Mengganti teks persentase linear sederhana pada widget Saving Goals dengan indikator setengah lingkaran (*semi-circular gauge*) yang atraktif.
* **Implementasi**:
  * Menggambar indikator menggunakan elemen `<svg>` dengan elemen `<path>` berbentuk setengah lingkaran (`d="M 10 50 A 40 40 0 0 1 90 50"`).
  * Progres diisi menggunakan properti stroke animatif (`strokeDasharray` & `strokeDashoffset`) berbasis transisi CSS agar tampak memanjang saat halaman dibuka.
  * Warna progres berupa gradien dari warna Indigo (`#6366f1`) ke Emerald (`#10b981`).

### 3. Sparkline Mini Akun Dompet (`Wallet Sparklines`)
* **Tujuan**: Menambahkan visualisasi mini tren historis saldo dompet di bagian bawah masing-masing kartu dompet.
* **Implementasi**:
  * Membuat algoritma penghasil data tren deterministik berbasis saldo awal (`startingBalance`) dan saldo saat ini (`balance`) menggunakan fungsi gelombang sinus yang unik per akun (`id` sebagai seed).
  * Menggambar kurva menggunakan SVG `<path>` dengan isian gradien transparan di bawah garis grafik.
  * Warna garis sparkline beradaptasi secara otomatis dengan warna aksen dompet (`acc.color`).

---

## Verifikasi & Rencana Pengujian

### Pengujian Manual
1. **Verifikasi Mode**:
   * Buka dashboard di Light Mode. Pastikan kartu-kartu bersih dan tidak ada efek pendaran radial.
   * Buka dashboard di Dark Mode. Dekatkan kursor ke kartu-kartu dashboard dan verifikasi bahwa pendaran radial lembut mengikuti kursor mouse dengan lancar.
2. **Animasi Progres**:
   * Muat ulang halaman dashboard. Pastikan grafik setengah lingkaran pada Saving Goals terisi dengan animasi halus dari 0% ke persentase aktual.
3. **Keakuratan Sparkline**:
   * Periksa kartu akun dompet. Pastikan grafik sparkline mini merender tren garis yang mulus dan gradien yang pudar dengan rapi sesuai warna aksen dompet masing-masing.
