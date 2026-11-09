# Checklist Rilis Publik Omah Aksara V2

Jangan menandai rilis siap sebelum semua poin wajib memiliki bukti pengujian.

## Data dan aset
- [ ] Data produksi valid JSON dan mengikuti `schemaVersion: 2`.
- [ ] Tema menggunakan daftar tema aktif dari `templates/registry.json`.
- [ ] Semua aset lokal ada dan berada di folder slug yang tepat.
- [ ] Tanggal ISO, zona waktu, dan URL peta sudah diverifikasi.
- [ ] Data demo memakai konten dummy yang jelas; tidak ada kredensial rahasia.

## Semua tema aktif
- [ ] Cover dan tombol buka bekerja, termasuk tema tanpa cover khusus.
- [ ] Identitas pasangan, orang tua, cerita, dan kutipan tampil benar.
- [ ] Countdown dan tombol ekspor kalender menghasilkan tanggal/jam yang benar.
- [ ] Galeri, lightbox, video opsional, dan peta bekerja.
- [ ] Amplop digital, salin rekening, dan QR ditampilkan sesuai konfigurasi.
- [ ] Kontrol musik tidak menghilangkan ikon dan bisa diakses keyboard.
- [ ] RSVP dan buku tamu ada di semua tema dengan validasi dan status jelas.
- [ ] Nama tamu terpersonalisasi dengan aman.
- [ ] Flag `false` tidak menyisakan section kosong atau tombol palsu.

## Backend dan privasi
- [ ] Endpoint TEST dan PROD memakai proyek Apps Script, spreadsheet, Script Properties, dan URL deployment yang terpisah.
- [ ] Script Property `OMAH_AKSARA_DATABASE_ID` pada proyek TEST diverifikasi menunjuk ke spreadsheet TEST sebelum `setupDatabase()` dijalankan.
- [ ] Tab RSVP dan Guestbook TEST mempunyai header persis sesuai `backend/Code.gs`; tab Settings hanya mengizinkan slug uji.
- [ ] Health check TEST lulus dan menampilkan versi backend yang sesuai.
- [ ] RSVP dan guestbook benar-benar diuji melalui browser ke backend TEST; baris tersimpan hanya di spreadsheet TEST.
- [ ] GET guestbook mengembalikan ucapan yang baru diuji untuk slug yang sama.
- [ ] Slug draft/tidak terdaftar ditolak untuk GET dan POST.
- [ ] Baris data uji dibersihkan setelah bukti dicatat.
- [ ] Tidak ada pengiriman data uji ke spreadsheet produksi.
- [ ] Data terisolasi per slug tervalidasi.
- [ ] Input, spam, pengiriman ganda, dan kegagalan jaringan diuji.
- [ ] Demo tanpa endpoint menyatakan simulasi dan tidak menyimpan data.

## Kualitas dan publikasi
- [ ] Pemeriksaan sintaks dan validasi data lulus.
- [ ] Smoke test Chromium lulus untuk semua tema.
- [ ] Desktop dan ponsel diperiksa secara visual.
- [ ] Keyboard, kontras, label formulir, reduced motion, dan error state diperiksa.
- [ ] Semua tautan demo katalog dan pemesanan diuji.
- [ ] PR ditinjau sebelum merge; tidak ada merge otomatis ke `main`.
