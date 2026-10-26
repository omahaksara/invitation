# Omah Aksara — Undangan Digital

Repositori ini khusus untuk website undangan pernikahan digital Omah Aksara. Tidak memakai proses build: file HTML, CSS, JavaScript, dan JSON dilayani langsung oleh GitHub Pages.

## Cara kerja singkat

1. Tamu membuka tautan dengan parameter `?c=slug-klien`.
2. `core/app.js` membaca `clients/<slug-klien>/data.json`.
3. Nilai `theme` di `data.json` menentukan template di `templates/<theme>/`.
4. Mesin mengisi elemen template yang memiliki atribut `data-bind` dengan data undangan.
5. Foto, musik, dan QR milik klien disimpan di folder klien itu sendiri.

Contoh tautan:

```text
https://omahaksara.github.io/invitation/?c=budi-ani&to=Keluarga%20Bapak
```

Ganti `budi-ani` dengan nama folder klien. Parameter `to` opsional untuk nama tamu.

## Struktur folder

```text
/
├── index.html                 # Halaman pemuat aplikasi
├── README.md                  # Panduan repositori
├── core/
│   ├── app.js                 # Mesin pemuat, pengikat data, musik, dan interaksi umum
│   └── global.css             # Gaya dasar yang dipakai bersama
├── templates/
│   ├── karsa/
│   │   └── index.html         # Struktur + CSS Karsa di dalam <style>
│   ├── royal-vintage/
│   │   └── index.html         # Struktur + CSS Royal Vintage di dalam <style>
│   ├── sirein/
│   │   └── index.html         # Struktur + CSS Sirein di dalam <style>
│   └── aksara-signature/
│       └── index.html         # Struktur + CSS Aksara Signature di dalam <style>
└── clients/
    └── budi-ani/
        ├── data.json          # Seluruh data undangan contoh
        └── aset foto, musik, dan QR
```

## Menambah undangan baru

1. Salin folder `clients/budi-ani/` menjadi folder baru, misalnya `clients/andi-sari/`.
2. Ganti isi `data.json` dengan nama, tanggal, lokasi, tautan peta, cerita, galeri, rekening, dan musik pasangan baru.
3. Letakkan aset yang dipakai `data.json` di folder klien yang sama.
4. Pilih `theme` yang cocok: `karsa`, `royal-vintage`, atau `sirein`.
5. Uji tautan `?c=andi-sari` di browser ponsel dan desktop sebelum dibagikan.

**Penting:** `data.json` contoh berisi nama, tanggal, alamat, akun media sosial, dan rekening dummy. Ganti semuanya sebelum dipakai untuk undangan nyata. Jangan menaruh data sensitif yang tidak perlu di repositori publik.

## Mengubah template

- Setiap tema memiliki satu file `templates/<nama-template>/index.html`.
- Struktur HTML dan CSS tema berada dalam file yang sama; CSS ditulis di tag `<style>`.
- `core/global.css` tetap untuk gaya umum lintas tema, bukan untuk desain khusus tema.
- Gunakan `data-bind="jalur.data"` agar teks atau aset diisi dari `data.json`.
- Jika menambah ID tombol atau fitur baru, periksa apakah perlu ditangani di `core/app.js`.
- Jangan menghapus nama folder template selama masih dipilih oleh data klien.

## Batasan fitur saat ini

- RSVP dan buku tamu tidak mengirim atau membaca data jika URL Google Apps Script belum dikonfigurasi.
- URL harus berasal dari deployment Web App Google Apps Script yang benar-benar aktif; URL terisi saja belum membuktikan koneksi berhasil.
- Pengiriman baru dianggap berhasil jika endpoint mengembalikan respons JSON `ok: true`.
- Setelah mengubah mesin atau template, uji semua template dan tautan di browser; pemeriksaan sintaks saja tidak menjamin tampilan visual benar.

## Prinsip merawat repositori

- Simpan hanya aset yang benar-benar dipakai data undangan.
- Jangan menaruh aset satu klien di folder template.
- Pertahankan satu mesin umum di `core/app.js`; hindari membuat mesin berbeda untuk setiap klien.
- Tidak perlu menambah framework atau proses build untuk perubahan konten sederhana.
