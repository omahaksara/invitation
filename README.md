# Omah Aksara V2 — Mesin Undangan Digital

Repository ini khusus untuk mesin undangan digital Omah Aksara. Mesin menggunakan HTML, CSS, JavaScript, dan JSON; tidak memerlukan framework atau proses build berat.

## Pembagian repository

- `omahaksara/invitation`: engine, seluruh tema aktif, data undangan, aset, backend, dan pengujian.
- `omahaksara/omahaksara.github.io`: katalog tema, demo pelanggan, informasi paket, dan tautan pemesanan.

Jangan menduplikasi engine atau backend ke repository katalog.

## Daftar tema resmi

Daftar tema aktif disimpan di [`templates/registry.json`](templates/registry.json). Katalog, validator data, dan pengujian harus membaca daftar yang sama. Saat menambah tema, tambahkan folder `templates/<slug>/index.html` lalu daftarkan satu kali di registry.

Logika fitur berada di `core/app.js`; tema mengatur presentasi. Semua tema harus menyediakan kontrak fitur yang sama. Jika suatu tema belum memiliki bagian visual tertentu, engine dapat menyediakan bagian bersama bila datanya tersedia.

## Standar penambahan tema baru

Tema baru harus berbeda secara visual, tetapi tetap memakai kontrak fitur engine yang sama. Jangan menyalin satu tema lalu hanya mengganti warna dan nama.

### Alur kerja tema
1. Tentukan konsep visual terlebih dahulu: target suasana, palet warna, pasangan font, pola layout, bentuk ornamen, gaya galeri, cover, dan animasi. Catat pembeda tema agar tidak menjadi variasi kosmetik dari tema yang sudah ada.
2. Buat `templates/<slug>/index.html`. Gunakan HTML/CSS tema untuk presentasi; jangan menanam ulang logika RSVP, buku tamu, data pasangan, atau pemilihan tema yang sudah menjadi tugas `core/app.js`.
3. Pertahankan binding dan selector kontrak yang dipakai engine serta smoke test. Jika struktur DOM memang berbeda, tambahkan kontrak tema secara eksplisit di `scripts/smoke-templates.cjs`.
4. Daftarkan tema satu kali di `templates/registry.json` dengan slug unik dan status yang benar. Jangan mengaktifkan tema sebelum aset, data, dan tesnya siap.
5. Uji tema pada data demo dan sekurangnya viewport ponsel 390px serta desktop. Pastikan tidak ada horizontal overflow, teks terpotong, tombol tertutup, atau section kosong ketika fitur dimatikan.
6. Jalankan `npm run test:static` dan seluruh smoke test Chromium sebelum meminta review. Periksa juga keyboard, kontras, reduced motion, status formulir, gambar gagal dimuat, dan jaringan lambat secara manual.

### Batas performa dan anti-lag
- Utamakan HTML/CSS/JavaScript biasa; jangan menambah framework atau pustaka besar hanya untuk efek dekoratif.
- Gunakan aset lokal yang dioptimalkan dan ukuran gambar yang wajar. Hindari gambar latar raksasa, video autoplay, GIF berat, serta permintaan font atau library eksternal yang tidak perlu.
- Animasi hanya untuk properti ringan seperti `transform` dan `opacity`; hindari animasi terus-menerus, layout thrashing, dan listener scroll yang berat.
- Hormati `prefers-reduced-motion`; konten inti harus tetap terbaca tanpa animasi.
- Jangan membuat fetch duplikat untuk data atau tema, jangan menambahkan polling tanpa kebutuhan, dan jangan memblokir interaksi utama saat efek dekoratif dimuat.
- Jaga konsol bersih dari error, cek gambar/font gagal dimuat, dan ukur hasil pada ponsel kelas menengah—bukan hanya desktop pengembang.
- Jangan menurunkan standar tema lain untuk meloloskan tes tema baru. Perbaiki akar masalah bersama bila regresi menyentuh engine.

### Gerbang aktivasi tema
Tema baru berstatus belum aktif sampai: kontrak fitur lengkap, aset demo aman, seluruh smoke test lulus, pemeriksaan ponsel/desktop selesai, dan review visual dilakukan. Setelah siap, ubah status registry menjadi `active`. Tema yang gagal atau belum lengkap tetap nonaktif agar tidak muncul di katalog maupun dipilih sebagai tema undangan.

## URL demo

```text
https://omahaksara.github.io/invitation/?c=demo-katalog&theme=karsa&to=Nama+Tamu
```

- `c`: slug folder undangan di `clients/`.
- `to`: nama tamu opsional.
- `theme`: hanya berlaku untuk data dengan `demoMode: true`; hanya untuk pratinjau dan tidak mengubah tema tersimpan. Tema yang diminta harus berstatus `active` di registry resmi.

Undangan pelanggan publik memakai tema dari `data.json`. Engine dan smoke test membaca `templates/registry.json` sebagai daftar tema aktif tunggal. Setiap tema aktif wajib memiliki kontrak smoke test; tema baru yang belum memiliki kontrak akan menggagalkan pemeriksaan.

## Data dan fitur

Setiap undangan memakai `clients/<slug>/data.json`. Data baru harus menyertakan `schemaVersion: 2`. Properti `features` dapat mematikan fitur tertentu dengan `false`; jika properti fitur tidak ada, fitur inti aktif secara default.

Endpoint RSVP dan buku tamu harus ditulis secara eksplisit pada konfigurasi integrasi. Tidak ada fallback URL produksi yang boleh ditanam dalam kode. Mode demo hanya simulasi: formulir bisa dicoba, tetapi RSVP tidak dikirim ke database dan ucapan hanya tampil di halaman demo. Backend menolak slug yang tidak terdaftar sebagai `published` pada tab `Settings` spreadsheet.

Lihat [docs/DATA-SCHEMA.md](docs/DATA-SCHEMA.md) untuk format data dan adaptor migrasi.

## Menjalankan pemeriksaan

Node.js 20 atau lebih baru dibutuhkan untuk tes statis. Smoke test browser memakai Playwright dan Chromium.

```bash
npm run test:static
```

Untuk tes browser lokal, jalankan server statis di port 4173, pastikan Playwright/Chromium terpasang, lalu jalankan:

```bash
node scripts/smoke-templates.cjs
```

GitHub Actions memeriksa sintaks JavaScript, data V2, seluruh tema aktif pada registry, binding pasangan, musik, nama tamu, dan alur pembukaan. Tes otomatis tetap harus dilengkapi uji RSVP/buku tamu end-to-end pada deployment backend uji dan pemeriksaan visual di ponsel/desktop.

## Data lama

Data lama tidak dianggap otomatis sebagai skema V2. Validator memberi peringatan untuk data yang belum memakai `schemaVersion: 2`; migrasikan hanya setelah mapping dan asetnya diperiksa. Jangan menghapus data pasangan atau aset yang masih dipakai tanpa audit referensi.

## Gerbang rilis

Gunakan [docs/RELEASE-CHECKLIST.md](docs/RELEASE-CHECKLIST.md). Jangan merge ke `main` atau menganggap produksi siap hanya karena pemeriksaan statis lulus.
