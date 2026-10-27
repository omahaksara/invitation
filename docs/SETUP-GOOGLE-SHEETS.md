# Menyiapkan backend RSVP dan buku tamu Omah Aksara

Backend ini memakai Google Apps Script dan Google Sheets. Lingkungan uji dan produksi harus dibuat sebagai proyek Apps Script terpisah, masing-masing dengan spreadsheet dan Script Properties sendiri.

## 1. Buat proyek Apps Script

1. Buka https://script.google.com/ lalu buat proyek baru.
2. Salin seluruh isi `backend/Code.gs` ke file `Code.gs`.
3. Beri nama yang jelas, misalnya `Omah Aksara API — TEST` atau `Omah Aksara API — PROD`.

Jangan menggunakan satu proyek/database yang sama untuk data uji dan pelanggan.

## 2. Buat database

1. Pilih fungsi `setupDatabase` di editor Apps Script.
2. Tekan **Run/Jalankan** dan selesaikan permintaan izin Google.
3. Buka Execution log untuk melihat URL spreadsheet yang dibuat.
4. Pastikan ada tiga tab: `RSVP`, `Guestbook`, dan `Settings`.

Fungsi setup bersifat idempoten: jika database sudah pernah dibuat, fungsi memakai spreadsheet yang sama. Database RSVP lama tidak dipindahkan atau dihapus.

## 3. Daftarkan slug yang diizinkan

Tab `Settings` adalah allowlist undangan yang boleh menggunakan backend. Masukkan satu baris per slug:

| slug | status |
|---|---|
| uji-omah-aksara | published |

- Gunakan slug folder yang persis sama dengan `clients/<slug>/`.
- `published` mengizinkan RSVP dan buku tamu untuk slug tersebut.
- `draft` atau status lain menolak permintaan.
- Untuk lingkungan uji, gunakan slug uji; jangan daftarkan slug pelanggan produksi.
- Untuk produksi, daftarkan slug pelanggan hanya setelah undangan disetujui untuk publikasi.

Permintaan baca maupun tulis yang slug-nya tidak ada pada allowlist akan ditolak.

## 4. Deploy sebagai Web App

1. Pilih **Deploy → New deployment**.
2. Pilih **Web app**.
3. Atur **Execute as: Me**.
4. Pilih akses yang memungkinkan tamu mengirim data sesuai kebijakan akun dan organisasi.
5. Deploy dan simpan URL yang berakhiran `/exec` di konfigurasi lingkungan yang sesuai.

Setiap lingkungan mempunyai URL deployment sendiri. URL tersebut tidak boleh ditanam sebagai fallback di kode engine.

## 5. Uji endpoint

Buka:

```text
URL_WEB_APP?action=health
```

Respons yang diharapkan mencakup `ok: true`, nama layanan, versi, dan `databaseConfigured: true`.

Lalu uji alur lengkap dengan slug yang sudah didaftarkan pada tab `Settings`:

- Kirim RSVP dengan `action: "rsvp"`, nama uji, status hadir/tidak hadir, dan jumlah tamu.
- Kirim ucapan dengan `action: "guestbook"`, nama uji, dan pesan.
- Pastikan data masuk ke tab yang sesuai.
- Buka `URL_WEB_APP?action=guestbook&slug=uji-omah-aksara` dan pastikan ucapan muncul.
- Uji slug yang tidak terdaftar; backend harus menolak.
- Bersihkan data uji setelah pemeriksaan selesai.

Health check saja tidak membuktikan penulisan data berhasil. RSVP dan buku tamu harus benar-benar diuji sampai barisnya muncul di spreadsheet.

## 6. Hubungkan undangan ke backend yang benar

Pada `clients/<slug>/data.json`, isi:

```json
"integrations": {
  "apiUrl": "URL_WEB_APP_DARI_LINGKUNGAN_YANG_SESUAI"
}
```

Ganti placeholder dengan URL HTTPS deployment yang benar. Jangan pernah memasukkan password, token privat, atau kredensial ke JSON publik.

## Perlindungan data

- Backend memvalidasi slug, aksi, nama, pesan, status kehadiran, dan jumlah tamu.
- Data buku tamu dipisahkan berdasarkan slug dan hanya dikembalikan untuk slug tersebut.
- Allowlist `Settings` mencegah siapa pun menulis ke slug yang belum diaktifkan.
- Endpoint tetap bersifat publik, bukan sistem login. Pembatasan spam dan pemantauan trafik tambahan perlu dipertimbangkan sebelum penggunaan skala besar.
- Jangan menghubungkan produksi sebelum uji browser, isolasi slug, dan penulisan/bacaan data lulus.
