# Omah Aksara V2 — Mesin Undangan Digital

Repository ini khusus untuk mesin undangan digital Omah Aksara. Mesin menggunakan HTML, CSS, JavaScript, dan JSON; tidak memerlukan framework atau proses build berat.

## Pembagian repository

- `omahaksara/invitation`: engine, lima tema, data undangan, aset, backend, dan pengujian.
- `omahaksara/omahaksara.github.io`: katalog tema, demo pelanggan, informasi paket, dan tautan pemesanan.

Jangan menduplikasi engine atau backend ke repository katalog.

## Lima tema resmi

- `karsa`
- `royal-vintage`
- `sirein`
- `aksara-signature`
- `botanical-garden`
- `velvet-romance`
- `romantic-floral`

Logika fitur berada di `core/app.js`; tema mengatur presentasi. Semua tema harus menyediakan kontrak fitur yang sama. Jika suatu tema belum memiliki bagian visual tertentu, engine dapat menyediakan bagian bersama bila datanya tersedia.

## URL demo

```text
https://omahaksara.github.io/invitation/?c=demo-katalog&theme=karsa&to=Nama+Tamu
```

- `c`: slug folder undangan di `clients/`.
- `to`: nama tamu opsional.
- `theme`: hanya berlaku untuk data dengan `demoMode: true`; hanya untuk pratinjau dan tidak mengubah tema tersimpan.

Undangan pelanggan publik memakai tema dari `data.json`. Nilai tema dibatasi ke daftar resmi.

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

GitHub Actions memeriksa sintaks JavaScript, data V2, empat template, binding pasangan, musik, nama tamu, dan alur pembukaan. Tes otomatis tetap harus dilengkapi uji RSVP/buku tamu end-to-end pada deployment backend uji dan pemeriksaan visual di ponsel/desktop.

## Data lama

Data lama tidak dianggap otomatis sebagai skema V2. Validator memberi peringatan untuk data yang belum memakai `schemaVersion: 2`; migrasikan hanya setelah mapping dan asetnya diperiksa. Jangan menghapus data pasangan atau aset yang masih dipakai tanpa audit referensi.

## Gerbang rilis

Gunakan [docs/RELEASE-CHECKLIST.md](docs/RELEASE-CHECKLIST.md). Jangan merge ke `main` atau menganggap produksi siap hanya karena pemeriksaan statis lulus.
