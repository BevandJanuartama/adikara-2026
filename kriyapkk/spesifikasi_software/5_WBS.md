# WBS: Work Breakdown Structure

Proyek: KriyaPKK (tanpa marketplace)

Keterangan estimasi: jam kerja orang (jam). Peran: LEAD (project lead dan backend), FE (frontend dan UX), AI (AI engineer), DOC (dokumentasi dan bisnis). Prioritas: M wajib, S sebaiknya, C tahap lanjut.

## 1.0 Manajemen Proyek

1.1 Perencanaan (LEAD, 2 jam)
1.1.1 Finalisasi lingkup dan pembagian peran
1.1.2 Penyiapan papan tugas dan repositori

1.2 Pemantauan harian (LEAD, 2 jam)
1.2.1 Rapat awal dan akhir hari
1.2.2 Laporan status harian

1.3 Pengelolaan risiko dan perubahan (LEAD, 1 jam)

## 2.0 Fondasi Teknis (Hari 1)

2.1 Setup proyek (LEAD, 2 jam)
2.1.1 Inisialisasi Next.js, TypeScript, Tailwind, shadcn/ui
2.1.2 Konfigurasi variabel lingkungan dan deploy awal Vercel

2.2 Setup Supabase (LEAD, 3 jam)
2.2.1 Skema tabel sesuai SRS
2.2.2 Kebijakan RLS per group_id
2.2.3 Konfigurasi Storage untuk foto

2.3 Autentikasi dan peran (LEAD, 3 jam)
2.3.1 Login dan logout
2.3.2 Peran pengurus, anggota, admin
2.3.3 Penjaga rute berdasarkan peran

2.4 Kerangka UI (FE, 4 jam)
2.4.1 Layout mobile first dan navigasi
2.4.2 Komponen dasar (form, tabel, kartu, dialog)

## 3.0 Modul Mitra dan Pengaturan

3.1 Pendaftaran dan aktivasi mitra, FR01 dan FR02 (LEAD, 3 jam, M)
3.2 Kelola anggota, FR03 (LEAD dan FE, 3 jam, M)
3.3 Tabel harga dengan template jenis, FR05 (FE, 3 jam, M)
3.4 Pengaturan upah dan margin, FR06 (FE, 2 jam, M)

## 4.0 Modul Setoran dan Scan (Hari 1 sampai 2)

4.1 Data warga, FR14 (FE, 2 jam, M)
4.2 Unggah foto dan kompresi klien, FR07 (FE, 3 jam, M)
4.3 Integrasi AI Vision, FR08 (AI, 6 jam, M)
4.3.1 Prompt dan skema Zod
4.3.2 Endpoint scan, timeout, dan satu kali ulang
4.3.3 Penandaan barang berbahaya
4.4 Koreksi manual hasil AI, FR09 (FE, 3 jam, M)
4.5 Input berat dan taksiran harga, FR10 (FE dan LEAD, 3 jam, M)
4.6 Persetujuan warga dan transaksi saldo serta stok, FR11 dan FR12 (LEAD, 4 jam, M)
4.7 Pembayaran dan penarikan saldo, FR13 (LEAD, 2 jam, S)

## 5.0 Modul Stok

5.1 Daftar stok dan nilai rata rata, FR15 (FE dan LEAD, 3 jam, M)
5.2 Pengurangan stok saat produksi, FR16 (LEAD, 1 jam, M)
5.3 Peringatan stok, FR17 (FE, 2 jam, C)

## 6.0 Modul Ide dan Costing (Hari 2)

6.1 Template ide, FR23 (AI dan DOC, 4 jam, S)
6.2 Generator ide dari ringkasan stok, FR18 dan FR19 (AI, 6 jam, M)
6.2.1 Pembuatan ringkasan stok pendek
6.2.2 Prompt, skema, dan filter stok cukup
6.3 Perhitungan modal dan harga jual, FR20 dan FR21 (LEAD dan FE, 5 jam, M)
6.4 Panduan pengerjaan lazy dengan cache, FR22 (AI, 4 jam, M)
6.5 Halaman ide dan detail (FE, 4 jam, M)

