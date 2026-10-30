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
| earty | draft | Migrasi awal selesai: 20 jalur binding unik cocok dengan JSON demo; CSS global sudah di-scope, kontrol kalender/video diserahkan ke engine; menunggu browser CI |
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


## Audit lanjutan: Calestial, Earty, dan Kinze

Pemeriksaan lanjutan pada branch integrasi menemukan:

| Tema | Binding data | Risiko saat dimuat engine | Keputusan |
|---|---:|---|---|
| Calestial | 19 atribut | CSS masih menargetkan `body` dan `#app`; skrip starfield/reveal menunggu `DOMContentLoaded`, padahal fragmen tema dipasang setelah event tersebut | Draft; perlu scope CSS dan lifecycle init yang eksplisit |
| Earty | 19 atribut | CSS masih menargetkan `body` dan `#app`; belum ada skrip tema | Draft; perlu scope CSS dan uji semua binding terhadap data nyata |
| Kinze | 0 atribut | HTML mandiri, hard-coded, membawa Tailwind CDN dan beberapa skrip; tidak memakai kontrak binding engine | Draft; perlu migrasi presentasi dari awal |

### Urutan migrasi yang disarankan

1. **Earty** — migrasi awal selesai pada branch ini: 20 jalur binding unik sudah cocok dengan JSON demo; CSS global dipindahkan ke root tema; quote, jadwal, galeri, musik, hadiah, RSVP, dan buku tamu memakai binding/renderer engine. Browser smoke desktop dan mobile ditambahkan untuk draft preview; status tetap draft sampai CI lulus dan pemeriksaan visual selesai.
2. **Calestial** — migrasi awal selesai pada branch ini: 20 jalur binding unik cocok dengan JSON demo; selector global dibatasi ke root tema; starfield dibuat CSS-only dan skrip `DOMContentLoaded` dihapus; quote, jadwal, kalender, galeri, musik, RSVP, dan buku tamu memakai engine bersama. Browser smoke draft preview ditambahkan; status tetap draft sampai CI dan pemeriksaan visual selesai.
3. **Kinze** — migrasi struktural. Ambil komposisi visual yang relevan, buang data pasangan contoh, lalu bangun ulang sebagai fragmen presentasional dengan binding JSON. Jangan mengeksekusi konfigurasi Tailwind atau skrip ekspor di engine.
4. **Lume, Groom, Nox, Taupe** — audit dan migrasi bertahap setelah tiga kandidat di atas; semua tetap draft sampai lulus tes.

### Gerbang promosi tema

Tema baru boleh diubah menjadi `active` hanya jika:
- tidak memiliki data mempelai hard-coded;
- semua field wajib berasal dari kontrak data klien;
- CSS tidak mengubah elemen global di luar root tema;
- lifecycle tema berjalan saat fragmen dipasang (tanpa ketergantungan pada `DOMContentLoaded` ulang);
- foto, font, musik, galeri, jadwal, hadiah, RSVP, dan buku tamu tervalidasi;
- lolos smoke test browser dan pemeriksaan tampilan ponsel/desktop.

Catatan: audit ini tidak mengubah data klien, endpoint Apps Script, maupun backend RSVP/buku tamu.


### Hasil validasi statis Earty (branch integrasi)

- 20 jalur `data-bind` unik ditemukan dan semuanya memiliki nilai pada `clients/demo-katalog/data.json`.
- Tidak ditemukan selector CSS global `body`, `#app`, atau `:root` pada stylesheet tema.
- Tidak ada skrip tema yang bergantung pada `DOMContentLoaded`; seluruh inisialisasi fitur bersama ditangani oleh `core/app.js`.
- Placeholder video kosong dan tautan kalender `href="#"` dihapus agar engine membuat komponen sesuai data dan fitur.
- Earty ditambahkan ke browser smoke suite sebagai draft preview eksplisit, tanpa mengubah status registry menjadi `active`.


### Hasil validasi statis Calestial (branch integrasi)

- 20 jalur `data-bind` unik ditemukan dan semuanya memiliki nilai pada `clients/demo-katalog/data.json`.
- Selector CSS global `body`, `#app`, `:root`, `.starfield`, `.star`, dan `.celestial-nav` tidak lagi berdiri di luar root tema.
- Skrip tema yang menunggu `DOMContentLoaded` dihapus; starfield dekoratif diganti dengan lapisan radial-gradient CSS sehingga aman saat fragmen dimuat dinamis.
- Kutipan dan sumbernya kini memakai `quote.arab`, `quote.text`, dan `quote.source`; tautan kalender kosong dan placeholder video dihapus agar engine membuat komponen sesuai data.
- Calestial ditambahkan ke browser smoke suite sebagai draft preview eksplisit; status registry tetap `draft`.
