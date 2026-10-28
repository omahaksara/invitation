# Omah Aksara V2 — Mesin Undangan Digital

Repository ini khusus untuk mesin undangan digital Omah Aksara. Mesin menggunakan HTML, CSS, JavaScript, dan JSON; tidak memerlukan framework atau proses build berat.

## Pembagian repository

- `omahaksara/invitation`: engine, seluruh tema aktif, data undangan, aset, backend, dan pengujian.
- `omahaksara/omahaksara.github.io`: katalog tema, demo pelanggan, informasi paket, dan tautan pemesanan.

Jangan menduplikasi engine atau backend ke repository katalog.

## Daftar tema resmi

Daftar tema aktif disimpan di [`templates/registry.json`](templates/registry.json). Katalog, validator data, dan pengujian harus membaca daftar yang sama. Saat menambah tema, tambahkan folder `templates/<slug>/index.html` lalu daftarkan satu kali di registry.

Logika fitur berada di `core/app.js`; tema mengatur presentasi. Semua tema harus menyediakan kontrak fitur yang sama. Jika suatu tema belum memiliki bagian visual tertentu, engine dapat menyediakan bagian bersama bila datanya tersedia.

## Standar penambahan tema baru

Tema baru harus berbeda secara visual, tetapi tetap memakai kontrak fitur engine yang sama. Jangan menyalin satu tema lalu hanya mengganti warna dan nama.

### Alur kerja tema
1. Tentukan konsep visual terlebih dahulu: target suasana, palet warna, pasangan font, pola layout, bentuk ornamen, gaya galeri, cover, dan animasi. Catat pembeda tema agar tidak menjadi variasi kosmetik dari tema yang sudah ada.
2. Buat `templates/<slug>/index.html`. Gunakan HTML/CSS tema untuk presentasi; jangan menanam ulang logika RSVP, buku tamu, data pasangan, atau pemilihan tema yang sudah menjadi tugas `core/app.js`.
3. Pertahankan binding dan selector kontrak yang dipakai engine serta smoke test. Jika struktur DOM memang berbeda, tambahkan kontrak tema secara eksplisit di `scripts/smoke-templates.cjs`.
4. Daftarkan tema satu kali di `templates/registry.json` dengan slug unik dan status yang benar. Jangan mengaktifkan tema sebelum aset, data, dan tesnya siap.
5. Uji tema pada data demo dan sekurangnya viewport ponsel 390px serta desktop. Pastikan tidak ada horizontal overflow, teks terpotong, tombol tertutup, atau section kosong ketika fitur dimatikan.
6. Jalankan `npm run test:static` dan seluruh smoke test Chromium sebelum meminta review. Periksa juga keyboard, kontras, reduced motion, status formulir, gambar gagal dimuat, dan jaringan lambat secara manual.

### Batas performa dan anti-lag
- Utamakan HTML/CSS/JavaScript biasa; jangan menambah framework atau pustaka besar hanya untuk efek dekoratif.
- Gunakan aset lokal yang dioptimalkan dan ukuran gambar yang wajar. Hindari gambar latar raksasa, video autoplay, GIF berat, serta permintaan font atau library eksternal yang tidak perlu.
- Animasi hanya untuk properti ringan seperti `transform` dan `opacity`; hindari animasi terus-menerus, layout thrashing, dan listener scroll yang berat.
- Hormati `prefers-reduced-motion`; konten inti harus tetap terbaca tanpa animasi.
- Jangan membuat fetch duplikat untuk data atau tema, jangan menambahkan polling tanpa kebutuhan, dan jangan memblokir interaksi utama saat efek dekoratif dimuat.
- Jaga konsol bersih dari error, cek gambar/font gagal dimuat, dan ukur hasil pada ponsel kelas menengah—bukan hanya desktop pengembang.
- Jangan menurunkan standar tema lain untuk meloloskan tes tema baru. Perbaiki akar masalah bersama bila regresi menyentuh engine.

### Gerbang aktivasi tema
Tema baru berstatus belum aktif sampai: kontrak fitur lengkap, aset demo aman, seluruh smoke test lulus, pemeriksaan ponsel/desktop selesai, dan review visual dilakukan. Setelah siap, ubah status registry menjadi `active`. Tema yang gagal atau belum lengkap tetap nonaktif agar tidak muncul di katalog maupun dipilih sebagai tema undangan.

## Portofolio gaya tema dan standar diferensiasi

Tujuan katalog bukan sekadar banyak pilihan warna. Setiap tema baru harus menawarkan **bahasa visual dan pengalaman membuka undangan yang berbeda**. Referensi tren adalah bahan riset, bukan jaminan bahwa semua gaya sedang paling laku; evaluasi minat pelanggan dari klik demo, pertanyaan calon klien, dan pesanan nyata.

### Keluarga gaya yang layak dikembangkan

