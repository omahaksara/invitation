# Omah Aksara V2 — Mesin Undangan Digital

Repositori ini khusus untuk mesin undangan digital Omah Aksara. Mesin menggunakan HTML, CSS, JavaScript, dan JSON; tidak memerlukan framework atau proses build berat.

## Pembagian repository

- `omahaksara/invitation`: engine, seluruh tema aktif, data undangan, aset, backend, dokumentasi, dan pengujian.
- `omahaksara/omahaksara.github.io`: katalog tema, demo pelanggan, informasi paket, dan tautan pemesanan.

Jangan menduplikasi engine atau backend ke repository katalog.

## Daftar tema resmi

Daftar tema aktif disimpan di [`templates/registry.json`](templates/registry.json). Katalog, validator data, dan pengujian harus membaca daftar yang sama. Saat menambah tema, tambahkan folder `templates/<slug>/index.html` lalu daftarkan satu kali di registry.

Logika fitur berada di `core/app.js`; tema mengatur presentasi. Semua tema harus menyediakan kontrak fitur yang sama. Jika suatu tema belum memiliki bagian visual tertentu, engine dapat menyediakan bagian bersama bila datanya tersedia.

## URL undangan dan demo

Contoh URL undangan biasa:

```text
https://omahaksara.github.io/invitation/?c=budi-ani&to=Nama+Tamu
```

Contoh URL demo katalog:

```text
https://omahaksara.github.io/invitation/?c=demo-katalog&theme=karsa&to=Nama+Tamu
```

- `c`: slug folder undangan di `clients/`.
- `to`: nama tamu opsional.
- `theme`: tema override opsional. Untuk demo dengan `demoMode: true`, tema pratinjau dapat dipilih melalui URL. Untuk klien `published`, tema override hanya diterima jika slug valid dan tema berstatus `active` pada registry.
- Tema default klien tetap disimpan di `data.json`; override URL tidak mengubah data tersebut.
- Jika registry tidak dapat dimuat atau tema yang diminta tidak aktif, engine menggunakan tema yang dikonfigurasi klien.
- Alias `royal` dinormalisasi menjadi `royal-vintage`.

Router URL pendek berada di repositori katalog pada `404.html`. Router harus menolak slug yang tidak valid, tidak berstatus `published`, atau `demoMode: true`.

## Data dan fitur

Setiap undangan memakai `clients/<slug>/data.json`. Data baru harus menyertakan `schemaVersion: 2`. Properti `features` dapat mematikan fitur tertentu dengan `false`; jika properti fitur tidak ada, fitur inti aktif secara default.

Endpoint RSVP dan buku tamu harus ditulis secara eksplisit pada konfigurasi integrasi. Tidak ada fallback URL produksi yang boleh ditanam dalam kode. Mode demo hanya simulasi: formulir bisa dicoba, tetapi RSVP tidak dikirim ke database produksi dan ucapan hanya tampil di halaman demo. Backend menolak slug demo serta memeriksa status slug klien pada tab `Settings` spreadsheet.

Lihat [`docs/DATA-SCHEMA.md`](docs/DATA-SCHEMA.md) untuk format data dan adaptor migrasi, serta [`docs/OPERATIONS-RECOVERY.md`](docs/OPERATIONS-RECOVERY.md) untuk backup, diagnosis, dan pemulihan.

## Menjalankan pemeriksaan

Node.js 20 atau lebih baru dibutuhkan untuk tes statis.

```bash
npm run test:static
npm run test:backend
```

Untuk tes browser lokal, jalankan server statis di port 4173, pastikan Playwright/Chromium terpasang, lalu jalankan:

```bash
node scripts/smoke-templates.cjs
```

GitHub Actions memeriksa sintaks JavaScript, data V2, seluruh tema aktif pada registry, binding pasangan, musik, nama tamu, dan alur pembukaan. Tes otomatis tetap harus dilengkapi uji RSVP/buku tamu end-to-end pada deployment backend uji dan pemeriksaan visual di ponsel/desktop.

Smoke test produksi `node scripts/smoke-production.cjs` menggunakan browser untuk membaca katalog, undangan, dan buku tamu. Jangan menjalankannya sembarangan: permintaan GET buku tamu dapat mendaftarkan slug published yang belum tercatat pada tab `Settings`. Script ini tidak mengirim formulir RSVP atau buku tamu.

## Data lama

Data lama tidak dianggap otomatis sebagai skema V2. Validator memberi peringatan untuk data yang belum memakai `schemaVersion: 2`; migrasikan hanya setelah mapping dan asetnya diperiksa. Jangan menghapus data pasangan atau aset yang masih dipakai tanpa audit referensi.

## Gerbang rilis

Gunakan [`docs/RELEASE-CHECKLIST.md`](docs/RELEASE-CHECKLIST.md). Baca juga [`docs/OPERATIONS-RECOVERY.md`](docs/OPERATIONS-RECOVERY.md). Jangan merge ke `main` atau menganggap produksi siap hanya karena pemeriksaan statis lulus; uji browser, URL live, dan backend perlu bukti hasilnya.
