# 💰 Money Management App - Panduan Developer Baru

Selamat datang di repository Money Management App! Dokumen ini dirancang khusus sebagai acuan (tutorial lengkap) untuk membantu developer atau *junior programmer* yang baru bergabung agar dapat menginstal dan menjalankan aplikasi ini secara lokal di PC/Laptop masing-masing.

## 📌 Prasyarat Instalasi (Prerequisites)

Sebelum mulai mengulik kode, pastikan PC/Laptop Anda sudah dilengkapi dengan *tools* esensial berikut:

1. **Node.js**: Mengingat baik Frontend dan Backend kita menggunakan ekosistem JavaScript/TypeScript, Anda wajib menginstal Node.js versi LTS terbaru (direkomendasikan versi 18+ atau 20+). Unduh dari [nodejs.org](https://nodejs.org/).
2. **Git**: Untuk manajemen versi source code. Unduh dari [git-scm.com](https://git-scm.com/).
3. **Docker Desktop**: Aplikasi kita menggunakan PostgreSQL sebagai database dan Redis. Dengan Docker, Anda **tidak perlu menginstal database secara manual**, cukup jalankan *container*. Unduh dari [docker.com](https://www.docker.com/products/docker-desktop).
4. **Visual Studio Code (VS Code)**: Text editor yang sangat direkomendasikan. Pastikan Anda juga memasang ekstensi: **Prisma**, **ESLint**, dan **Tailwind CSS**.

---

## 🚀 Langkah 1: Menjalankan Database via Docker

Langkah pertama adalah menyalakan database (PostgreSQL & Redis) agar aplikasi Backend memiliki tempat menyimpan data.

1. Buka aplikasi **Docker Desktop** yang sudah Anda instal (pastikan statusnya *Running* di latar belakang).
2. Buka terminal (atau terminal bawaan VS Code) di folder utama (root) project ini (`money-management-v2`).
3. Jalankan perintah sakti berikut:
   ```bash
   docker-compose up -d
   ```
   > **Penjelasan Singkat:** Perintah ini membaca file `docker-compose.yml`. Bendera `-d` berarti *detached* (berjalan di background). Docker akan otomatis mendownload image PostgreSQL & Redis lalu menyalakannya.

*(Tips Tambahan)*: Jika Anda ingin melihat isi database melalui tampilan visual web, jalankan perintah ini alih-alih perintah di atas:
```bash
docker-compose --profile tools up -d
```
Lalu buka browser ke `http://localhost:5050` (Aplikasi pgAdmin). Login dengan Email: `admin@admin.com` & Password: `admin123`.

---

## ⚙️ Langkah 2: Menyiapkan dan Menjalankan Backend (NestJS)

Backend merupakan mesin utama yang mengatur keamanan (auth), logika finansial, dan akses ke database menggunakan *framework* NestJS.

1. Buka terminal baru dan masuk ke folder `backend`:
   ```bash
   cd backend
   ```

2. Unduh semua *library* pendukung:
   ```bash
   npm install
   ```

3. **Atur File Konfigurasi (Environment Variables):**
   - Di dalam folder `backend`, cari file bernama `.env.example`.
   - **Copy / Duplikat** file tersebut dan ganti namanya menjadi `.env`.
   - Buka file `.env`. Beruntungnya, nilai *default* sudah disesuaikan dengan Docker kita. Perhatikan baris ini:
     ```env
     DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/money_management
     REDIS_HOST=localhost
     REDIS_PORT=6379
     PORT=3001
     ```

4. **Sinkronisasi Database (Prisma Migrate):**
   Karena database di Docker Anda masih kosong melompong, jalankan perintah ini agar kode Prisma menyuntikkan skema tabel (seperti Users, Transactions, dll) ke dalam PostgreSQL:
   ```bash
   npx prisma migrate dev
   ```

5. **Nyalakan Server Backend:**
   ```bash
   npm run start:dev
   ```
   > 💡 **Tanda Berhasil:** Jika terminal mencetak pesan berawalan *Nest application successfully started*, berarti backend sudah aktif di **http://localhost:3001**.
   > *Bonus:* Anda bisa melihat dan mengetes seluruh API dokumentasi di **http://localhost:3001/api/docs** (Swagger).

---

## 🎨 Langkah 3: Menyiapkan dan Menjalankan Frontend (Next.js)

Sekarang mari kita nyalakan tampilan antarmukanya (UI) yang dibuat menggunakan Next.js App Router & Tailwind CSS.

1. Buka **tab terminal baru** lagi (Biarkan terminal Backend di Langkah 2 tetap menyala). Masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```

2. Unduh semua *library* UI:
   ```bash
   npm install
   ```

3. **Atur File Konfigurasi Frontend:**
   - Sama seperti di backend, pastikan ada file bernama `.env.local` di dalam folder `frontend`.
   - Pastikan isinya memuat URL menuju API backend seperti ini:
     ```env
     NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
     NEXT_PUBLIC_APP_NAME=Money Management
     NEXT_PUBLIC_APP_URL=http://localhost:3000
     NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGNOH80_kgW05c54_IcEFdiGtabFCxH980YgACVJdSLYHVuRU-KAYL899-gzn59MUI1PDfMXba8HLEr2X33Z2Cw
     ```

4. **Nyalakan Server Frontend:**
   ```bash
   npm run dev
   ```
   > 💡 **Tanda Berhasil:** Tunggu beberapa saat hingga Next.js mencetak keterangan *Ready in xxx ms*.
   > Selanjutnya, buka browser kesayangan Anda dan navigasikan ke alamat **http://localhost:3000**. 

**🎉 BINGO! Aplikasi Money Management sudah berjalan secara utuh di komputer Anda!** Silakan mencoba membuat akun baru (*Register*) dan menjelajahi fitur yang ada.

---

## 🛠 Simulasi Mode Production (Bagi QA / Tester)

Saat Anda hanya mengembangkan kode, gunakan mode `dev` seperti di atas (karena ada fitur *hot-reload* jika kode diubah).
Namun, jika Anda ingin menguji apakah aplikasi sangat cepat dan lolos validasi layaknya berada di *Server Asli* (Production), matikan semua terminal (`Ctrl + C`), lalu jalankan:

**Terminal Backend:**
```bash
cd backend
npm run build
npm run start:prod
```

**Terminal Frontend:**
```bash
cd frontend
npm run build
npm run start
```

---

## 🆘 Troubleshooting Dasar
- **Gagal Start Backend?** Pastikan Docker sudah berjalan dan *port* `5432` tidak dipakai aplikasi PostgreSQL lokal lainnya.
- **Frontend tidak bisa memanggil API Backend?** Periksa kembali alamat `NEXT_PUBLIC_API_URL` di file `.env.local` frontend.
- **Lupa update Database setelah merubah schema?** Jika Anda merubah file `backend/prisma/schema.prisma`, Anda wajib mematikan server sementara dan menjalankan `npx prisma migrate dev` untuk update struktur database.
