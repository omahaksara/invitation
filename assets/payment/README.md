# Aset logo pembayaran Omah Aksara

Logo disimpan secara lokal di repository agar undangan tidak melakukan hotlink ke Wikimedia/CDN saat dibuka. Engine hadiah sudah mendukung `gifts.accounts[].logo`; gunakan path absolut lokal agar seluruh tema dapat memakainya tanpa menyalin file ke folder setiap klien.

Contoh data:
```json
{
  "bank": "Bank BCA",
  "logo": "/assets/payment/banks/bca.svg",
  "accountNumber": "…",
  "accountHolder": "…"
}
```

## Bank

Status sinkronisasi: BCA, BNI, Mandiri, BSI, BRI versi 2025, dan Bank Sulteng tersedia sebagai file lokal dan sudah dipakai pada pratinjau demo. Bank Sulteng memakai PNG resmi resolusi tinggi karena sumber yang tersedia bukan SVG. Data nomor rekening pada demo adalah placeholder, bukan rekening aktif.

| File lokal | Identitas | Sumber |
|---|---|---|
| `banks/bca.svg` | BCA | [Wikimedia Commons — Bank Central Asia.svg](https://commons.wikimedia.org/wiki/File:Bank_Central_Asia.svg), PD-textlogo |
| `banks/bni.svg` | BNI | [Wikimedia Commons — Bank Negara Indonesia logo (2004).svg](https://commons.wikimedia.org/wiki/File:Bank_Negara_Indonesia_logo_(2004).svg), PD-textlogo |
| `banks/mandiri.svg` | Bank Mandiri | [Wikimedia Commons — Bank Mandiri logo 2016.svg](https://commons.wikimedia.org/wiki/File:Bank_Mandiri_logo_2016.svg), PD-textlogo |
| `banks/bsi.svg` | Bank Syariah Indonesia | [Wikimedia Commons — Bank Syariah Indonesia.svg](https://commons.wikimedia.org/wiki/File:Bank_Syariah_Indonesia.svg), PD-textlogo |
| `banks/cimb.svg` | CIMB Niaga | [Wikimedia Commons — CIMB Niaga logo.svg](https://commons.wikimedia.org/wiki/File:CIMB_Niaga_logo.svg), PD-textlogo |
| `banks/bri.svg` | BRI | [Wikimedia Commons — BRI 2025.svg](https://commons.wikimedia.org/wiki/File:BRI_2025.svg), versi 16 Oktober 2025; disimpan sebagai aset lokal |
| `banks/bank-sulteng.png` | Bank Sulteng | [Halaman logo resmi Bank Sulteng](https://mail.banksulteng.co.id/tentang-kami/logo), file gambar resmi dari domain Bank Sulteng; format sumber PNG |
 
## E-wallet dan pembayaran

| File lokal | Identitas | Sumber |
|---|---|---|
| `wallets/gopay.svg` | GoPay | [Wikimedia Commons — GoPay logo.svg](https://commons.wikimedia.org/wiki/File:GoPay_logo.svg), sumber media kit GoPay |
| `wallets/dana.svg` | DANA | [Wikimedia Commons — Logo Dana Wiki.svg](https://commons.wikimedia.org/wiki/File:Logo_Dana_Wiki.svg), CC BY 4.0 — atribusi Gunarta (WMID); atribusi wajib dipertahankan |
| `wallets/ovo.svg` | OVO | [Wikimedia Commons — Logo ovo purple.svg](https://commons.wikimedia.org/wiki/File:Logo_ovo_purple.svg), PD-textlogo |
| `wallets/shopeepay.svg` | ShopeePay | [Situs resmi ShopeePay](https://shopeepay.co.id/) — merek dan hak terkait milik pemiliknya |
| `wallets/qris.svg` | QRIS | [Wikimedia Commons — Logo QRIS.svg](https://commons.wikimedia.org/wiki/File:Logo_QRIS.svg), PD-textlogo; hanya identitas standar QRIS, bukan kode QR transaksi |

## Aturan penggunaan

- Logo SVG dari koleksi Wikimedia yang berstatus PD-textlogo dapat digunakan sebagai identifikasi merek; status public domain pada artwork tidak menghapus hak merek dagang pemiliknya.
- Logo DANA memiliki lisensi CC BY 4.0 dan wajib diberi atribusi kepada Gunarta (WMID).

- Logo hanya ditampilkan bila klien benar-benar memilih bank/metode pembayaran tersebut pada data undangannya.
- Jangan membuat nomor rekening atau QRIS palsu. Logo QRIS tidak menggantikan QRIS dinamis milik klien.
- Jangan mengubah warna, proporsi, atau bentuk logo resmi. Ukuran tampilan ditangani CSS `object-fit: contain`.
- Nama merek dan logo tetap milik pemilik masing-masing; pemakaian harus mengikuti ketentuan merek dagang/brand guideline.
- File lama pada `clients/demo-katalog/bank/` dipertahankan untuk kompatibilitas data lama; file BCA, BRI, dan Mandiri di folder tersebut sudah diganti dengan artwork sumber.
