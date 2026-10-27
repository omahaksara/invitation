# Omah Aksara V2 — Arsitektur

## Tujuan

Mengganti mesin undangan lama dengan satu engine yang ringan, konsisten, dan mudah dirawat. V2 adalah sistem utama setelah seluruh pemeriksaan rilis lulus. Daftar tema aktif ditetapkan satu kali di `templates/registry.json`; katalog, validator, dan pengujian wajib mengacu pada daftar tersebut. Tema lama tidak boleh dihapus sebelum data, aset, dan URL aktif diaudit.

## Keputusan yang disepakati

1. Fitur inti aktif secara default; `features.<nama>: false` menonaktifkan fitur.
2. Data/config yang belum lengkap ditangani aman; tidak ada section kosong, tombol palsu, atau status sukses palsu.
3. Logika fitur berada di mesin pusat; JSON mengatur data dan konfigurasi.
4. Demo katalog lengkap dan dapat dicoba. Tanpa endpoint, mode demo menyatakan simulasi dan tidak menyimpan data.
5. Pergantian tema hanya untuk pratinjau `demoMode: true`; tema publik berasal dari data tersimpan.
6. Data baru memakai satu skema V2; adaptor migrasi memetakan variasi lama.
7. RSVP dan buku tamu menggunakan backend bersama, dengan deployment/penyimpanan uji dan produksi terpisah.
8. Repository mesin dan katalog dipisahkan berdasarkan tanggung jawab.

## Komponen

- `core/app.js`: loader, binding data, validasi tema, fitur bersama, formulir, media, dan status error.
- `core/global.css`: reset dan gaya fallback lintas tema.
- `templates/`: seluruh tema dengan identitas visual masing-masing; `templates/registry.json` adalah sumber daftar tema aktif.
- `clients/<slug>/data.json`: sumber data tunggal per pasangan.
- `clients/<slug>/`: aset pasangan.
- `backend/Code.gs`: backend RSVP dan buku tamu.
- `scripts/`: validator data dan tes browser.
- `docs/`: skema data dan checklist rilis.

## Alur runtime

1. Engine memvalidasi slug lalu memuat `data.json`.
2. Status `draft` tidak ditampilkan sebagai undangan publik.
3. Data dipetakan ke perilaku internal yang konsisten.
4. Tema dipilih dari allowlist. Parameter `?theme=` hanya dihormati untuk demo katalog.
5. Engine memastikan bagian fitur yang dibutuhkan, mengikat data, menerapkan `features`, lalu memasang event handler.
6. Endpoint eksternal harus dikonfigurasi eksplisit dan hanya memakai HTTPS.
7. Status sukses RSVP/buku tamu hanya ditampilkan setelah backend mengembalikan `ok: true`.

## Fallback fitur

- Flag fitur `false`: sembunyikan bagian terkait beserta kontrolnya.
- Konten opsional kosong: jangan menampilkan placeholder yang menyesatkan.
- Endpoint produksi belum ada: nonaktifkan pengiriman dan tampilkan alasan.
- Mode demo tanpa endpoint: formulir boleh diuji sebagai simulasi, tetapi harus menyatakan bahwa data tidak dikirim/disimpan.
- Data atau tema invalid: tampilkan error yang ramah dan gunakan hanya fallback yang aman.

## Backend dan keamanan

Satu kontrak API melayani RSVP dan buku tamu. Deployment uji dan produksi menggunakan konfigurasi serta penyimpanan terpisah. URL backend tidak boleh di-hardcode di engine. Server memvalidasi aksi, slug, nama, pesan, jumlah tamu, dan input lain. RSVP/buku tamu hanya menerima slug yang terdaftar dengan status `published` pada tab `Settings`; slug bukan otorisasi admin. Jangan masukkan rahasia atau kredensial ke JSON publik.

## Migrasi dan pembersihan

1. Inventarisasi semua template, data, aset, URL, dan referensi katalog.
2. Pertahankan tema aktif pada registry; hapus hanya kode template lama yang tidak dirujuk.
3. Tandai data lama lewat validator, lalu petakan ke [DATA-SCHEMA.md](DATA-SCHEMA.md).
4. Jangan menghapus data/aset pasangan sebelum memastikan tidak digunakan oleh URL aktif.
5. Hapus dependensi atau file yang tidak dibutuhkan setelah smoke test membuktikan penggantinya.

## Rilis

GitHub Actions menjalankan pemeriksaan sintaks, validasi data V2, dan smoke test Chromium untuk seluruh tema aktif. Tes otomatis tidak menggantikan tes manual. Sebelum merge, selesaikan [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md), termasuk tes RSVP/buku tamu terhadap backend uji dan pemeriksaan desktop/ponsel.
