# Checklist Rilis Publik Omah Aksara V2

Gunakan daftar ini sebagai gerbang rilis. Centang hanya setelah bukti pengujian tersedia.

## Data dan aset
- [ ] Semua data undangan produksi valid JSON dan mengikuti `schemaVersion: 2`.
- [ ] Semua tema hanya memakai daftar tema resmi.
- [ ] Semua path aset lokal ada, valid, dan berada di folder slug yang benar.
- [ ] Tidak ada kredensial, token privat, atau data demo yang mengidentifikasi orang nyata.
- [ ] Tanggal, zona waktu, nama tamu, dan URL lokasi sudah diperiksa.

## Fitur di empat tema
- [ ] Cover dan tombol buka undangan bekerja.
- [ ] Profil pasangan, orang tua, cerita, dan kutipan tampil dengan benar.
- [ ] Countdown dan kalender tidak salah tanggal/zona waktu.
- [ ] Galeri, lightbox, video opsional, dan peta berfungsi.
- [ ] Amplop digital, nomor rekening, dan QR ditampilkan hanya jika tersedia.
- [ ] Musik dapat diputar/dijeda dengan kontrol yang dapat diakses keyboard.
- [ ] RSVP dan buku tamu memiliki validasi dan status sukses/gagal yang benar.
- [ ] Nama tamu terpersonalisasi dengan aman.
- [ ] Fitur yang dinonaktifkan tidak menyisakan section kosong atau kontrol palsu.

## Integrasi dan keamanan
- [ ] Endpoint uji dan produksi dipisahkan.
- [ ] RSVP dan buku tamu benar-benar diuji pada backend uji.
- [ ] Data RSVP dan buku tamu terisolasi berdasarkan slug tervalidasi.
- [ ] Input, spam, kegagalan jaringan, dan percobaan pengiriman ganda diuji.
- [ ] Demo tanpa endpoint menyatakan bahwa formulir hanya simulasi dan tidak menyimpan data.

## Kualitas
- [ ] `npm test` lulus pada branch rilis.
- [ ] Browser desktop dan ponsel diperiksa untuk empat tema.
- [ ] Keyboard, label formulir, kontras, reduced motion, dan status loading/error diperiksa.
- [ ] Katalog memakai URL demo yang benar dan semua tautan pemesanan diperiksa.
- [ ] Hasil uji dan daftar perubahan ditinjau sebelum merge ke `main`.
