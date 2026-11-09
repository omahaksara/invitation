# Menyiapkan backend RSVP dan buku tamu Omah Aksara

Backend memakai Google Apps Script dan Google Sheets. Lingkungan TEST dan PROD wajib memakai **proyek Apps Script, spreadsheet, Script Properties, dan URL deployment yang berbeda**.

> **Penting:** kode backend saat ini tidak membuat spreadsheet otomatis dan tidak memakai konstanta `DATABASE_ID`. ID spreadsheet dibaca dari Script Property `OMAH_AKSARA_DATABASE_ID`. Jangan pernah mengisi property proyek TEST dengan ID spreadsheet produksi.

## 1. Buat spreadsheet TEST terlebih dahulu

1. Buat Google Spreadsheet baru khusus pengujian, misalnya `Omah Aksara — TEST`.
2. Buat tab bernama persis `RSVP` dan `Guestbook`.
3. Isi baris pertama dengan header persis seperti berikut.

Tab `RSVP` (10 kolom, urutan wajib):

```text
Timestamp | ID | Slug Klien | Nama Tamu | Jumlah Hadir | Status Kehadiran | Pesan/Doa | Kontak | Sumber | User Agent
```

Tab `Guestbook` (7 kolom, urutan wajib):

```text
Timestamp | ID | Slug Klien | Nama Pengirim | Ucapan | Status Moderasi | Sumber
```

Jangan membuat atau memakai spreadsheet produksi untuk langkah ini.

## 2. Buat proyek Apps Script TEST

1. Buka https://script.google.com/ dan buat proyek baru bernama `Omah Aksara API — TEST`.
2. Salin seluruh isi `backend/Code.gs` dari repositori ke file `Code.gs`.
3. Buka **Project Settings / Setelan project → Script Properties**.
4. Tambahkan property:
   - Property: `OMAH_AKSARA_DATABASE_ID`
   - Value: ID spreadsheet TEST dari URL Google Sheets (bagian di antara `/d/` dan `/edit`).
5. Periksa ulang bahwa nilainya adalah ID spreadsheet TEST, bukan ID database pelanggan/produksi.

**Jangan jalankan `setupDatabase()` sebelum Script Property tersebut diisi dengan ID spreadsheet TEST.** Jika property kosong, backend memang harus gagal tertutup.

## 3. Siapkan tab Settings

1. Setelah Script Property diverifikasi, pilih fungsi `setupDatabase` lalu klik **Run/Jalankan**.
2. Selesaikan permintaan izin Google.
3. Fungsi memeriksa header RSVP dan Guestbook, lalu membuat tab `Settings` jika belum ada.
4. Jika tab Settings baru dibuat, fungsi menambahkan baris awal `demo-katalog | published`. Baris ini **bukan izin untuk menulis dari demo**; backend tetap menolak slug demo.
5. Pada tab `Settings`, pastikan header persis `slug` dan `status`. Hapus baris awal demo bila tidak diperlukan, lalu tambahkan hanya:

| slug | status |
|---|---|
| uji-omah-aksara | published |

Jangan masukkan slug pelanggan produksi ke allowlist TEST. Status selain `published` harus ditolak.

## 4. Deploy sebagai Web App TEST

1. Pilih **Deploy → New deployment**.
2. Pilih **Web app**.
3. Atur **Execute as: Me**.
4. Pilih akses yang memungkinkan browser tamu mengirim data sesuai kebijakan akun Google.
5. Deploy dan simpan URL TEST yang berakhiran `/exec`.

URL deployment TEST harus berbeda dari URL produksi. Jangan mengganti URL API pelanggan di `clients/*/data.json` untuk melakukan tes ini.

## 5. Uji endpoint TEST

Buka URL TEST dengan parameter:

```text
URL_WEB_APP_TEST?action=health
```

Pastikan respons memuat `ok: true`, `databaseConfigured: true`, dan `version: 4` atau lebih tinggi.

Lanjutkan pengujian tulis secara eksplisit dengan slug `uji-omah-aksara`:

- Kirim RSVP dengan `action: "rsvp"`, nama uji, status hadir/tidak hadir, dan jumlah tamu 1–10.
- Pastikan baris baru muncul hanya pada tab RSVP di spreadsheet TEST.
- Kirim ucapan dengan `action: "guestbook"`, nama uji, dan pesan uji.
- Pastikan baris baru muncul pada tab Guestbook TEST.
- Buka `URL_WEB_APP_TEST?action=guestbook&slug=uji-omah-aksara`; pastikan ucapan yang sama dikembalikan.
- Uji slug draft/tidak terdaftar; GET dan POST harus ditolak.
- Pastikan tidak ada baris yang masuk ke spreadsheet produksi.
- Hapus seluruh baris data uji setelah bukti dicatat.

Health check saja tidak membuktikan transaksi tulis. RSVP, guestbook, pembacaan ulang, dan penolakan slug harus benar-benar diuji sampai selesai.

## 6. Hubungkan produksi hanya setelah TEST lulus

Produksi harus mempunyai spreadsheet, proyek Apps Script, Script Property `OMAH_AKSARA_DATABASE_ID`, dan deployment sendiri. Sebelum deployment produksi, verifikasi ulang property database produksi secara terpisah.

Pada konfigurasi klien yang memang akan menggunakan backend produksi, `integrations.apiUrl` harus berisi URL deployment PROD yang benar. Jangan mengganti URL klien produksi dengan URL TEST, dan jangan menaruh password, token privat, atau kredensial pada JSON publik.

## Perlindungan data

- `setupDatabase()` memeriksa header RSVP dan Guestbook; fungsi tidak membuat spreadsheet atau dua tab transaksi tersebut.
- Backend membaca ID database dari Script Property `OMAH_AKSARA_DATABASE_ID`; database yang salah dapat mengarahkan transaksi ke spreadsheet yang salah.
- Allowlist `Settings` dan status klien publikasi membatasi slug yang dapat membaca/menulis.
- Data guestbook difilter berdasarkan slug.
- Endpoint bersifat publik, bukan sistem login. Pembatasan spam dan pemantauan trafik tambahan tetap perlu dipertimbangkan sebelum penggunaan skala besar.
- Jangan menyatakan backend siap produksi sebelum uji TEST end-to-end dan pemeriksaan isolasi data lulus.
