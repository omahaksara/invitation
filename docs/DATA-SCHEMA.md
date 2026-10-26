# Kontrak Data Omah Aksara V2

Dokumen ini mendefinisikan format baku yang dipakai engine. Ini adalah kontrak implementasi; data pelanggan tidak boleh dikonversi massal sebelum hasil pemetaan diperiksa.

## Identitas dan publikasi

- `schemaVersion`: angka versi skema; data baru memakai `2`.
- `slug`: identitas unik yang sama dengan nama folder di `clients/`.
- `status`: `draft` atau `published`. Draft tidak boleh tampil sebagai undangan publik.
- `theme`: salah satu `karsa`, `royal-vintage`, `sirein`, `aksara-signature`.
- `demoMode`: hanya untuk demo katalog; mengizinkan parameter `?theme=` memilih tema pratinjau. Untuk undangan pelanggan, tema publik hanya berasal dari `theme` yang tersimpan.

## Data pasangan

`couple.groom` dan `couple.bride` memakai properti konsisten: `nickname`, `fullName`, `parents`, `photo`, dan `instagram`. Properti yang tidak diperlukan boleh berupa string kosong atau dihilangkan; engine tidak boleh menampilkan placeholder kosong.

## Acara

`events` menerima daftar acara pada data V2 baru. Setiap acara dapat memiliki `id`, `title`, `date` dalam format ISO `YYYY-MM-DD`, `startTime`, `endTime`, `timezone` (zona IANA, misalnya `Asia/Makassar`), `location`, `address`, dan `mapsUrl`.

Adaptor migrasi sementara juga membaca bentuk objek lama seperti `events.akad` dan `events.resepsi`. Engine harus mengubah kedua bentuk itu ke model internal yang sama.

## Fitur

`features` adalah objek boolean. Fitur inti aktif secara default bila properti tidak ada. Nilai `false` menonaktifkan fitur. Contoh nama fitur:

- `countdown`, `calendar`, `loveStory`, `gallery`, `video`, `maps`
- `music`, `gifts`, `rsvp`, `guestbook`, `guestName`, `hashtag`, `quotes`

Jika fitur memerlukan data atau layanan yang belum dikonfigurasi, engine harus menyembunyikan komponen yang tidak relevan atau menunjukkan status yang jelas. Jangan membuat tombol yang tampak aktif tetapi tidak melakukan apa pun.

## Konten dan aset

- `story`: daftar objek `year`, `title`, `description`.
- `gallery`: daftar URL atau objek `src` dan `alt`.
- `gifts`: daftar rekening atau objek berisi `accounts`.
- `media.music`: URL atau path relatif ke aset musik.
- `integrations.apiUrl`: URL web app backend untuk RSVP dan buku tamu.
- `api.apiUcapan` dan `api.apiUrl`: format lama yang dibaca adaptor selama migrasi.

Path aset relatif diselesaikan dari folder `clients/<slug>/`. URL endpoint dan aset publik tidak boleh memuat rahasia.

## Lingkungan backend

Konfigurasi uji dan produksi harus dipisahkan di konfigurasi deployment. Data undangan publik tidak boleh menentukan kredensial atau memindahkan request ke lingkungan yang tidak dipercaya. Server tetap harus memvalidasi slug, panjang input, jenis aksi, dan batas jumlah tamu.

## Aturan migrasi

1. Baca format lama tanpa menimpa sumbernya.
2. Petakan nama properti lama ke model internal V2.
3. Validasi data wajib, tanggal, tema, URL, dan aset.
4. Laporkan nilai yang ambigu untuk pemeriksaan manual.
5. Simpan V2 hanya setelah hasilnya diverifikasi.
