# Kontrak Data Omah Aksara V2

Semua undangan baru menggunakan satu skema. Engine membaca format ini sebagai model utama; adaptor migrasi hanya menerjemahkan variasi lama yang ditemukan, bukan membuat logika berbeda per tema.

## Identitas dan tema

- `schemaVersion`: angka versi skema; data baru memakai `2`.
- `slug`: identitas unik yang sama dengan folder `clients/<slug>/`.
- `status`: `draft` atau `published`.
- `theme`: slug tema yang berstatus `active` pada `templates/registry.json`. Jangan memelihara allowlist terpisah di katalog, validator, atau dokumentasi.
- `demoMode`: hanya untuk demo katalog; mengizinkan `?theme=` memilih pratinjau tanpa mengubah tema tersimpan.

## Pasangan dan konten

- `couple.groom` dan `couple.bride`: bentuk baku `nickname`, `fullName`, `parents`, `photo`, `instagram`, serta `initial` (otomatis dihitung dari nama panggilan oleh core).
- Alias lama identitas/foto yang diterima: `namaPanggilan`/`shortName`, `namaLengkap`/`name`/`nama`, `orangTua`/`parentNames`, dan `foto`/`image`/`photoUrl`; semuanya dipetakan ke bentuk baku tanpa menulis ulang JSON klien.
- Urutan inisial pasangan selalu pria lalu wanita: `couple.initials` = `couple.groom.initial` + `couple.bride.initial`. Nilai inisial lama yang keliru tidak dipercaya; core menghitung ulang dengan huruf kapital.
- `cover`: bentuk baku foto adalah `heroImage`; alias `image`, `foto`, `backgroundImage`, dan `background` diterima. Core menyediakan `cover.image` dan `cover.foto` sebagai alias baca agar markup tema lama tetap bekerja.
- `quote`: `arab`, `text`, dan `source`.
- `story`: daftar cerita berjumlah fleksibel. Bentuk baku berbahasa Indonesia: `judul`, `tanggal`, `cerita`, `foto`. Engine juga membaca alias lama `title`, `year`/`date`, `description`, `photo`/`image` agar data lama tetap kompatibel. Path foto relatif terhadap `clients/<slug>/` dan diperiksa oleh validator aset.
- `gallery`: daftar URL aset atau objek baku `src` dan `alt`. Alias objek `url`, `foto`, dan `image` diterima lalu dinormalisasi ke `src`.
- `hashtag`: string hashtag.
- `video`: objek opsional dengan `src` atau `url`, serta `poster`.

## Acara

Bentuk baku V2 adalah objek acara dengan kunci stabil, misalnya `events.akad` dan `events.resepsi`. Setiap acara dapat memuat:

- `title`: judul acara.
- `date`: label tanggal yang dibaca manusia.
- `dateISO`: tanggal kalender `YYYY-MM-DD`, dipakai untuk kalender dan validasi.
- `startTime`, `endTime`: jam lokal `HH:mm`.
- `timezone`: zona waktu IANA, misalnya `Asia/Makassar`.
- `location`, `address`, `mapsUrl`, `mapEmbedUrl`, `mapQuery`, `mapNote`: detail tempat dan tautan peta.
- Nama properti baku untuk tautan adalah `mapsUrl`; adaptor lama menerima `mapUrl`, `googleMapsUrl`, dan `urlMaps`. Untuk sematan, gunakan `mapEmbedUrl` (alias lama `embedUrl`/`mapsEmbedUrl`).
- Nama properti baku koordinat adalah `coordinates: { lat, lng }`; adaptor menerima `latitude`/`longitude`, `lat`/`lng`, dan `lon`, lalu menormalkannya ke `lat`/`lng`. Koordinat harus berasal dari pemilik atau hasil verifikasi lokasi, bukan hasil tebakan alamat.
- `mapQuery` adalah teks pencarian lokasi untuk Maps/navigasi. Jika kosong, core membentuknya dari `location` dan `address`; tautan `mapsUrl` yang diberikan pemilik tetap diprioritaskan sebagai tujuan buka peta.
- `coordinates`: titik terverifikasi berbentuk `{ "lat": -0.123, "lng": 120.456 }`. Koordinat hanya boleh diisi dari titik yang diberikan atau diverifikasi pemilik undangan.

### Mode acara V2

- `eventMode: "combined"` adalah default untuk undangan baru. Engine menggabungkan akad dan resepsi menjadi satu kartu dengan dua baris jadwal apabila kedua acara menunjuk lokasi yang sama dan data petanya konsisten.
- `eventMode: "separate"` menampilkan akad dan resepsi sebagai kartu terpisah, termasuk ketika tanggal atau lokasinya berbeda.
- `eventMode: "akad-only"` atau `eventMode: "resepsi-only"` dipakai bila hanya satu rangkaian acara yang diselenggarakan.
- Jika `eventMode` tidak ada, engine mempertahankan perilaku JSON lama. Tidak ada migrasi otomatis atau perubahan data pelanggan lama.
- Dalam mode gabungan, setiap entri jadwal tetap menyimpan tanggal, jam, dan zona waktunya sendiri. Kalender menyediakan satu entri per rangkaian acara; countdown mengarah ke acara valid paling awal. Peta hanya satu jika titik/lokasi benar-benar sama.
- Jika lokasi atau tautan peta berbeda, engine tidak boleh memaksakan satu pin. Acara tetap ditampilkan terpisah agar tamu tidak diarahkan ke lokasi yang salah.