## 7.0 Modul Produksi

7.1 Buat batch produksi, FR24 (LEAD dan FE, 4 jam, M)
7.2 Catat hasil produksi, FR25 (FE, 3 jam, M)
7.3 Upah anggota, FR26 (LEAD dan FE, 3 jam, M)

## 8.0 Modul Penjualan dan Keuangan (Hari 3)

8.1 Stok produk jadi, FR28 (FE, 2 jam, M)
8.2 Catat penjualan manual, FR27 (LEAD dan FE, 3 jam, M)
8.3 Buku kas, FR29 (LEAD dan FE, 4 jam, M)
8.4 Laporan laba rugi sederhana, FR30 (LEAD dan FE, 3 jam, M)
8.5 Ekspor CSV, FR31 (FE, 2 jam, S)

## 9.0 Dashboard dan Admin

9.1 Dashboard dampak, FR32 (FE, 5 jam, M)
9.2 Panel admin: kelola mitra, FR36 (LEAD, 3 jam, M)
9.3 Pantau penggunaan AI, FR37 (LEAD, 2 jam, S)

## 10.0 AI Lintas Modul

10.1 Kuota AI dan pencatatan ai_usage, FR33 (AI, 3 jam, M)
10.2 Cache hasil AI, FR35 (AI, 3 jam, M)
10.3 Mode manual cadangan, FR34 (AI dan FE, 3 jam, M)
10.4 Provider cadangan OpenRouter (AI, 2 jam, S)

## 11.0 Pengujian dan Validasi (Hari 3 sampai 4)

11.1 Pengujian unit perhitungan harga, costing, dan ledger (LEAD, 3 jam)
11.2 Pengujian integrasi alur setoran, produksi, dan penjualan (LEAD dan FE, 3 jam)
11.3 Pengujian RLS dua kelompok (LEAD, 2 jam)
11.4 Uji akurasi scan pada 20 sampai 30 foto (AI dan DOC, 4 jam)
11.5 Uji kegunaan dengan pengguna awam (FE dan DOC, 2 jam)
11.6 Perbaikan bug (semua, 6 jam)

## 12.0 Dokumentasi dan Pitch (Hari 4)

12.1 Finalisasi PRD, SRS, FRD, PMP, dan WBS (DOC, 4 jam)
12.2 Perhitungan bisnis: biaya AI per mitra dan titik impas (DOC, 3 jam)
12.3 Data demo dan skenario demo (DOC dan LEAD, 3 jam)
12.4 Video demo (DOC dan FE, 4 jam)
12.5 Slide pitch dan latihan presentasi (DOC dan semua, 5 jam)

## 13.0 Rilis

13.1 Deploy produksi dan pengecekan variabel lingkungan (LEAD, 2 jam)
13.2 Pemeriksaan akhir alur demo di ponsel (semua, 2 jam)
13.3 Pengumpulan berkas lomba (DOC, 1 jam)

## Ringkasan Beban per Hari

Hari 1: bagian 1.0, 2.0, 3.0, 4.1 sampai 4.5. Milestone M1: setoran sampai stok.
Hari 2: bagian 4.6, 4.7, 5.0, 6.0, 7.0, 10.0. Milestone M2: ide, costing, produksi.
Hari 3: bagian 8.0, 9.0, 11.1 sampai 11.3. Milestone M3: alur sampai laba dan dashboard.
Hari 4: bagian 11.4 sampai 11.6, 12.0, 13.0. Milestone M4: aplikasi live, video, dan pitch.

## Prioritas Pemotongan Bila Waktu Kurang

Dipotong lebih dahulu: 5.3, 8.5, 9.3, 10.4, 4.7, 6.1.
Dipertahankan: alur setoran, stok, ide dan costing, produksi, penjualan manual, buku kas, dashboard dampak, kuota AI, dan mode manual.
