# Omah Aksara — Music Library

Perpustakaan audio bersama untuk seluruh tema dan undangan. File disimpan satu kali di sini, bukan disalin ke setiap folder klien.

## Struktur

- `manifest.json`: katalog metadata track.
- `wedding-demo-existing.mp3`: aset musik lama yang sebelumnya tersalin identik ke folder `budi-ani` dan `demo-katalog`.

## Memilih musik untuk undangan

Isi `media.music` pada `clients/<slug>/data.json` dengan objek:

```json
{
  "media": {
    "music": {
      "id": "wedding-demo-existing",
      "title": "Wedding Demo Track",
      "category": "instrumental",
      "src": "../../assets/music/library/wedding-demo-existing.mp3"
    }
  }
}
```

Engine tetap menerima format lama `"music": "musik.mp3"` dan objek `{ "src": "..." }`. Path relatif dihitung dari folder klien, sehingga `../../assets/...` menunjuk ke pustaka bersama pada GitHub Pages maupun domain produksi.

## Menambahkan track

1. Pastikan file audio merupakan karya sendiri atau memiliki izin/lisensi yang mencakup penggunaan pada undangan pelanggan.
2. Gunakan nama file yang stabil, deskriptif, huruf kecil, dan tanpa spasi.
3. Simpan file di folder ini dan tambahkan metadata ke `manifest.json`.
4. Pilih track pada `media.music` di JSON undangan.
5. Uji pemutaran setelah tombol Open Invitation ditekan, kontrol play/pause, loop, dan ukuran file di perangkat mobile.

## Status aset saat ini

Track lama dipindahkan secara fisik pada level Git tanpa mengunduh atau mengode ulang file. Dua salinan lama memiliki blob yang sama, sehingga satu file kanonis cukup. Identitas lagu dan hak penggunaan belum diverifikasi; statusnya `review-required` dan track ini hanya untuk pengujian internal sampai izin penggunaannya dipastikan.

Jangan memasukkan lagu komersial berhak cipta ke katalog pelanggan tanpa izin yang sesuai. Browser juga dapat menolak autoplay; pemutaran harus dipicu oleh interaksi pengguna.
