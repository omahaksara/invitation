# Omah Aksara V2 — Catatan Pembangunan

Versi baru dikembangkan pada branch `rebuild/omah-aksara-v2`. Branch `main` tidak diubah oleh pekerjaan ini.

## Target
- Mesin undangan berbasis `?c=slug` dan data JSON per pasangan.
- Tema orisinal premium dengan animasi halus, galeri, countdown, hadiah, RSVP, dan buku tamu.
- Satu endpoint Google Apps Script untuk RSVP dan ucapan semua pasangan; pemisahan data wajib berdasarkan slug.
- Katalog publik tetap berada di repo `omahaksara/omahaksara.github.io`.

## Demo
- Slug contoh: `demo-serein`
- Tema baru: `aksara-signature`
- Contoh URL setelah branch dipublikasikan: `https://omahaksara.github.io/invitation/?c=demo-serein&to=Nama%20Tamu`

## Peringatan
1. Demo JSON memakai nama, rekening, tanggal, dan lokasi contoh. Jangan gunakan sebagai data pelanggan.
2. Demo memakai gambar eksternal Unsplash sementara. Sebelum rilis, ganti dengan foto yang berlisensi atau memang milik Omah Aksara. Musik demo mengambil file dari repo katalog; pastikan hak penggunaan musik tersebut sebelum dipakai publik.
3. Integrasi RSVP/buku tamu belum aktif sampai URL Google Apps Script yang sudah dideploy diisi ke `integrations.apiUrl` dan diuji.
4. Jangan gabungkan branch ini ke `main` sebelum pengujian di HP/desktop, uji endpoint, dan pemeriksaan link selesai.
