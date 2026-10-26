# Menyambungkan RSVP dan buku tamu ke satu Google Sheet

## 1. Pilih spreadsheet dengan aman
1. Jika data RSVP/ucapan sudah tersimpan di spreadsheet lama, **jangan buat spreadsheet baru atau mengubah header sebelum mencadangkan dan memeriksa skema data lama**. Migrasi data lama belum otomatis.
2. Jika belum ada database, buat satu Google Spreadsheet khusus Omah Aksara, misalnya **Database Undangan Omah Aksara**.
3. Buka menu **Ekstensi → Apps Script** pada spreadsheet yang memang akan digunakan.
3. Ganti kode awal dengan seluruh isi file `backend/Code.gs` dari repo ini.
4. Simpan proyek.

Sheet `RSVP` dan `Guestbook` akan dibuat otomatis saat permintaan pertama diterima.

## 2. Deploy sebagai Web App
1. Tekan **Deploy → New deployment**.
2. Pilih jenis **Web app**.
3. Atur **Execute as: Me**.
4. Atur akses agar pengunjung undangan dapat mengirim jawaban (biasanya **Anyone**). Pastikan pengaturan ini sesuai dengan kebijakan akun Google kamu.
5. Deploy dan salin URL Web App yang berakhiran `/exec`.

Jangan memasukkan password, token, atau rahasia akun ke repo publik.

## 3. Hubungkan URL ke undangan
Buka `clients/<slug>/data.json`, lalu isi:
```json
"integrations": {
  "apiUrl": "URL_WEB_APP_APPS_SCRIPT/exec"
}
```
Gunakan URL deployment yang sebenarnya, bukan URL contoh di atas. Semua pasangan dapat memakai endpoint yang sama karena setiap kiriman menyertakan `slug`. Endpoint belum dianggap aktif sampai uji `doGet`, RSVP, dan buku tamu berhasil dari undangan. Data klien lama yang memakai `api.apiUcapan` tetap didukung oleh mesin.

## 4. Bentuk data
- `RSVP`: waktu, slug, nama tamu, status hadir, jumlah tamu.
- `Guestbook`: waktu, slug, nama tamu, ucapan.

Endpoint buku tamu hanya mengembalikan baris dengan slug yang diminta. Teks dari tamu ditampilkan sebagai teks biasa, bukan HTML.

## 5. Pengujian wajib sebelum digunakan
1. Kirim satu RSVP dari demo dan pastikan baris masuk ke `RSVP`.
2. Kirim satu ucapan dan pastikan baris masuk ke `Guestbook`.
3. Buka undangan dengan slug lain dan pastikan ucapan demo pertama tidak ikut tampil.
4. Uji akses dari HP dan browser berbeda.
5. Jika browser menampilkan error CORS atau respons tidak dapat dibaca, jangan anggap data berhasil dikirim. Perlu penyesuaian metode koneksi dan pengujian deployment sebelum digunakan pelanggan.

## Batasan keamanan
Endpoint ini publik dan bukan sistem login. Validasi input serta pemisahan slug sudah diterapkan sebagai dasar, tetapi pembatasan spam lanjutan (misalnya CAPTCHA/rate limit) perlu ditambahkan sebelum trafik besar. Jangan simpan informasi sensitif selain yang diperlukan.
