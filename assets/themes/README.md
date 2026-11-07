# Omah Aksara — pustaka aset dekoratif tema

Pustaka bersama untuk aset visual tema undangan. Simpan aset di sini agar tema dapat memakai satu sumber lokal dan tidak perlu menyalin SVG ke folder tema masing-masing.

## Struktur

- `frames/`: bingkai, jendela, arch, panel (Jawa, Sunda, Melayu, klasik).
- `ornaments/`: gunungan, wayang, floral, divider, cloud-wave, botanical, crescent/star, corner ornament.
- `patterns/`: motif berulang seperti kawung, parang, dan tenun geometris orisinal.
- `wayang/`: ilustrasi wayang SVG beserta atribusi lisensi.

## Aturan

1. Gunakan path lokal `/assets/themes/...`, jangan hotlink.
2. Pertahankan rasio, transparansi, dan viewBox SVG.
3. Jangan memasukkan SVG dengan script, event handler, foreignObject, atau referensi eksternal.
4. Aset bermerek/berlisensi harus mencantumkan sumber, pencipta, dan lisensi pada `ATTRIBUTION.md`.
5. Aset hanya pustaka; jangan otomatis menempelkan dekorasi ke semua tema. Pilih sesuai karakter tema dan periksa tampilan mobile/performa.
6. Untuk ilustrasi budaya, jangan mengubah simbol sakral menjadi ornamen sembarangan atau mengklaim ilustrasi generik sebagai artefak tradisional asli.

## Aset orisinal Omah Aksara

File SVG di `frames/`, `ornaments/`, dan `patterns/` yang diberi label Original Omah Aksara adalah gambar vektor dekoratif orisinal yang dibuat khusus untuk pustaka ini.


Aset orisinal tambahan: `frames/jendela-klasik.svg`, `ornaments/wayang-gunungan.svg`, `ornaments/floral-divider.svg`, `patterns/parang-repeat.svg`, dan `ornaments/keris-motif.svg`.

## Pustaka dekorasi bersama
Aset tambahan yang sudah tersedia di `/assets/ornaments/` dapat dipakai tanpa menyalin ke folder tema: gunungan, jendela Jawa, batik parang, floral divider, arch Islami, frame corners, daun, melati, ukiran Bali, dan geometri Islami. Daftar lengkap ada di `/assets/ornaments/manifest.json`.

Total saat ini: 4 bingkai, 9 ornamen tema, 3 pola, 3 ilustrasi wayang berlisensi, ditambah 10 ornamen bersama. Aset ini tidak otomatis ditempel ke tema; pilih sesuai karakter tema agar tidak membuat tampilan penuh dekorasi.
