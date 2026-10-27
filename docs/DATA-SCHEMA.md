# Kontrak Data Omah Aksara V2

Semua undangan baru menggunakan satu skema. Engine membaca format ini sebagai model utama; adaptor migrasi hanya menerjemahkan variasi lama yang ditemukan, bukan membuat logika berbeda per tema.

## Identitas dan tema

- `schemaVersion`: angka versi skema; data baru memakai `2`.
- `slug`: identitas unik yang sama dengan folder `clients/<slug>/`.
- `status`: `draft` atau `published`.
- `theme`: salah satu `karsa`, `royal-vintage`, `sirein`, `aksara-signature`, `botanical-garden`.
- `demoMode`: hanya untuk demo katalog; mengizinkan `?theme=` memilih pratinjau tanpa mengubah tema tersimpan.

## Pasangan dan konten

- `couple.groom` dan `couple.bride`: `nickname`, `fullName`, `parents`, `photo`, `instagram`.
- `cover`: judul, teks pembuka, foto, dan label tanggal untuk cover.
- `quote`: `arab`, `text`, dan `source`.
- `story`: daftar objek `year`, `title`, `description`.
- `gallery`: daftar URL aset atau objek `src` dan `alt`.
- `hashtag`: string hashtag.
- `video`: objek opsional dengan `src` atau `url`, serta `poster`.

## Acara

Bentuk baku V2 adalah objek acara dengan kunci stabil, misalnya `events.akad` dan `events.resepsi`. Setiap acara dapat memuat:

- `title`: judul acara.
- `date`: label tanggal yang dibaca manusia.
- `dateISO`: tanggal kalender `YYYY-MM-DD`, dipakai untuk kalender dan validasi.
- `startTime`, `endTime`: jam lokal `HH:mm`.
- `timezone`: zona waktu IANA, misalnya `Asia/Makassar`.
- `location`, `address`, `mapsUrl`: detail tempat dan tautan peta.

Adaptor sementara menerima array acara dan format tanggal lama. Data baru sebaiknya mengisi `dateISO`, `startTime`, `endTime`, dan `timezone` agar countdown dan ekspor kalender tidak menebak zona waktu.

## Fitur

`features` adalah objek boolean. Semua fitur inti aktif secara default bila properti tidak ditulis; `false` menonaktifkan fitur. Nama yang didukung:

`countdown`, `calendar`, `loveStory`, `gallery`, `video`, `maps`, `music`, `gifts`, `rsvp`, `guestbook`, `guestName`, `hashtag`, `quotes`.

Jika fitur memerlukan data atau layanan yang belum siap, engine harus menyembunyikan bagian yang tidak relevan atau memberi status yang jelas. Tombol tidak boleh tampak aktif tanpa tindakan, dan UI tidak boleh menyatakan sukses tanpa konfirmasi backend.

## Hadiah, media, dan integrasi

- `gifts`: `message` dan daftar `accounts` berisi `bank`, `accountNumber`, `accountHolder`, `logo` opsional untuk logo bank (path relatif dari folder klien atau URL), serta `qrCode` opsional bila pemilik memberi QR valid.
- `media.music`: URL atau path relatif untuk musik.
- `integrations.apiUrl`: URL HTTPS deployment backend yang dipilih untuk undangan tersebut.
- `api.apiUcapan` atau `api.apiUrl`: nama properti lama yang dibaca adaptor saat migrasi.

Path aset relatif diselesaikan dari folder `clients/<slug>/`. JSON publik tidak boleh memuat kata sandi, token privat, atau kunci rahasia.

## Backend

Satu kontrak API melayani RSVP dan buku tamu. Lingkungan uji dan produksi harus memakai deployment serta penyimpanan yang terpisah. Endpoint harus dikonfigurasi secara eksplisit; engine tidak boleh memiliki fallback URL produksi yang ditanam langsung di kode. Server memvalidasi slug, aksi, panjang input, dan jumlah tamu.

## Migrasi

1. Inventarisasi bentuk data lama dan aset yang dirujuk.
2. Petakan format lama ke skema ini tanpa menimpa sumber.
3. Validasi slug, tema, tanggal, URL, fitur, dan aset lokal.
4. Periksa hasil migrasi pada empat tema.
5. Baru tandai data sebagai V2 setelah validasi dan pemeriksaan visual lulus.