| Keluarga gaya | Ciri identitas yang harus terlihat |
| --- | --- |
| Editorial / fashion magazine | Tipografi display besar, grid editorial, foto full-bleed, ruang kosong, susunan seperti majalah |
| Cinematic / film wedding | Cover seperti poster film, foto atmosferik, transisi adegan yang terukur, narasi visual |
| Royal Nusantara / adat | Ornamen dan motif budaya yang spesifik, komposisi seremonial, detail tradisi yang diteliti—bukan ornamen acak |
| Javanese / Sundanese heritage | Motif, aksara, simbol, dan palet yang sesuai tradisi yang dipilih; validasi istilah dan makna |
| Botanical / garden | Ilustrasi flora, komposisi organik, garis lembut, nuansa taman |
| Vintage / archival | Tekstur kertas, bingkai foto arsip, cap atau segel ilustratif, warna sepia yang terkontrol |
| Contemporary minimal | Tipografi dan proporsi sebagai fokus, ruang kosong, elemen sedikit namun presisi |
| Romantic / fine-art floral | Ilustrasi bunga, komposisi lembut, detail dekoratif dan galeri romantis |
| Dark luxury / noir | Kontras gelap, cahaya dramatis, detail metalik secukupnya, keterbacaan tinggi |
| Art Deco / geometric | Geometri simetris, garis arsitektural, pola dan tipografi era yang konsisten |
| Coastal / tropical destination | Bentuk organik, ilustrasi lokasi, suasana pesisir atau tropis yang khas |
| Whimsical / illustrated storybook | Ilustrasi khusus, babak cerita, karakter atau lanskap visual yang konsisten |
| Modern playful / retro | Tipografi ekspresif, bentuk grafis berani, komposisi dinamis, warna yang terarah |
| Architecture / venue-led | Ilustrasi venue, siluet bangunan, peta atau garis arsitektural sebagai identitas |
| Photo-journal / documentary | Foto candid, caption editorial, urutan cerita seperti album dokumenter |
| Interactive paper / scrapbook | Lapisan kertas, amplop, surat, stempel dan reveal interaktif yang ringan |

Daftar ini adalah portofolio arah kreatif, bukan pernyataan bahwa semua tema tersebut sudah tersedia. Prioritaskan pengembangan bertahap berdasarkan celah nyata di katalog, bukan membuat banyak tema sekaligus tanpa pemeriksaan mutu.

### Transisi dan interaksi: pilih sesuai karakter tema

Transisi bukan hanya fade yang sama pada semua tema. Tiap tema boleh memilih satu pola utama yang sesuai identitasnya:
- **Envelope / letter reveal:** amplop terbuka atau surat muncul untuk gaya klasik dan scrapbook.
- **Editorial scene transition:** bagian cerita berganti seperti spread majalah atau potongan film.
- **Curtain / arch reveal:** tirai atau bentuk lengkung membuka cover dengan gerakan singkat.
- **Photo-led parallax:** foto bergerak sangat halus terhadap latar; matikan atau sederhanakan pada perangkat lemah.
- **Paper-layer reveal:** lapisan kertas atau kartu tersingkap, tanpa simulasi 3D berat.
- **Kinetic typography:** nama atau tanggal muncul bertahap; tetap sediakan teks lengkap langsung di DOM.
- **Illustration bloom:** ornamen ilustrasi muncul perlahan untuk botanical atau floral.
- **Scroll storytelling:** bagian tampil saat masuk viewport, tanpa mengunci scroll atau menyembunyikan isi penting.
- **Traditional motif reveal:** pola atau ilustrasi adat tampil dengan hormat dan tidak mengubah simbol budaya menjadi dekorasi sembarang.

Batasi setiap halaman pada satu transisi pembuka dan beberapa micro-interaction. Jangan menumpuk partikel, parallax, video latar, animasi teks, dan scroll effects sekaligus. Semua konten inti harus bisa dibaca jika animasi gagal, JavaScript terbatas, atau `prefers-reduced-motion: reduce` aktif. Hindari audio otomatis yang mengganggu; musik harus punya kontrol yang jelas.

### Syarat agar tema benar-benar berbeda

Sebelum implementasi, isi catatan desain singkat:
1. Nama tema, keluarga gaya, dan target pasangan.
2. Moodboard atau referensi visual dengan sumber yang dicatat.
3. Layout cover dan susunan section, bukan hanya palet.
4. Tipografi, bentuk ornamen, gaya foto/ilustrasi, dan treatment galeri.
5. Pola transisi utama dan cara fallback tanpa animasi.
6. Perbedaan yang bisa dijelaskan dibanding minimal dua tema terdekat di katalog.

Jika satu-satunya perbedaan adalah warna, font, atau dekorasi kecil, tema itu belum layak dianggap tema baru. Buat perubahan layout dan karakter interaksi yang nyata.

### Performa dan kualitas yang wajib dijaga

