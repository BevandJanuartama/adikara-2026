# PRD: Product Requirements Document

Produk: KriyaPKK
Versi: 1.0 (tanpa marketplace)
Konteks: ADIKARA 2026, Kompetisi Inovasi (Software) dan Entrepreneur Business Plan

## 1. Ringkasan Produk

KriyaPKK adalah aplikasi web berbasis AI untuk kelompok PKK. Aplikasi ini mencatat setoran sampah anorganik warga, menaksir nilainya, mengelola stok bahan baku, lalu menyarankan kerajinan yang bisa dibuat beserta perhitungan modal, harga jual, dan panduan pengerjaan. Penjualan produk dicatat secara manual, sehingga laba dan arus kas kelompok terpantau.

Posisi produk: kasir setoran sampah ditambah ERP mini ditambah penasihat produksi AI untuk usaha kerajinan limbah kampung.

## 2. Latar Belakang dan Problem

1. Limbah anorganik rumah tangga menumpuk, dibakar, atau dibuang karena belum dikelola dari tingkat kampung.
2. Kelompok PKK kesulitan menentukan produk bernilai jual dari bahan yang tersedia.
3. Pencatatan modal, stok, upah, dan harga jual tidak ada, sehingga untung rugi tidak diketahui.
4. Penilaian harga setoran warga tidak seragam.
5. Aplikasi bank sampah yang ada hanya mencatat setoran dan belum membantu produksi.
6. Biaya berlangganan bulanan memberatkan kelompok PKK.

## 3. Tujuan Produk

1. Menyediakan penilaian setoran yang cepat, adil, dan konsisten.
2. Membantu PKK menentukan produk yang layak dibuat dari stok yang ada.
3. Menghitung modal, upah, harga jual, dan margin secara otomatis.
4. Memberi panduan pengerjaan sehingga keterampilan anggota meningkat.
5. Menyajikan laporan dampak lingkungan dan keuangan yang mudah dipahami.

## 4. Keterkaitan SDG dan Asta Cita

SDG utama: 8 dan 11. SDG pendukung: 9, 4, dan 3. Asta Cita: 6 (utama), 2, dan 4.

## 5. Persona Pengguna

1. Bu Ratna, pengurus PKK, usia 45. Mengelola posko dan keuangan, tidak terbiasa dengan aplikasi rumit, butuh alur singkat dan tulisan besar.
2. Bu Sari, anggota pengrajin, usia 38. Ingin tahu apa yang dikerjakan hari ini dan berapa upahnya.
3. Pak Joko, warga penyetor. Ingin tahu berapa nilai setorannya dan saldonya.
4. Admin platform (tim pengembang). Mengaktifkan mitra dan memantau penggunaan AI.

## 6. Ruang Lingkup

Termasuk dalam versi ini:
1. Pendaftaran mitra, akun anggota, dan peran.
2. Pengaturan tabel harga per kilogram.
3. Setoran dengan scan AI, koreksi manual, dan persetujuan warga.
4. Saldo warga dan stok bahan baku.
5. Generator ide, costing, dan panduan pengerjaan.
6. Produksi dan pencatatan upah anggota.
7. Pencatatan penjualan manual dan stok produk jadi.
8. Buku kas dan laporan laba rugi sederhana.
9. Dashboard dampak.
10. Kuota dan pencatatan penggunaan AI, serta mode manual cadangan.

Tidak termasuk (roadmap):
1. Marketplace, katalog publik, dan checkout online.
2. Ongkir, pengiriman, dan integrasi kurir.
3. Split payment dan payout otomatis.
4. Notifikasi WhatsApp.
5. Sampah organik dan olahan makanan.

## 7. User Stories Utama

1. Sebagai pengurus, saya memotret barang setoran agar jenis dan kondisinya dikenali otomatis.
2. Sebagai pengurus, saya mengatur harga per kilogram agar taksiran konsisten.
3. Sebagai warga, saya melihat taksiran sebelum setuju agar tahu nilai setoran.
4. Sebagai pengurus, saya melihat ide kerajinan dari stok agar tahu apa yang layak dibuat.
5. Sebagai pengurus, saya melihat modal dan harga jual agar usaha tidak rugi.
6. Sebagai anggota, saya mengikuti panduan langkah demi langkah agar hasil rapi.
7. Sebagai anggota, saya melihat upah yang saya terima.
8. Sebagai pengurus, saya mencatat penjualan agar laba dan kas terhitung.
9. Sebagai admin, saya membatasi kuota AI agar biaya terkendali.

## 8. Metrik Keberhasilan

1. Waktu satu setoran dari foto sampai persetujuan kurang dari 2 menit.
2. Akurasi pengenalan jenis barang minimal 80 persen pada uji 20 sampai 30 foto.
3. Seluruh ide yang ditampilkan memiliki stok yang cukup.
4. Waktu respons scan kurang dari 8 detik pada koneksi normal.
5. Dampak per PKK per bulan: kilogram sampah, rupiah ke warga, jumlah produk, dan laba.

## 9. Model Bisnis

1. Biaya aktivasi sekali bayar per kelompok PKK.
2. Paket premium: kuota AI tambahan, laporan lanjutan, ekspor pembukuan.
3. Kemitraan Dana Desa, CSR, dan pemerintah daerah untuk pendaftaran banyak kelompok.
4. Marketplace dengan komisi pada tahap lanjut.

Hal yang wajib dihitung di pitch: biaya AI per mitra per bulan dan titik impas.

## 10. Asumsi dan Ketergantungan

1. Pengurus memiliki ponsel dengan kamera dan internet.
2. Timbangan tersedia di posko dan berat diinput manual.
3. Semua layanan memakai paket gratis, dan batasnya bisa berubah.
4. Harga acuan per kilogram mengikuti harga pengepul setempat.

## 11. Risiko Produk

1. Akurasi AI rendah pada barang campuran. Mitigasi: koreksi manual dan uji validasi.
2. Biaya AI melebihi pendapatan. Mitigasi: kuota, cache, dan model murah.
3. Pengguna awam kesulitan. Mitigasi: tampilan mobile first, huruf besar, alur singkat.
4. Diferensiasi dari aplikasi bank sampah kurang terasa. Mitigasi: fokus pada ide, costing, dan panduan.
5. Barang berbahaya (kaca, logam tajam, bekas bahan kimia). Mitigasi: penandaan tidak layak oleh AI dan aturan keselamatan.

## 12. Rencana Rilis

1. MVP (4 hari): seluruh ruang lingkup bagian 6.
2. Tahap 2: penarikan saldo warga yang lengkap, ekspor laporan, peringatan stok.
3. Tahap 3: marketplace, ongkir, dan payout.
