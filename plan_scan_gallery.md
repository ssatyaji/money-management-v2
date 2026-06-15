# Zayn Finance - Pilihan Ambil Foto Struk dari Galeri (Scan Struk)

Rencana ini menjelaskan cara menambahkan dukungan untuk memilih file struk dari galeri foto / file manager selain menggunakan kamera langsung pada fitur Scan Struk.

## Proposed Changes

### Frontend (Next.js)

#### [MODIFY] [page.tsx](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/frontend/src/app/(dashboard)/scan/receipt/page.tsx)
- Menambahkan `galleryInputRef` menggunakan hook `useRef` di dalam component `ScanReceiptTab`.
- Mengganti nama `fileInputRef` menjadi `cameraInputRef` agar lebih deskriptif.
- Memisahkan input `<input type="file" ... />` menjadi dua elemen terpisah:
  1. **Kamera:** Mempertahankan atribut `capture="environment"` untuk membuka kamera secara langsung.
  2. **Galeri:** Menghapus atribut `capture` sehingga browser membuka galeri foto / file chooser bawaan sistem.
- Menghubungkan event handler tombol Shutter ke `cameraInputRef.current?.click()` dan tombol Galeri ke `galleryInputRef.current?.click()`.

---

## Verification Plan

### Manual Verification
1. **Verifikasi Tombol Shutter:**
   - Buka halaman **Scan & Import** di HP/Simulator.
   - Klik tombol lingkaran besar (Shutter).
   - Pastikan aplikasi langsung membuka antarmuka kamera.
   - Ambil foto, pastikan foto tampil di preview dan tombol "Proses OCR" muncul.

2. **Verifikasi Tombol Galeri:**
   - Klik tombol **Galeri** (ikon gambar di kanan bawah finder).
   - Pastikan aplikasi membuka antarmuka pemilihan file/gambar (Galeri/File Manager), bukan langsung kamera.
   - Pilih gambar struk, pastikan gambar tampil di preview dan tombol "Proses OCR" muncul.

3. **Verifikasi Alur OCR:**
   - Setelah memilih gambar dari galeri, klik "Proses OCR".
   - Pastikan proses pemindaian berjalan dan form Review terisi otomatis dengan merchant, total, dll.
   - Klik "Simpan Transaksi" dan pastikan transaksi berhasil tersimpan ke database.
