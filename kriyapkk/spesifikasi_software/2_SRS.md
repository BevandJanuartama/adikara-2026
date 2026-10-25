# SRS: Software Requirements Specification

Produk: KriyaPKK
Versi: 1.0 (tanpa marketplace)

## 1. Pendahuluan

1.1 Tujuan: mendefinisikan kebutuhan perangkat lunak KriyaPKK sebagai acuan pengembangan dan pengujian.
1.2 Lingkup: aplikasi web untuk pencatatan setoran sampah anorganik, stok, ide kerajinan berbasis AI, costing, produksi, penjualan manual, buku kas, dan dashboard dampak.
1.3 Definisi:
1. Mitra: kelompok PKK yang telah diaktivasi.
2. Setoran: transaksi warga menyerahkan barang sisa.
3. Stok: persediaan bahan baku dari setoran.
4. Costing: perhitungan modal, upah, dan harga jual.
5. RLS: Row Level Security pada database.
1.4 Dokumen terkait: PRD, FRD, PMP, WBS.

## 2. Deskripsi Umum

2.1 Perspektif produk: aplikasi web responsif (PWA) dengan satu basis kode Next.js dan backend Supabase.
2.2 Fungsi utama: manajemen mitra dan akun, harga, setoran dan scan AI, stok, ide dan costing, panduan, produksi dan upah, penjualan manual, buku kas, dampak, dan kuota AI.
2.3 Kelas pengguna:
1. Admin platform.
2. Pengurus.
3. Anggota.
4. Warga (opsional, lihat saldo).
2.4 Lingkungan operasi: peramban modern di ponsel dan komputer, koneksi internet seluler.
2.5 Batasan:
1. Seluruh layanan memakai paket gratis atau sandbox.
2. Waktu pengembangan 4 hari.
3. Hanya sampah anorganik.
4. Tanpa marketplace, pengiriman, dan pembayaran online.
2.6 Asumsi: timbangan manual tersedia, pengurus mengisi tabel harga, dan AI hanya skrining awal.

## 3. Arsitektur Sistem

1. Klien: Next.js (App Router) dengan Tailwind dan shadcn/ui, PWA.
2. Server: Server Actions dan Route Handlers di Vercel.
3. Lapisan layanan: deposit, stock, costing, sales, ledger.
4. Modul AI: prompt, skema Zod, cache, kuota, dan fallback.
5. Data: Supabase Postgres dengan RLS, Auth, dan Storage.
6. Eksternal: Gemini API (utama), OpenRouter (cadangan).

## 4. Antarmuka Eksternal

4.1 Antarmuka pengguna: mobile first, huruf besar, tombol besar, alur maksimal tiga langkah untuk tugas utama, bahasa Indonesia.
4.2 Antarmuka perangkat keras: kamera ponsel. Timbangan tidak terintegrasi, berat diinput manual.
4.3 Antarmuka perangkat lunak:
1. Gemini API untuk analisis gambar dan pembuatan teks dengan keluaran JSON.
2. OpenRouter sebagai cadangan teks.
3. Supabase Auth, Database, dan Storage.
4.4 Antarmuka komunikasi: HTTPS.

## 5. Kebutuhan Fungsional

Rincian lengkap ada pada dokumen FRD. Ringkasan modul:
1. Mitra dan akun (FR01 sampai FR04).
2. Pengaturan harga dan upah (FR05 sampai FR06).
3. Setoran dan scan (FR07 sampai FR14).
4. Stok (FR15 sampai FR17).
5. Ide dan costing (FR18 sampai FR23).
6. Produksi (FR24 sampai FR26).
7. Penjualan manual (FR27 sampai FR28).
8. Keuangan (FR29 sampai FR31).
9. Dampak (FR32).
10. AI dan kuota (FR33 sampai FR35).
11. Admin platform (FR36 sampai FR37).

## 6. Kebutuhan Data

