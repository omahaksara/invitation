# Omah Aksara V2 — Kontrak Arsitektur

## Tujuan

Membangun ulang platform undangan agar siap dipublikasikan, dengan satu mesin, satu sumber data per pasangan, tema yang konsisten, dan pengujian otomatis. Pekerjaan V2 dikerjakan pada branch terpisah; branch `main` tidak menjadi tempat eksperimen.

## Prinsip inti

1. **Satu pasangan = satu folder data.** `clients/<slug>/data.json` menjadi sumber data undangan. Mengganti tema tidak menyalin data atau aset.
2. **Mesin dan presentasi terpisah.** `core/` mengelola pemuatan data, validasi, perilaku bersama, serta integrasi. `templates/<theme>/` mengelola markup dan desain tema.
3. **Kontrak fitur sama untuk semua tema.** Setiap tema harus mendukung cover/pembukaan, identitas pasangan, acara dan countdown, cerita, galeri, lokasi, hadiah, musik, RSVP, buku tamu, dan personalisasi nama tamu. Fitur yang memerlukan layanan eksternal harus menampilkan status yang jelas ketika konfigurasi belum tersedia.
4. **Tema yang dipilih tervalidasi.** Tema dari data dan parameter pratinjau hanya boleh berasal dari daftar tema yang terdaftar. Parameter pratinjau tidak boleh mengubah konfigurasi permanen pasangan.
5. **Backend tunggal.** RSVP dan buku tamu menggunakan kontrak API yang terdokumentasi, validasi input, status sukses/gagal yang jelas, dan perlindungan dasar dari input berbahaya.
6. **Privasi sebagai default.** Data demo harus jelas sebagai dummy. Jangan memasukkan data sensitif yang tidak diperlukan ke repositori publik.
7. **Siap rilis berarti sudah diuji.** Halaman yang berhasil dimuat saja belum cukup. Validasi data, pemeriksaan aset, smoke test tema, pengujian formulir, dan pengujian mobile harus lolos sebelum publikasi.

## Struktur target

```text
/
├── index.html
├── core/
│   ├── app.js
│   ├── global.css
│   └── modules/                 # Tambahkan hanya jika memisahkan modul membantu
├── templates/
│   ├── karsa/
│   ├── royal-vintage/
│   ├── sirein/
│   └── aksara-signature/
├── clients/
│   └── <slug>/
│       ├── data.json
│       └── aset pasangan
├── backend/
│   └── Code.gs
├── scripts/
│   └── validate-invitations.cjs
├── docs/
│   └── ARSITEKTUR-V2.md
└── .github/workflows/
```

## Kontrak data

V2 mengutamakan bentuk data yang konsisten untuk data baru. Saat migrasi, mesin boleh membaca variasi lama yang memang ditemukan di repositori, tetapi variasi tersebut harus dipetakan ke bentuk internal yang konsisten. Jangan melakukan konversi massal sebelum inventarisasi dan pengujian selesai.

- `theme`: salah satu `karsa`, `royal-vintage`, `sirein`, `aksara-signature`.
- `couple.groom` dan `couple.bride`: identitas masing-masing pasangan.
- `events`: satu atau lebih acara.
- `gallery`: daftar foto.
- `gifts`: daftar rekening atau hadiah.
- `media.music` atau `music`: sumber musik, sesuai adaptor kompatibilitas.
- `api.apiUcapan` dan konfigurasi API lain: endpoint backend, bila fitur terkait diaktifkan.

## Strategi pengerjaan

1. Tetapkan kontrak arsitektur dan validasi otomatis.
2. Audit semua data dan aset, lalu buat adaptor kompatibilitas untuk bentuk data yang berbeda.
3. Stabilkan mesin bersama dan integrasi backend.
4. Samakan perilaku dasar empat tema tanpa menghilangkan identitas visualnya.
5. Perbarui demo katalog agar menggunakan tema dan data yang nyata.
6. Jalankan tes otomatis serta tes manual di perangkat mobile/desktop.
7. Publikasikan hanya setelah daftar rilis ditandatangani dan seluruh blocker ditutup.

## Kriteria rilis publik

- Tidak ada JSON rusak, tema tidak dikenal, atau aset lokal hilang.
- Tidak ada error console yang menghalangi penggunaan.
- RSVP dan buku tamu benar-benar diuji dengan backend tujuan.
- Musik dapat diputar/dijeda dan tidak menghalangi aksesibilitas.
- Semua tema memiliki alur pembukaan dan navigasi yang jelas.
- Tautan katalog/demo benar dan setiap demo diberi label yang sesuai.
- Tampilan mobile, keyboard, reduced-motion, dan keadaan loading/error diperiksa.
- Data contoh dan endpoint tidak mengandung kredensial atau informasi pribadi nyata.
- Workflow CI lolos dan hasil preview diperiksa sebelum merge.
