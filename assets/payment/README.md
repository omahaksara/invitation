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

| File lokal | Identitas | Sumber |
|---|---|---|
| `banks/bca.svg` | BCA | [Wikimedia Commons — Bank Central Asia.svg](https://commons.wikimedia.org/wiki/File:Bank_Central_Asia.svg), PD-textlogo |
| `banks/bni.svg` | BNI | [Wikimedia Commons — Bank Negara Indonesia logo (2004).svg](https://commons.wikimedia.org/wiki/File:Bank_Negara_Indonesia_logo_(2004).svg), PD-textlogo |
| `banks/mandiri.svg` | Bank Mandiri | [Wikimedia Commons — Bank Mandiri logo 2016.svg](https://commons.wikimedia.org/wiki/File:Bank_Mandiri_logo_2016.svg), PD-textlogo |
| `banks/bsi.svg` | Bank Syariah Indonesia | [Wikimedia Commons — Bank Syariah Indonesia.svg](https://commons.wikimedia.org/wiki/File:Bank_Syariah_Indonesia.svg), PD-textlogo |
| `banks/bri.svg` | BRI | [Wikimedia Commons — BRI 2025.svg](https://commons.wikimedia.org/wiki/File:BRI_2025.svg), versi 16 Oktober 2025; akan diunduh oleh skrip sinkronisasi aset |
| `banks/bank-sulteng.png` | Bank Sulteng | [Wikimedia Commons — Logo Bank Sulteng.png](https://commons.wikimedia.org/wiki/File:Logo_Bank_Sulteng.png), sumber Bank Sulteng, PD-textlogo; format sumber PNG |
 
## E-wallet dan pembayaran

| File lokal | Identitas | Sumber |
|---|---|---|
| `wallets/gopay.svg` | GoPay | [Wikimedia Commons — GoPay logo.svg](https://commons.wikimedia.org/wiki/File:GoPay_logo.svg), sumber media kit GoPay |
| `wallets/dana.svg` | DANA | [Wikimedia Commons — Logo Dana Wiki.svg](https://commons.wikimedia.org/wiki/File:Logo_Dana_Wiki.svg), CC BY 4.0 — atribusi Gunarta (WMID) |
| `wallets/ovo.svg` | OVO | [Wikimedia Commons — Logo ovo purple.svg](https://commons.wikimedia.org/wiki/File:Logo_ovo_purple.svg), PD-textlogo |
| `wallets/shopeepay.svg` | ShopeePay | [Situs resmi ShopeePay](https://shopeepay.co.id/) — merek dan hak terkait milik pemiliknya |
| `wallets/qris.svg` | QRIS | [Wikimedia Commons — Logo QRIS.svg](https://commons.wikimedia.org/wiki/File:Logo_QRIS.svg), PD-textlogo; hanya identitas standar QRIS, bukan kode QR transaksi |

## Aturan penggunaan

- Logo hanya ditampilkan bila klien benar-benar memilih bank/metode pembayaran tersebut pada data undangannya.
- Jangan membuat nomor rekening atau QRIS palsu. Logo QRIS tidak menggantikan QRIS dinamis milik klien.
- Jangan mengubah warna, proporsi, atau bentuk logo resmi. Ukuran tampilan ditangani CSS `object-fit: contain`.
- Nama merek dan logo tetap milik pemilik masing-masing; pemakaian harus mengikuti ketentuan merek dagang/brand guideline.
- File lama pada `clients/demo-katalog/bank/` dipertahankan untuk kompatibilitas data lama; file BCA dan Mandiri di folder tersebut sudah diganti dengan artwork yang benar.