Entitas utama:
1. groups: id, nama, alamat, status aktivasi, tanggal aktivasi.
2. profiles: id, group_id, nama, peran, status aktif.
3. residents: id, group_id, nama, nomor HP, saldo.
4. price_table: id, group_id, jenis barang, harga per kg, aktif.
5. deposits: id, group_id, resident_id, foto, jenis, kondisi, berat, harga, total, status.
6. stock: id, group_id, jenis, jumlah kg, nilai rata rata.
7. ideas: id, group_id, judul, bahan, alat, bahan tambahan, modal, harga jual, margin, panduan, hash cache.
8. production_batches: id, group_id, idea_id, jumlah, status, tanggal.
9. wages: id, batch_id, member_id, jumlah.
10. finished_goods: id, group_id, batch_id, nama, jumlah, harga jual.
11. sales: id, group_id, finished_good_id, jumlah, harga, pembeli, tanggal.
12. cash_ledger: id, group_id, tipe, kategori, jumlah, referensi, tanggal.
13. ai_usage: id, group_id, fungsi, token, tanggal.
14. ai_cache: hash, fungsi, hasil JSON, tanggal.

Aturan data:
1. Semua tabel bertenant memiliki group_id dan dilindungi RLS.
2. Perubahan saldo, stok, dan kas dilakukan dalam satu transaksi database.
3. Data keuangan tidak dihapus, hanya dibatalkan dengan catatan koreksi.

## 7. Kebutuhan Non Fungsional

Kinerja:
1. NFR01: scan satu foto selesai kurang dari 8 detik pada koneksi normal.
2. NFR02: halaman daftar dimuat kurang dari 3 detik.
3. NFR03: foto dikompres di klien maksimal sekitar 768 piksel sebelum diunggah.

Keamanan:
4. NFR04: API key hanya di server.
5. NFR05: RLS aktif pada seluruh tabel, data antar kelompok terisolasi.
6. NFR06: foto diakses melalui signed URL.
7. NFR07: validasi input di server dengan Zod.
8. NFR08: peran membatasi akses fitur (pengurus, anggota, admin).

Keandalan:
9. NFR09: panggilan AI memiliki timeout dan satu kali ulang, lalu beralih ke input manual.
10. NFR10: operasi saldo, stok, dan kas bersifat atomik.

Kegunaan:
11. NFR11: antarmuka bahasa Indonesia, kontras tinggi, huruf minimal 16 piksel.
12. NFR12: tugas utama selesai dalam maksimal tiga langkah.

Efisiensi AI:
13. NFR13: hasil scan dan ide disimpan di cache.
14. NFR14: kuota AI per kelompok per hari dapat diatur.
15. NFR15: ringkasan stok yang dikirim ke AI berupa teks pendek, bukan data mentah.
16. NFR16: panduan detail dibuat hanya saat ide dipilih.
17. NFR17: keluaran AI dibatasi skema JSON dan max tokens.

Biaya:
18. NFR18: seluruh layanan memakai paket gratis atau sandbox.

Portabilitas:
19. NFR19: berjalan di Chrome dan Safari versi terbaru pada Android dan iOS, serta komputer.

## 8. Kebutuhan Kualitas dan Pengujian

1. Pengujian unit untuk perhitungan harga, costing, dan ledger.
2. Pengujian integrasi untuk alur setoran sampai stok.
3. Pengujian RLS untuk memastikan isolasi data kelompok.
4. Pengujian akurasi scan AI pada 20 sampai 30 foto nyata.
5. Pengujian kegunaan dengan minimal satu pengguna awam.

## 9. Kriteria Penerimaan Sistem

1. Setoran dari foto sampai saldo warga dan stok berhasil dalam satu alur.
2. Ide yang tampil hanya yang stoknya cukup, dengan modal dan harga jual terhitung.
3. Penjualan manual memperbarui stok produk jadi dan buku kas.
4. Dashboard menampilkan kilogram sampah, rupiah ke warga, produk terjual, dan laba.
5. Saat AI gagal, pengurus tetap dapat menyelesaikan setoran secara manual.
6. Data kelompok A tidak dapat dibaca oleh kelompok B.

## 10. Lampiran: Ringkasan Perhitungan

1. Total setoran: berat dikali harga per kg dari tabel harga.
2. Modal produk: nilai bahan dari stok ditambah bahan tambahan ditambah alat (porsi) ditambah upah.
3. Harga jual: modal dikali (1 ditambah margin), dibulatkan ke kelipatan Rp500.
4. Laba: pendapatan penjualan dikurangi modal.
