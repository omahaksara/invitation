# Menyiapkan Google Apps Script Omah Aksara

Script ini menyiapkan **database baru** bernama **Omah Aksara — Database RSVP & Buku Tamu**. Database lama tidak disentuh atau dipindahkan.

## 1. Buat proyek Apps Script
1. Buka https://script.google.com/ dan buat proyek baru.
2. Buka file `Code.gs`, hapus kode contoh, lalu salin seluruh isi [backend/Code.gs](../backend/Code.gs) dari cabang pengembangan.
3. Simpan proyek dengan nama misalnya **Omah Aksara RSVP API**.

## 2. Buat spreadsheet baru
1. Di dropdown pemilih fungsi, pilih `setupDatabase`.
2. Tekan **Run/Jalankan** dan selesaikan permintaan izin Google.
3. Buka **Execution log/Log eksekusi**. URL spreadsheet baru dicatat di sana.
4. Pastikan spreadsheet berisi dua tab: `RSVP` dan `Guestbook`, dengan header pada baris pertama.

Fungsi setup bersifat idempoten: jika sudah pernah berhasil, pemanggilan berikutnya menggunakan database yang sama, bukan membuat salinan baru.

## 3. Deploy sebagai Web App
1. Tekan **Deploy → New deployment**.
2. Pilih **Web app**.
3. Atur **Execute as: Me**.
4. Pilih akses yang mengizinkan tamu mengirim RSVP/ucapan (biasanya **Anyone**, jika tersedia dan sesuai kebijakan akun).
5. Deploy dan salin URL yang berakhiran `/exec`.

## 4. Uji kesehatan endpoint
Buka URL Web App dengan parameter `?action=health`, misalnya:

```text
URL_WEB_APP/exec?action=health
```

Respons yang diharapkan berupa JSON dengan `"ok": true`, `"service": "Omah Aksara RSVP & Guestbook"`, dan `"databaseConfigured": true`. Ini membuktikan endpoint hidup dan dapat membuka spreadsheet; belum membuktikan penulisan data berhasil.

## 5. Uji tulis dan baca
- Kirim RSVP uji dengan `action: "rsvp"`, slug khusus seperti `uji-omah-aksara`, nama `Tamu Uji`, status `hadir`, jumlah tamu `1`.
- Kirim ucapan uji dengan `action: "guestbook"`, slug yang sama, nama `Tamu Uji`, pesan `Uji koneksi Omah Aksara`.
- Pastikan masing-masing baris benar-benar masuk ke tab yang sesuai.
- Buka `?action=guestbook&slug=uji-omah-aksara` dan pastikan ucapan tadi muncul.
- Uji slug lain dan pastikan ucapan uji tidak muncul.
- Hapus baris uji setelah semua pemeriksaan selesai, bila diinginkan.

Jangan menandai koneksi aktif hanya karena URL terbuka. Pengujian kirim dan baca harus benar-benar berhasil dari undangan atau permintaan HTTP yang sesuai.

## 6. Hubungkan ke undangan
Pada `clients/<slug>/data.json`, tambahkan URL deployment yang nyata:

```json
"integrations": {
  "apiUrl": "TEMPEL_URL_WEB_APP_YANG_BERAKHIRAN_EXEC"
}
```

Klien lama dengan `api.apiUcapan` tetap didukung. Jangan memasukkan password atau rahasia akun ke repo.

## Perlindungan data
- Database ini terpisah dari RSVP lama. Jangan menghapus atau memindahkan data lama tanpa backup dan persetujuan.
- Endpoint bersifat publik, bukan sistem login. Validasi dasar dan pemisahan berdasarkan slug tersedia; proteksi spam lanjutan masih perlu dipertimbangkan sebelum trafik besar.
- Jangan sambungkan URL ke undangan pelanggan sebelum tes HP/desktop, RSVP, buku tamu, dan isolasi slug berhasil.
