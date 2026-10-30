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
| groom | draft | Dokumen HTML mandiri; perlu audit binding dan aset eksternal |
| karsa | active | Terdaftar |
| kinze | draft | File diawali/diakhiri pagar Markdown; dibersihkan agar menjadi HTML valid |
| lume | draft | File bernama `Index.html`; engine mencari `index.html` |
| lumiere-bloom | active | Terdaftar |
| nox | draft | Dokumen HTML mandiri; perlu audit binding dan aset eksternal |
| romantic-floral | active | Terdaftar |
| royal-vintage | active | Terdaftar |
| sirein | active | Terdaftar |
| taupe | draft | File bernama `Index.html`; engine mencari `index.html` |
| velvet-romance | active | Terdaftar |

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
