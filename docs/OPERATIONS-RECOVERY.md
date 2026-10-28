# Operasional, Backup, dan Pemulihan Omah Aksara

Dokumen ini adalah panduan pemulihan praktis untuk pengelola. Ini bukan pengganti arsip source code, salinan Google Sheets, atau backup Apps Script.

## Peta sistem

- `omahaksara/invitation`: engine, tema, data/aset klien, backend Apps Script, dokumentasi, dan pengujian.
- `omahaksara/omahaksara.github.io`: katalog publik, demo/konten katalog, serta router URL pendek `404.html`.
- `core/app.js`: engine undangan bersama.
- `templates/registry.json`: satu-satunya daftar resmi tema aktif.
- `clients/<slug>/data.json`: data undangan per slug.
- `backend/Code.gs`: API RSVP dan buku tamu.
- `docs/DATA-SCHEMA.md`: kontrak data V2.
- `docs/RELEASE-CHECKLIST.md`: gerbang rilis.

## Aturan tema dan publikasi

1. Tema default berada di `clients/<slug>/data.json` pada properti `theme`.
2. Tema override pada URL klien `published` hanya boleh dipakai bila slug tema valid dan tercatat berstatus `active` di `templates/registry.json`.
3. Jika registry gagal dimuat atau tema tidak valid, gunakan tema konfigurasi klien.
4. Alias `royal` dinormalisasi menjadi `royal-vintage`.
5. Router URL pendek di repositori katalog harus menolak slug yang tidak valid, tidak published, atau `demoMode: true`.
6. Jangan mengubah data default klien hanya untuk membuat tautan pratinjau tema.

## Backup minimum

Lakukan sebelum perubahan besar dan setelah rilis:

- Unduh ZIP dari kedua repositori, catat tanggal dan commit SHA.
- Simpan arsip kode Apps Script secara terpisah.
- Buat salinan Google Sheets atau ekspor sesuai kebutuhan; batasi akses karena mungkin berisi data tamu.
- Pastikan aset foto, musik, QR, dan aset klien ikut masuk arsip.
- Simpan daftar endpoint dan pengaturan deployment di tempat privat yang aman; jangan menaruh token, kata sandi, atau kredensial di repo publik.
- Simpan setidaknya dua salinan di lokasi berbeda dan uji ZIP dapat dibuka.

## Perintah pemeriksaan lokal

Memerlukan Node.js 20 atau lebih baru. Jalankan dari root repo `omahaksara/invitation`:

```bash
npm run test:static
npm run test:backend
```

Smoke test browser:

```bash
npm install --no-save playwright
npx playwright install chromium
python3 -m http.server 4173 --bind 127.0.0.1
```

Di terminal lain pada root repo:

```bash
node scripts/smoke-templates.cjs
```

Smoke test produksi `node scripts/smoke-production.cjs` bersifat read-only untuk form produksi, tetapi tetap melakukan GET ke backend buku tamu. Jalankan hanya saat sadar bahwa GET backend mungkin auto-register slug published ke tab Settings jika slug belum ada.

## Urutan diagnosis

### Satu undangan rusak
- Catat URL, slug, tema, perangkat, waktu, dan error console.
- Validasi `clients/<slug>/data.json`, status, tema, slug, serta semua aset relatif.
- Hilangkan parameter `theme` untuk mencoba tema default.
- Periksa `templates/<theme>/index.html`.

### Semua undangan rusak
- Periksa perubahan terbaru pada `index.html`, `core/app.js`, dan `core/global.css`.
- Periksa versi cache `?v=` pada script/CSS dan versi `_v` yang digunakan engine.
- Jalankan tes statis dan smoke test seluruh tema.
- Jika commit terakhir penyebabnya, lakukan revert melalui branch dan pull request setelah memeriksa diff.

### Hanya URL pendek yang rusak
- Periksa `404.html` di repo katalog.
- Pastikan GitHub Pages memakai branch/folder yang benar dan file `404.html` sudah terpublikasi.
- Uji slug published, tema active, dan nama tamu dengan URL pendek serta URL query biasa.

### RSVP atau buku tamu rusak
- Periksa deployment Apps Script, izin, URL API di JSON, nama tab/header spreadsheet, serta slug pada tab `Settings`.
- Jangan membuat ulang database sebelum memastikan spreadsheet dan backup yang benar.
- Uji pada lingkungan uji terlebih dahulu. Jangan mengirim data uji ke klien nyata.

## Gerbang rilis wajib

Sebelum menganggap rilis aman:

- [ ] Pemeriksaan sintaks dan validasi data lulus.
- [ ] Semua tema active punya file `index.html`.
- [ ] Smoke test browser seluruh tema lulus.
- [ ] URL katalog, URL undangan biasa, dan URL pendek diuji di browser nyata.
- [ ] Tema override valid bekerja; tema tidak aktif/acak kembali ke tema default.
- [ ] RSVP dan buku tamu diuji end-to-end pada backend uji.
- [ ] Tidak ada overflow mobile, JavaScript error, atau aset hilang.
- [ ] Backup repo, Apps Script, Sheets, dan aset dibuat sebelum rilis.

## Link penting

- Engine: https://github.com/omahaksara/invitation
- Katalog: https://github.com/omahaksara/omahaksara.github.io
- Skema data: https://github.com/omahaksara/invitation/blob/main/docs/DATA-SCHEMA.md
- Checklist rilis: https://github.com/omahaksara/invitation/blob/main/docs/RELEASE-CHECKLIST.md
- Registry tema: https://github.com/omahaksara/invitation/blob/main/templates/registry.json

> Status live tidak boleh disimpulkan hanya dari file yang ada di GitHub. Pastikan deployment dan alur browser benar-benar diuji sebelum menyatakan bebas error.
