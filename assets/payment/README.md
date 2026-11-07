# Logo pembayaran lokal Omah Aksara

Semua logo dipakai dari aset lokal. Sumber logo:
- BCA: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bank_Central_Asia.svg)
- BRI 2025: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:BRI_2025.svg), logo sejak 16 Oktober 2025
- BNI: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bank_Negara_Indonesia_logo_(2004).svg)
- Mandiri: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bank_Mandiri_logo_2016.svg)
- BSI: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bank_Syariah_Indonesia.svg)
- CIMB Niaga: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:CIMB_Niaga_logo.svg)
- Permata Bank: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Permata_Bank_(2024).svg)
- Danamon: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Danamon_(2024).svg)
- Bank Jatim: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bank-Jatim-Logo.svg), CC0 1.0
- BTN: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:BTN_2024.svg), logo versi 2024.
- Bank Jakarta: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bank_Jakarta.svg).
- Bank Sulteng: [situs resmi Bank Sulteng](https://mail.banksulteng.co.id/tentang-kami/logo)
- Bank Nagari: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bank_Nagari.svg), CC0 1.0, pencipta Muhammad Ricky Nur Fahri.
- Bank SulutGo (BSG): [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Logo_Bank_BSG.png), CC BY-SA 4.0, pencipta Fiqhi Rizky.
- Bank NTT: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Logo_Bank_NTT.png), PD-textlogo.
- GoPay: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:GoPay_logo.svg), media kit GoPay, logo 2025
- DANA: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Dana_logo.png), CC0 1.0 (logo 2018).
- OVO: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Logo_ovo_purple.svg), CC BY-SA 4.0 (logo 2020; atribusi dan share-alike wajib).
- LinkAja: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:LinkAja.svg)
- QRIS: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:QRIS_logo.svg), Bank Indonesia. Bukan QR transaksi.

ShopeePay masih memakai aset lokal yang perlu diganti dengan unduhan resmi dari brand kit ShopeePay sebelum materi promosi komersial final. Merek tetap milik pemilik masing-masing. Jangan gunakan nomor rekening/QR simulasi untuk transaksi.


## Katalog demo dan aset pilihan

- `banks/`: logo utama untuk rekening bank yang paling sering dipakai, termasuk BCA, BRI (versi 2025), BNI, Mandiri, BSI, CIMB Niaga, Permata, Danamon, BTN, Bank Jatim, Bank Jakarta, dan Bank Sulteng.
- `banks/catalog/`: koleksi 79 berkas SVG dari Wikimedia Commons. Koleksi ini mencakup logo aktif, variasi, dan beberapa logo historis/prototipe; periksa deskripsi pada `banks/catalog/manifest.json` sebelum memilihnya untuk data klien.
- `wallets/`: DANA, GoPay, OVO, ShopeePay, LinkAja, dan QRIS. QRIS hanya logo/placeholder visual, bukan kode pembayaran.
- `manifest.json`: indeks 33 pilihan bank dan 6 metode dompet digital/pembayaran yang tersedia untuk data undangan.
- `clients/demo-katalog/data.json`: 39 kartu simulasi bank dan pembayaran untuk memperlihatkan variasi tampilan katalog. Seluruh nomor/pemilik adalah data palsu bertanda DEMO; fitur salin dinonaktifkan. Tidak ada rekening aktif atau QR transaksi.

### Menambahkan rekening klien

Gunakan properti yang sama di `gifts.accounts[]`. Contoh ini hanya skema, bukan rekening sungguhan:

```json
{
  "paymentType": "bank",
  "type": "bank",
  "bank": "Bank BCA",
  "logo": "/assets/payment/banks/bca.svg",
  "accountNumber": "NOMOR_REKENING_DARI_KLIEN",
  "accountHolder": "NAMA PEMILIK SESUAI BANK",
  "copyable": true
}
```

Untuk e-wallet, gunakan `paymentType: "ewallet"`, nama layanan, logo lokal di `/assets/payment/wallets/`, nomor akun yang benar-benar diberikan klien, dan nama penerima. Untuk QRIS, gunakan gambar QRIS unik milik klien pada `qrCode`; jangan gunakan `qris-demo.svg` untuk transaksi.

### Keamanan demo

Semua item di demo ditandai `demoOnly: true`, nomor rekening dibuat sebagai kode simulasi, dan tombol salin dinonaktifkan. Jangan menghapus penanda ini dari katalog demo. Data rekening produksi hanya boleh berasal dari klien dan harus diverifikasi sebelum undangan dipublikasikan.

### Merek dan lisensi

Logo merupakan merek dagang pemilik masing-masing. Koleksi Wikimedia memiliki lisensi yang tercantum per item dalam `banks/catalog/manifest.json`; jangan menganggap seluruh 79 file memiliki lisensi yang sama. Untuk penggunaan komersial, periksa halaman sumber dan brand guideline resmi, terutama logo e-wallet. Aset lokal mencegah hotlink tetapi tidak menghapus kewajiban atribusi atau izin merek.
