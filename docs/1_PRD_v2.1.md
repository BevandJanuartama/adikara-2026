# PRD: Product Requirements Document

Produk: KriyaPKK
Versi: 2.1 (diselaraskan dengan kode commit `aa876a4`, 1 November 2026, dan aplikasi live; diverifikasi 10 November 2026)
Menggantikan: PRD 1.0 (25 Oktober 2026, "tanpa marketplace")
Konteks: ADIKARA 2026, Kompetisi Inovasi (Software) dan Entrepreneur Business Plan

## 1. Ringkasan produk

KriyaPKK adalah aplikasi web berbasis AI untuk kelompok PKK. Aplikasi mencatat setoran sampah anorganik warga, menaksir nilainya dari tabel harga, mengelola stok bahan, menyarankan kerajinan yang bisa dibuat beserta modal, harga jual, dan panduan, lalu membantu menjual produk lewat penjualan langsung di posko dan toko online. Laba, kas, dan dampak lingkungan terpantau.

Posisi: kasir setoran sampah, ERP mini, penasihat produksi AI, dan toko online untuk usaha kerajinan limbah kampung.

## 2. Latar belakang dan masalah

1. Limbah anorganik rumah tangga menumpuk, dibakar, atau dibuang karena belum dikelola dari kampung.
2. Kelompok PKK sulit menentukan produk bernilai jual dari bahan yang ada.
3. Modal, stok, upah, dan harga jual tidak tercatat, sehingga untung rugi tidak diketahui.
4. Penilaian harga setoran warga tidak seragam.
5. Aplikasi bank sampah yang ada hanya mencatat setoran dan belum membantu produksi dan penjualan.
6. Biaya langganan bulanan memberatkan kelompok PKK.
7. Pemasaran produk di luar lingkungan sendiri sulit.

## 3. Tujuan produk

1. Penilaian setoran yang cepat, adil, dan konsisten.
2. Menentukan produk yang layak dari stok yang ada.
3. Menghitung modal, upah, harga jual, dan margin otomatis.
4. Memberi panduan pengerjaan.
5. Menjual produk di luar kampung dengan ongkir dan pembayaran yang jelas.
6. Menyajikan laporan dampak lingkungan dan keuangan.

## 4. Keterkaitan SDG dan Asta Cita

SDG utama: 8 dan 11. Pendukung: 9, 4, 3. Asta Cita: 6 (utama), 2, 4. (Persyaratan lomba: SDG 3, 4, 7, 8, 9, 11 dan Asta Cita 2, 4, 6.)

## 5. Persona pengguna

1. **Bu Ratna, pengurus PKK, 45 tahun.** Mengelola posko dan keuangan; butuh alur singkat dan tulisan besar.
2. **Bu Sari, anggota perajin, 38 tahun.** Ingin tahu apa yang dikerjakan hari ini dan berapa upahnya.
3. **Pak Joko, warga penyetor.** Ingin tahu nilai setorannya. *Catatan: warga tidak punya akun; pengurus yang menyampaikan nilai dan saldo.*
4. **Admin platform (tim pengembang).** Mengaktifkan mitra, mengatur kuota AI, mencatat pencairan dana.
5. **Mbak Dina, pembeli (baru).** Menelusuri katalog dari ponsel, membeli, membayar QRIS atau transfer virtual account, dan memantau pesanan sampai resi.

## 6. Ruang lingkup

### 6.1 Sudah ada

1. Pendaftaran mitra, aktivasi admin, akun anggota, empat peran.
2. Tabel harga per kg, upah, dan margin.
3. Setoran dengan scan AI, koreksi manual, persetujuan warga (masuk saldo atau tunai).
4. Saldo warga dan stok bahan (nilai rata-rata tertimbang).
5. Generator ide (AI atau 13 template), costing, panduan (dengan mode suara).
6. Produksi, hasil, unit gagal, dan upah anggota.
7. Penjualan langsung, stok produk jadi, buku kas append-only, laba rugi, ekspor CSV buku kas.
8. Dashboard dampak (termasuk tren bulanan).
9. Kuota dan cache AI, mode manual saat AI gagal.
10. Profil toko dan rekening posko; manajemen produk; katalog publik.
11. Akun pembeli, keranjang, checkout; ongkir manual (atau Biteship); pembayaran Midtrans Snap; webhook dan sinkronisasi status.
12. Satu notifikasi WhatsApp ke posko saat pesanan lunas.
13. Pesanan saya (pembeli) dan Pesanan online (pengurus) dengan nomor resi; pesanan kedaluwarsa otomatis.
14. Saldo dana online dan pencatatan pencairan oleh admin.
15. Halaman privasi dan persetujuan saat mendaftar.

### 6.2 Sebagian

- Ekspor: hanya buku kas.
- Pantau AI: panggilan dan token, tanpa estimasi biaya.
- Template ide: 13 buah, hanya sebagai mode manual.

### 6.3 Rencana (belum ada)

1. Komisi platform 5% otomatis dan pembagian dana 95:5.
2. Pencairan otomatis (Midtrans Iris atau split pembayaran).
3. Pelacakan resi lewat API kurir; kurir lokal atau COD.
4. Pembatalan dan pengembalian dana pesanan terbayar dari aplikasi.
5. Rating dan ulasan; edit profil pembeli; hapus akun mandiri.
6. Peringatan stok menumpuk atau menipis.
7. Mode luring.
8. Marketplace lintas kelompok dengan satu keranjang untuk banyak posko (saat ini satu pesanan per posko).

