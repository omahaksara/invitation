# Kompatibilitas logo bank demo

Folder ini dipertahankan agar data undangan lama yang masih memakai path relatif `bank/logo-*.svg` tetap terbaca.

- BCA dan Mandiri sudah diganti dengan logo sumber yang benar.
- Path bersama yang disarankan untuk data baru: `/assets/payment/banks/<nama>.svg` atau `/assets/payment/wallets/<nama>.svg`.
- Jangan menambahkan file logo contoh/teks tiruan sebagai pengganti logo resmi.
- Untuk semua tema, cukup atur `gifts.accounts[].logo`; engine inti akan memuat file lokal tersebut.
