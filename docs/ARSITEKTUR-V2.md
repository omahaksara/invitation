# Omah Aksara V2 — Kontrak Arsitektur

## Tujuan

Satu sistem undangan digital yang ringan, mudah dirawat, dan siap dipublikasikan. V2 menggantikan mesin lama setelah implementasi baru lolos pengujian. Kode tema lama yang tidak termasuk empat tema resmi boleh dibersihkan setelah audit referensi; jangan menghapus data pasangan atau aset yang masih digunakan tanpa verifikasi.

## Keputusan yang disepakati

1. Semua fitur inti aktif secara default; `features.<nama>` bernilai `false` untuk menonaktifkan fitur.
2. Data atau konfigurasi yang belum lengkap ditangani dengan aman. Tidak boleh ada section kosong, tombol palsu, atau status sukses palsu.
3. Logika fitur berada di engine pusat; JSON mengatur konfigurasi dan konten.
4. Demo katalog harus lengkap dan bisa dicoba. Fitur yang belum terhubung ke backend ditandai sebagai simulasi dan tidak boleh mengaku menyimpan data.
5. Pergantian tema melalui `?theme=` hanya untuk pratinjau pada data `demoMode: true`; undangan publik menggunakan tema tersimpan.
6. Semua data baru memakai satu skema V2; adaptor migrasi memetakan data lama tanpa menimpa sumbernya.
7. RSVP dan buku tamu memakai backend bersama dengan lingkungan uji dan produksi yang terpisah.
8. Repository mesin dan repository katalog memiliki tanggung jawab berbeda. Mesin dan kode backend tidak diduplikasi ke repo katalog.

## Komponen

- `core/app.js`: pemuatan data, validasi runtime, binding, fitur bersama, formulir, media, dan error handling.
- `core/global.css`: reset dan gaya dasar lintas tema.
- `templates/karsa/`, `templates/royal-vintage/`, `templates/sirein/`, `templates/aksara-signature/`: presentasi empat tema resmi.
- `clients/<slug>/data.json`: data tunggal tiap pasangan; aset relatif disimpan di folder slug.
- `backend/Code.gs`: API RSVP dan buku tamu.
- `scripts/`: pemeriksaan data dan smoke test statis.
- `docs/`: kontrak data, arsitektur, dan kriteria rilis.

## Alur runtime

1. Engine menerima slug dan memvalidasi formatnya.
2. Engine memuat JSON undangan yang sesuai dan memeriksa status publikasi.
3. Data melewati adaptor migrasi untuk variasi lama yang masih didukung.
4. Tema diambil dari daftar yang diizinkan. Parameter pratinjau hanya berlaku pada demo.
5. Engine memuat tema, mengikat data, menerapkan flag fitur, lalu mengaktifkan perilaku umum.
6. Integrasi eksternal menampilkan status eksplisit jika endpoint belum siap atau gagal.

## Skema dan migrasi

Lihat [DATA-SCHEMA.md](DATA-SCHEMA.md). Data baru harus menggunakan `schemaVersion: 2`. Migrasi dilakukan bertahap: inventarisasi, pemetaan, validasi, pemeriksaan hasil, baru kemudian penggantian data. Tidak ada konversi massal yang menimpa data sumber tanpa bukti bahwa hasilnya benar.

## Backend dan keamanan

Satu API client dipakai engine. URL backend berasal dari konfigurasi deployment; tidak ada rahasia di JSON publik. Server memvalidasi slug, aksi, panjang input, jumlah tamu, dan batas pengiriman. Uji dan produksi harus menggunakan penyimpanan/izin yang terpisah. Keberhasilan hanya ditampilkan setelah server mengonfirmasi `ok: true`.

## Tes dan rilis

GitHub Actions menjalankan validasi JSON/aset dan smoke test statis. Pemeriksaan ini belum membuktikan perilaku browser, kualitas visual, atau konektivitas Apps Script. Sebelum merge, selesaikan [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md), termasuk pengujian empat tema di ponsel dan desktop serta uji end-to-end RSVP/buku tamu.
