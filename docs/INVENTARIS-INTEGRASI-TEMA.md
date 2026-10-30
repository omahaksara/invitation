# Inventaris dan Integrasi Tema Omah Aksara

Dokumen ini mencatat seluruh direktori tema yang ditemukan pada repository saat audit. Registry adalah sumber daftar tunggal; tema berstatus `active` boleh dipilih oleh klien produksi, sedangkan `draft` tetap tersimpan dan tidak boleh dipromosikan sebelum lulus kontrak engine dan pengujian.

## Inventaris

| Slug | Status registry | Kondisi awal yang ditemukan |
|---|---|---|
| aksara-nocturne | active | Terdaftar |
| aksara-signature | active | Terdaftar |
| aurelia-noir | active | Terdaftar |
| botanical-garden | active | Terdaftar |
| calestial | draft | Fragmen tema; perlu pemeriksaan CSS global dan inisialisasi JS |
| earty | draft | Fragmen tema; perlu pemeriksaan kontrak binding |
| elegance | active | Terdaftar |
| groom | draft | Dokumen HTML mandiri; tidak memakai kontrak binding engine dan membawa skrip ekspor yang tidak boleh dijalankan begitu saja |
| karsa | active | Terdaftar |
| kinze | draft | File diawali/diakhiri pagar Markdown; dibersihkan agar menjadi HTML valid |
| lume | draft | File bernama `Index.html`; React/Babel dan data mempelai masih tertanam, sehingga perlu migrasi ke JSON bersama |
| lumiere-bloom | active | Terdaftar |
| nox | draft | Dokumen HTML mandiri; tidak memakai kontrak binding engine dan membawa skrip ekspor yang tidak boleh dijalankan begitu saja |
| romantic-floral | active | Terdaftar |
| royal-vintage | active | Terdaftar |
| sirein | active | Terdaftar |
| taupe | draft | File bernama `Index.html`; dokumen ekspor mandiri, belum memakai kontrak binding engine |
| velvet-romance | active | Terdaftar |

## Temuan teknis penting

- `core/app.js` memuat dokumen HTML lengkap dengan mengambil isi `body` dan menyalin stylesheet dari `head`. Skrip yang berada di dalam body tidak otomatis dijalankan saat dipasang melalui `innerHTML`. Karena itu, menjalankan ulang semua skrip template secara otomatis bukan solusi aman: beberapa file memuat skrip ekspor besar atau dependensi React/Babel yang tidak menjadi bagian dari engine.
- Lume masih memuat data pasangan Alfia dan Fikri secara hard-coded serta bergantung pada React/Babel CDN. Tema ini harus dimigrasikan menjadi HTML/CSS presentasional yang membaca `window.__invitationData` atau atribut `data-bind`, bukan langsung dipromosikan.
- Groom, Nox, dan Taupe terlihat sebagai dokumen ekspor mandiri dengan skrip tambahan yang tidak relevan dengan fungsi undangan. Skrip tersebut tidak boleh dieksekusi di dalam aplikasi tanpa audit dan pembersihan.
- Lume dan Taupe memakai kapitalisasi `Index.html`; engine saat ini meminta `index.html` secara persis. Normalisasi nama file dilakukan setelah migrasi, bukan dengan menampilkan tema yang masih belum kompatibel.
- Kinze kini sudah dibersihkan dari pagar Markdown yang sebelumnya membungkus seluruh dokumen HTML. Namun, ia belum memiliki atribut `data-bind`, sehingga belum dianggap terintegrasi dengan data mempelai.

## Kontrak integrasi sebelum promosi

Setiap tema harus:
1. Dimuat melalui `core/app.js` tanpa mengganti data klien atau backend.
2. Menggunakan data JSON klien yang sama untuk nama, tanggal, lokasi, foto, galeri, musik, hadiah, RSVP, dan ucapan.
3. Mempertahankan elemen bersama yang diharapkan engine, termasuk identitas tamu, formulir RSVP, dan buku tamu.
4. Tidak mengandalkan path aset lokal yang tidak tersedia atau URL demo yang menyesatkan.
5. Lulus pemeriksaan desktop dan ponsel, console bersih, cover/buka undangan, scroll, font, gambar, musik, serta alur RSVP/ucapan.
6. Lulus validator data, tes backend, dan browser smoke test sebelum status diubah menjadi `active`.

## Catatan keselamatan

- Jangan menghapus direktori tema hanya karena belum aktif.
- Jangan mengubah data klien terbit atau konfigurasi API saat mengintegrasikan tema.
- Demo publik harus memakai slug demo dan data contoh, serta tidak boleh mengirim RSVP/ucapan demo ke database produksi.
- Promosi tema dilakukan satu per satu setelah seluruh kriteria lulus. Status `draft` bukan tanda tema ditolak; status ini menjaga tema tetap tersimpan tanpa mengeksposnya sebagai pilihan produksi.
