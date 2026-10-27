# Mengelola Data dan Aset Klien Omah Aksara

Setiap undangan mempunyai satu folder sendiri di `clients/`. Mesin undangan membaca `data.json` dari folder yang sesuai dengan parameter `?c=slug`; foto, musik, dan QR milik pasangan disimpan di folder yang sama, bukan di folder tema.

## Contoh susunan folder

```text
clients/
└── afif-sindi/
    ├── data.json
    ├── foto-sampul.jpg
    ├── foto-pria.jpg
    ├── foto-wanita.jpg
    ├── foto1.jpg
    ├── foto2.jpg
    ├── foto3.jpg
    ├── foto4.jpg
    ├── musik.mp3
    └── qr-rekening.png
```

Nama berkas bebas, tetapi nilai di `data.json` harus cocok persis dengan nama berkas yang diunggah. Contoh berikut menggunakan path relatif dari folder klien:

```json
{
  "slug": "afif-sindi",
  "status": "draft",
  "schemaVersion": 2,
  "theme": "sirein",
  "cover": {
    "image": "foto-sampul.jpg"
  },
  "couple": {
    "groom": { "photo": "foto-pria.jpg" },
    "bride": { "photo": "foto-wanita.jpg" }
  },
  "gallery": [
    "foto1.jpg",
    "foto2.jpg",
    "foto3.jpg",
    "foto4.jpg"
  ],
  "media": {
    "music": "musik.mp3"
  }
}
```

Contoh di atas hanya menunjukkan cara menunjuk ke aset; lengkapi nama pasangan, acara, cerita, fitur, dan integrasi mengikuti [skema data V2](DATA-SCHEMA.md). Jangan mengganti `status` menjadi `published` sebelum undangan disetujui dan seluruh pengujian selesai.

## Aturan penting

1. Buat slug unik, huruf kecil dan tanda hubung, misalnya `afif-sindi`.
2. Unggah foto dan musik ke `clients/<slug>/`, bukan ke `templates/` atau folder klien lain.
3. Gunakan nama berkas sederhana tanpa spasi bila memungkinkan; cocokkan ejaan dan ekstensi di JSON.
4. Pastikan semua gambar, musik, dan QR yang dirujuk benar-benar ada. Path seperti `foto-pria.jpg` berarti file berada di folder slug yang sama.
5. Jangan menyimpan data pribadi yang tidak diperlukan. Repository publik berarti file foto, musik, dan JSON dapat diakses publik. Data rekening/QR hanya boleh dipasang setelah dikonfirmasi pemiliknya.
6. Jangan menyalin data klien nyata ke demo katalog. Demo harus memakai identitas, foto, rekening, dan tanggal contoh yang jelas.
7. Sebelum publikasi, jalankan validasi data, uji setiap tema, uji RSVP/buku tamu ke backend uji, lalu periksa di ponsel dan desktop.

## Tautan undangan

Setelah folder tersedia dan data berstatus publik, format URL adalah:

```text
https://omahaksara.github.io/invitation/?c=afif-sindi&to=Nama+Tamu
```

Parameter `to` bersifat opsional. Mesin membaca `clients/afif-sindi/data.json`; nama folder harus sama dengan nilai `c`.

## Data klien lama

Jangan menghapus atau mengubah struktur data lama hanya karena skema V2 sudah tersedia. Audit file dan aset terlebih dahulu, migrasikan satu klien pada satu waktu, dan pertahankan URL slug lama selama masih digunakan.


## Demo katalog sebagai patokan

Folder `clients/demo-katalog/` adalah master contoh untuk membuat undangan baru. Isinya memakai pasangan fiktif Budi–Ani dan aset contoh yang disalin dari berkas demo lama yang tersedia di riwayat Git. Folder klien asli tidak diubah oleh demo ini.

Susunan aset standar:

```text
clients/demo-katalog/
├── data.json
├── foto-pria.jpg
├── foto-sampul.jpg
├── foto-wanita.jpg
├── foto1.jpg
├── foto2.jpg
├── foto3.jpg
├── foto4.jpg
├── musik.mp3
└── bank/
    ├── README.md
    ├── logo-bca.svg
    ├── logo-bri.svg
    └── logo-mandiri.svg
```

- `data.json` adalah pusat pengaturan nama, tanggal, lokasi, fitur, dan nama aset.
- Foto dan musik memakai path relatif dari folder demo. Saat membuat folder klien baru, salin struktur ini lalu ganti aset dengan nama file yang sama agar tidak perlu mengubah kode.
- Bagian hadiah demo menampilkan logo bank, bukan gambar QR. Nomor rekening di demo hanya angka contoh dan diberi label **JANGAN TRANSFER**.
- Properti `logo` pada setiap item `gifts.accounts` menunjuk ke file logo relatif, misalnya `bank/logo-bca.svg`. Bank lain bisa ditambahkan dengan menaruh file logo sendiri di folder `bank/` lalu mengisi properti `logo` pada akun terkait.
- QR hanya boleh ditampilkan jika pemilik undangan memberikan QR valid dan memang ingin menggunakannya. Jangan pernah membuat QR palsu untuk rekening demo.
- Demo harus tetap menggunakan identitas, jadwal, alamat, dan rekening fiktif. Jangan menyalin data pribadi atau rekening klien sungguhan ke demo.
- Sebelum rilis, validasi JSON dan semua referensi aset, uji empat tema, RSVP dan buku tamu dalam mode simulasi, serta periksa tampilan ponsel dan desktop.
