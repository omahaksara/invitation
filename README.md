# Omah Aksara V2 — Mesin Undangan Digital

Repositori ini khusus untuk mesin undangan pernikahan digital Omah Aksara. Mesin menggunakan HTML, CSS, JavaScript, dan JSON statis sehingga tidak memerlukan proses build atau framework berat.

## Arsitektur

- `core/`: engine bersama, validasi runtime, fitur, dan integrasi.
- `templates/`: empat tema resmi: `karsa`, `royal-vintage`, `sirein`, `aksara-signature`.
- `clients/<slug>/data.json`: sumber data undangan.
- `clients/<slug>/`: aset yang dipakai pasangan tersebut.
- `backend/Code.gs`: backend Google Apps Script untuk RSVP dan buku tamu.
- `scripts/`: validasi data dan smoke test statis.
- `docs/`: kontrak arsitektur dan skema data.

Katalog dan halaman pemesanan dikelola terpisah di repositori `omahaksara/omahaksara.github.io`. Jangan menduplikasi mesin undangan ke repo katalog.

## URL undangan

Contoh undangan demo:

```text
https://omahaksara.github.io/invitation/?c=demo-katalog&to=Nama+Tamu
```

Parameter:
- `c`: slug folder di `clients/`.
- `to`: nama tamu opsional, diisi ke cover dan formulir yang mendukung personalisasi.
- `theme`: hanya untuk pratinjau data yang memiliki `demoMode: true`. Parameter ini tidak mengubah tema permanen. Undangan publik memakai `theme` yang tersimpan di `data.json`.

Tema yang diterima engine: `karsa`, `royal-vintage`, `sirein`, `aksara-signature`. Nilai tema tidak dikenal tidak boleh menentukan path file bebas.

## Pengaturan fitur

Properti `features` pada `data.json` memakai nilai boolean. Semua fitur inti aktif secara default jika tidak ditulis. Setel nilai `false` untuk menonaktifkan fitur yang tidak digunakan, misalnya:

```json
{
  "schemaVersion": 2,
  "theme": "karsa",
  "features": {
    "gallery": true,
    "video": false,
    "maps": true,
    "music": true,
    "gifts": true,
    "rsvp": true,
    "guestbook": true,
    "guestName": true
  }
}
```

Jika fitur membutuhkan endpoint yang belum dikonfigurasi, engine harus menjelaskan statusnya dengan jujur. Demo tanpa endpoint memakai mode simulasi yang tidak mengirim atau menyimpan data; undangan produksi tidak boleh mengaku sukses tanpa respons sukses dari backend.

## Menambah undangan

1. Buat folder dengan slug unik di `clients/<slug>/`.
2. Buat `data.json` sesuai kontrak di [docs/DATA-SCHEMA.md](docs/DATA-SCHEMA.md).
3. Simpan foto, musik, dan QR lokal di folder slug yang sama.
4. Pilih salah satu dari empat tema resmi.
5. Jalankan pemeriksaan data dan smoke test.
6. Periksa pratinjau di desktop dan ponsel sebelum mengubah status menjadi `published`.

Jangan menyimpan kata sandi, token privat, atau kredensial backend dalam JSON publik. Gunakan data dummy pada demo katalog.

## Pemeriksaan lokal

Membutuhkan Node.js 20 atau lebih baru. Tidak ada dependensi npm eksternal.

```bash
npm run validate:data
npm run test:smoke
npm test
```

Pemeriksaan ini mencakup struktur JSON, referensi aset lokal, keberadaan empat template, dan pemeriksaan sintaks engine. Ini adalah tes statis; bukan pengganti tes browser, perangkat mobile, atau uji kirim-terima RSVP/buku tamu pada deployment backend nyata.

GitHub Actions menjalankan pemeriksaan yang sama pada push ke branch V2 dan pull request menuju `main`.

## Status rilis

Jangan menganggap sistem siap publik hanya karena tes statis lulus. Sebelum rilis, pastikan:
- seluruh fitur inti punya perilaku konsisten di empat tema;
- tema Royal Vintage, Sirein, Karsa, dan Aksara Signature sudah diperiksa di browser;
- RSVP dan buku tamu teruji pada backend uji yang terpisah dari produksi;
- validasi data, aset, timezone, personalisasi tamu, dan error jaringan lulus;
- endpoint produksi sudah dikonfigurasi dengan aman;
- halaman katalog menunjuk ke demo yang benar.

Lihat [docs/ARSITEKTUR-V2.md](docs/ARSITEKTUR-V2.md), [docs/DATA-SCHEMA.md](docs/DATA-SCHEMA.md), dan [docs/RELEASE-CHECKLIST.md](docs/RELEASE-CHECKLIST.md).