Adaptor sementara tetap menerima array acara dan format tanggal lama. Data baru sebaiknya mengisi `dateISO`, `startTime`, `endTime`, dan `timezone` agar countdown dan ekspor kalender tidak menebak zona waktu.

## Konten tambahan dan identitas publik

- `opening`: objek dengan `text` dan opsi konten pembuka lainnya.
- `closing`: objek opsional dengan `title`, `text`, dan `signature`; bagian ini disembunyikan bila seluruh isinya kosong.
- `seo`: objek metadata halaman (misalnya `title`, `description`, dan `image`).
- `site`: konfigurasi publik undangan, termasuk `timezone` (default `Asia/Makassar` bila tidak diisi).
- `guest`: nama tamu bawaan opsional; nama dari tautan undangan tetap menjadi prioritas.
- `countdown`: objek target hitung mundur. Core dapat membaca tanggal acara sebagai fallback, tetapi data baru sebaiknya menetapkan target secara eksplisit bila countdown diarahkan ke acara tertentu.
- `guestbook` dan `rsvp`: konfigurasi fitur. Endpoint/integrasi khusus klien tetap opsional dan tidak boleh disalin ke data demo.

## Fitur

`features` adalah objek boolean. Semua fitur inti aktif secara default bila properti tidak ditulis; `false` menonaktifkan fitur. Nama yang didukung:

`countdown`, `calendar`, `loveStory`, `gallery`, `video`, `maps`, `music`, `gifts`, `rsvp`, `guestbook`, `guestName`, `hashtag`, `quotes`.

Jika fitur memerlukan data atau layanan yang belum siap, engine harus menyembunyikan bagian yang tidak relevan atau memberi status yang jelas. Tombol tidak boleh tampak aktif tanpa tindakan, dan UI tidak boleh menyatakan sukses tanpa konfirmasi backend.

## Hadiah, media, dan integrasi

- `gifts`: objek berisi `message`, `enabled` opsional untuk mengaktifkan/menyembunyikan seluruh bagian hadiah, dan daftar `accounts`. Bentuk lama berupa array akun tetap diterima lalu dinormalisasi ke objek ini. Setiap metode mendukung `type`/`paymentType` (`bank`, `ewallet`, atau `qris`), `enabled` per metode, `provider`/`bank`, `accountHolder`/`accountName`, `accountNumber`/`phoneNumber`/`destinationNumber`, `copyValue`, `logo`, serta `qrCode` atau `qr.src`. `type` yang tidak ditulis tetap dianggap `bank` agar data lama kompatibel. Data demo wajib memakai `demoOnly: true` dan `copyable: false`; QR demo harus berupa ilustrasi yang jelas bukan kode transaksi. Jangan menaruh QR atau nomor pembayaran asli pada katalog demo.
- `media.music`: string URL/path lama atau objek pilihan katalog berisi `id`, `title`, `category`, dan `src`. Core juga menyediakan alias baca `data.music` untuk tema/renderer lama; sumber baku tetap `media.music`. Path relatif tetap diselesaikan dari `clients/<slug>/`; untuk katalog bersama gunakan path seperti `../../assets/music/library/<file>.mp3`. Format string lama tetap didukung.
- Musik bersama dikelola melalui `assets/music/library/manifest.json`; setiap entri harus mencantumkan identitas, kategori, path, dan status lisensi. Track dengan lisensi belum diverifikasi hanya boleh dipakai untuk pengujian internal, bukan otomatis ditawarkan untuk undangan pelanggan.
- `integrations.apiUrl`: URL HTTPS deployment backend yang dipilih untuk undangan tersebut.
- `api.apiUcapan` atau `api.apiUrl`: nama properti lama yang dibaca adaptor saat migrasi.

Path aset relatif diselesaikan dari folder `clients/<slug>/`. JSON publik tidak boleh memuat kata sandi, token privat, atau kunci rahasia.

## Backend

Satu kontrak API melayani RSVP dan buku tamu. Lingkungan uji dan produksi harus memakai deployment serta penyimpanan yang terpisah. Endpoint harus dikonfigurasi secara eksplisit; engine tidak boleh memiliki fallback URL produksi yang ditanam langsung di kode. Server memvalidasi slug, aksi, panjang input, dan jumlah tamu.

## Migrasi

1. Inventarisasi bentuk data lama dan aset yang dirujuk.
2. Petakan format lama ke skema ini tanpa menimpa sumber.
3. Validasi slug, tema, tanggal, URL, fitur, dan aset lokal.
4. Periksa hasil migrasi pada seluruh tema aktif.
5. Baru tandai data sebagai V2 setelah validasi dan pemeriksaan visual lulus.
