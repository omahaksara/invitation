# Omah Aksara — Starter Mempelai

Folder ini adalah **cetakan konfigurasi**, bukan undangan yang siap dipublikasikan.

## Cara membuat undangan baru

1. Salin folder ini ke `clients/<slug-baru>/`.
2. Ubah `slug` di `data.json` agar sama persis dengan nama folder.
3. Lengkapi nama, orang tua, jadwal, zona waktu, lokasi, cerita, galeri, foto, dan musik. Simpan aset lokal di folder mempelai yang sama dan tulis path relatifnya di JSON.
4. Pilih `theme` yang berstatus `active` di `templates/registry.json`.
5. Atur setiap fitur melalui `features`. Nilai `false` menyembunyikan fitur terkait.
6. Tambahkan metode hadiah ke `gifts.accounts`. Metode mendukung `type: "bank"`, `"ewallet"`, atau `"qris"`; `enabled: false` menyembunyikan metode tertentu. Untuk rekening/destinasi nyata, masukkan hanya setelah dikonfirmasi pemilik undangan.
7. Isi `integrations.apiUrl` hanya dengan endpoint HTTPS yang benar untuk klien tersebut. Jangan gunakan endpoint produksi untuk pengujian.
8. Jalankan `npm test`, lalu periksa undangan di browser dan HP sebelum mengubah `status` menjadi `published`.

## Contoh metode hadiah

```json
{
  "type": "bank",
  "enabled": true,
  "provider": "Bank Contoh",
  "accountNumber": "ISI_SETELAH_DIKONFIRMASI",
  "accountHolder": "Nama Pemilik Rekening",
  "logo": "bank/logo.svg"
}
```

Untuk dompet digital gunakan `type: "ewallet"` dan `phoneNumber`. Untuk QRIS gunakan `type: "qris"` dan `qrCode` yang diberikan pemilik. **Jangan menaruh QR pembayaran asli dalam demo publik.** Gambar QR demo harus berupa simulasi yang tidak dapat dipindai untuk transaksi dan diberi label jelas “DEMO — TIDAK UNTUK TRANSAKSI”.

## Pengamanan sebelum rilis

- Biarkan `status: "draft"` sampai seluruh pemeriksaan lulus.
- Jangan menyalin data rekening, QR, foto privat, atau endpoint dari mempelai lain.
- Demo harus memakai `demoMode: true` dan tidak boleh diarahkan ke API produksi.
- Mematikan fitur lewat JSON tidak menggantikan pemeriksaan bahwa data/layanan pendukungnya tersedia.