- Mobile-first: mulai desain dari layar sempit; tombol nyaman disentuh, isi tidak melebar horizontal, dan RSVP mudah diisi dengan satu tangan.
- Optimalkan gambar ke ukuran tampilan, gunakan format modern jika kompatibel, lazy-load gambar di bawah fold, dan jangan lazy-load elemen cover utama yang diperlukan untuk kesan awal.
- Hindari video latar sebagai default, library animasi besar, efek blur berlapis, filter mahal, canvas/particle terus berjalan, dan scroll handler berat.
- Animasi utamakan `transform` dan `opacity`, durasi singkat, serta hentikan animasi yang tidak terlihat bila memungkinkan.
- Hormati `prefers-reduced-motion`; jangan menyembunyikan konten sampai animasi berjalan.
- Tetapkan anggaran performa untuk setiap tema: ukuran transfer awal, jumlah request, dan hasil pengukuran Core Web Vitals/lighthouse pada perangkat simulasi. Catat hasil aktual; jangan mengklaim "anti-lag" hanya karena smoke test lulus.
- Uji jaringan lambat, gambar gagal, font eksternal tidak tersedia, tombol keyboard, kontras, label formulir, dan error state.
- Pertahankan fitur dan keamanan engine bersama; jangan menduplikasi API atau menyentuh data pelanggan untuk membuat efek tema.

### Prioritas portofolio dan pembelajaran dari pelanggan

1. Petakan 11 tema aktif ke keluarga gaya di atas untuk menemukan kemiripan dan celah; jangan langsung menambah tema yang tumpang tindih.
2. Buat kandidat tema dalam status nonaktif/draft sampai aset, kontrak smoke test, dan review visual selesai.
3. Tampilkan preview yang mewakili gaya, bukan hanya thumbnail warna. Jika memungkinkan, sediakan preview cover, tampilan saat scroll, dan bagian RSVP.
4. Catat minat calon klien per gaya dan tema yang mereka buka atau tanyakan. Gunakan data agregat secukupnya; jangan mengumpulkan informasi pribadi yang tidak diperlukan.
5. Kembangkan tema berikutnya berdasarkan kombinasi permintaan pelanggan, keunikan visual, kemudahan pemeliharaan, dan hasil uji performa.
6. Jangan aktifkan tema atau ubah katalog publik sampai PR ditinjau dan semua gerbang rilis dipenuhi.

## URL demo

```text
https://omahaksara.github.io/invitation/?c=demo-katalog&theme=karsa&to=Nama+Tamu
```

- `c`: slug folder undangan di `clients/`.
- `to`: nama tamu opsional.
- `theme`: hanya berlaku untuk data dengan `demoMode: true`; hanya untuk pratinjau dan tidak mengubah tema tersimpan. Tema yang diminta harus berstatus `active` di registry resmi.

Undangan pelanggan publik memakai tema dari `data.json`. Engine dan smoke test membaca `templates/registry.json` sebagai daftar tema aktif tunggal. Setiap tema aktif wajib memiliki kontrak smoke test; tema baru yang belum memiliki kontrak akan menggagalkan pemeriksaan.

## Data dan fitur

Setiap undangan memakai `clients/<slug>/data.json`. Data baru harus menyertakan `schemaVersion: 2`. Properti `features` dapat mematikan fitur tertentu dengan `false`; jika properti fitur tidak ada, fitur inti aktif secara default.

Endpoint RSVP dan buku tamu harus ditulis secara eksplisit pada konfigurasi integrasi. Tidak ada fallback URL produksi yang boleh ditanam dalam kode. Mode demo hanya simulasi: formulir bisa dicoba, tetapi RSVP tidak dikirim ke database dan ucapan hanya tampil di halaman demo. Backend menolak slug yang tidak terdaftar sebagai `published` pada tab `Settings` spreadsheet.

Lihat [docs/DATA-SCHEMA.md](docs/DATA-SCHEMA.md) untuk format data dan adaptor migrasi.

## Menjalankan pemeriksaan

Node.js 20 atau lebih baru dibutuhkan untuk tes statis. Smoke test browser memakai Playwright dan Chromium.

```bash
npm run test:static
```

Untuk tes browser lokal, jalankan server statis di port 4173, pastikan Playwright/Chromium terpasang, lalu jalankan:

```bash
node scripts/smoke-templates.cjs
```

GitHub Actions memeriksa sintaks JavaScript, data V2, seluruh tema aktif pada registry, binding pasangan, musik, nama tamu, dan alur pembukaan. Tes otomatis tetap harus dilengkapi uji RSVP/buku tamu end-to-end pada deployment backend uji dan pemeriksaan visual di ponsel/desktop.

## Data lama

Data lama tidak dianggap otomatis sebagai skema V2. Validator memberi peringatan untuk data yang belum memakai `schemaVersion: 2`; migrasikan hanya setelah mapping dan asetnya diperiksa. Jangan menghapus data pasangan atau aset yang masih dipakai tanpa audit referensi.

## Gerbang rilis

Gunakan [docs/RELEASE-CHECKLIST.md](docs/RELEASE-CHECKLIST.md). Jangan merge ke `main` atau menganggap produksi siap hanya karena pemeriksaan statis lulus.