### 6.4 Di luar lingkup

Sampah organik dan olahan makanan pada setoran (katalog menerima kategori kuliner dan pupuk; kebijakan perlu diputuskan, lihat BRD).

## 7. User story utama

| No | Sebagai | Saya ingin | Status |
|---|---|---|---|
| 1 | Pengurus | Memotret barang setoran agar jenis dan kondisinya dikenali | Ada |
| 2 | Pengurus | Mengatur harga per kg agar taksiran konsisten | Ada |
| 3 | Pengurus (atas nama warga) | Melihat taksiran sebelum setuju | Ada |
| 4 | Pengurus | Melihat ide kerajinan dari stok | Ada |
| 5 | Pengurus | Melihat modal dan harga jual agar tidak rugi | Ada |
| 6 | Anggota | Mengikuti panduan langkah demi langkah, termasuk lewat suara | Ada |
| 7 | Anggota | Melihat upah yang saya terima | Ada |
| 8 | Pengurus | Mencatat penjualan agar laba dan kas terhitung | Ada |
| 9 | Admin | Membatasi kuota AI agar biaya terkendali | Ada |
| 10 | Pengurus | Menayangkan produk di katalog dan menerima pesanan online | Ada |
| 11 | Pembeli | Membayar dengan QRIS atau virtual account dan melihat nomor resi | Ada |
| 12 | Pengurus | Mendapat WhatsApp saat pesanan lunas | Ada |
| 13 | Admin | Mencatat pencairan dana online ke rekening posko | Ada |
| 14 | Warga | Melihat saldo sendiri di aplikasi | Belum (warga tanpa akun) |
| 15 | Pengurus | Peringatan stok menipis | Belum |

## 8. Metrik keberhasilan

Semua target berikut **belum diukur**; belum ada data uji lapangan.

| Metrik | Target |
|---|---|
| Waktu satu setoran dari foto sampai persetujuan | Kurang dari 2 menit |
| Akurasi jenis barang pada 20 sampai 30 foto | Minimal 80% |
| Seluruh ide di bagian atas memiliki stok cukup | 100% (dijamin oleh pemfilteran kapasitas) |
| Respons scan | Kurang dari 8 detik |
| Dampak per posko per bulan | Kg sampah, rupiah ke warga, produk, laba (tersedia di dashboard) |
| Kepuasan pengguna | SUS di atas 75 |

## 9. Model bisnis

| Sumber | Status |
|---|---|
| Biaya aktivasi sekali bayar (rencana Rp250.000 per kelompok; angka tim, belum bersumber) | Rencana. Aktivasi manual oleh admin; belum ada pembayaran di aplikasi |
| Komisi platform 5% dari produk terjual | **Rencana tahap lanjut.** Belum ada di kode: dana online masuk penuh ke saldo posko |
| Paket premium (kuota AI tambahan, laporan lanjutan, ekspor) | Rencana |
| Kemitraan Dana Desa, CSR, pemerintah daerah | Rencana |

Perhitungan wajib untuk pitch: biaya AI per mitra per bulan dan titik impas (BRD bagian 8).

## 10. Asumsi dan ketergantungan

1. Pengurus memiliki ponsel dengan kamera dan internet.
2. Timbangan tersedia; berat diinput manual.
3. Layanan pihak ketiga memakai paket gratis atau sandbox pada tahap lomba; batasnya dapat berubah.
4. Harga acuan mengikuti harga pengepul setempat.
5. Pengurus memesan ekspedisi dan mengisi nomor resi.
6. Midtrans produksi memerlukan verifikasi bisnis oleh pengelola platform.

## 11. Risiko produk

| Risiko | Mitigasi |
|---|---|
| Akurasi AI rendah pada barang campuran | Koreksi manual, uji validasi (belum dilakukan) |
| Biaya AI melebihi pendapatan | Kuota, cache, model murah |
| Pengguna awam kesulitan | Mobile first, huruf besar, alur singkat |
| Diferensiasi dari bank sampah kurang terasa | Fokus pada ide, costing, panduan, dan toko |
| Barang berbahaya | Penandaan tidak layak oleh AI; keputusan akhir pengurus |
| Penyalahgunaan endpoint publik | Belum ada pembatasan laju (rencana) |
| Pembayaran produksi dan regulasi | Sandbox pada tahap lomba; pencairan manual |
| Kategori kuliner di katalog terkait izin P-IRT | Perlu keputusan tim |

## 12. Rencana rilis

| Tahap | Isi | Status |
|---|---|---|
| MVP inti (25 Okt) | Setoran, stok, ide, costing, produksi, penjualan langsung, kas, dampak, kuota AI | Selesai |
| Marketplace (28 Okt) | Katalog, keranjang, checkout, ongkir, Midtrans | Selesai |
| Akun pembeli dan pelacakan (1 Nov) | Akun pembeli, resi wajib, dana online dan pencairan | Selesai |
| Berikutnya | Uji lapangan, uji akurasi AI, pembatasan laju, komisi, pencairan otomatis, peringatan stok | Rencana |

## Riwayat revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 25 Okt 2026 | Versi awal, tanpa marketplace |
| 2.0 | 9 Nov 2026 | Ruang lingkup tiga tingkat; persona pembeli; user story 10 sampai 15; komisi 5% dipindah ke rencana; metrik ditandai belum diukur |
| 2.1 | 10 Nov 2026 | Biaya aktivasi ditandai belum bersumber; diverifikasi ulang terhadap web live |
