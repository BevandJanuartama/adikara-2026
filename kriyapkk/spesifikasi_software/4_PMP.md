# PMP: Project Management Plan

Proyek: KriyaPKK
Versi: 1.0 (tanpa marketplace)

## 1. Ikhtisar Proyek

1.1 Latar belakang: pengembangan aplikasi untuk Kompetisi Inovasi (Software) dan Entrepreneur Business Plan ADIKARA 2026, tema Shaping a Resilient Future through Digital Transformation.
1.2 Tujuan: menghasilkan MVP KriyaPKK yang berfungsi, dilengkapi dokumen, demo, dan bahan pitch dalam 4 hari kerja.
1.3 Hasil akhir (deliverable):
1. Aplikasi web yang dapat diakses lewat tautan.
2. Dokumen PRD, SRS, FRD, PMP, dan WBS.
3. Data demo dan skenario demo.
4. Video demo dan bahan pitch (slide, ringkasan dampak, perhitungan bisnis).
5. Laporan validasi akurasi scan AI.

## 2. Lingkup dan Batasan

Masuk lingkup: seluruh fitur MVP pada FRD (FR01 sampai FR37 sesuai prioritas M dan S yang memungkinkan).
Di luar lingkup: marketplace, ongkir, pembayaran online, payout, notifikasi WhatsApp, dan sampah organik.

Batasan:
1. Waktu: 4 hari kerja efektif karena anggota masih kuliah.
2. Biaya: Rp0, memakai paket gratis dan sandbox.
3. Teknologi: Next.js, Supabase, Gemini API.
4. Persyaratan lomba: SDG 3, 4, 7, 8, 9, 11 dan Asta Cita 2, 4, 6.

## 3. Pemangku Kepentingan

1. Tim pengembang: pelaksana proyek.
2. Dosen pembimbing atau mentor: pemberi arahan (bila ada).
3. Panitia dan juri ADIKARA: penilai.
4. Calon pengguna (pengurus dan anggota PKK): sumber validasi.
5. Calon mitra (desa, CSR, pemerintah daerah): sasaran bisnis.

## 4. Organisasi dan Peran

Asumsi tim 3 sampai 4 orang. Bila tim lebih kecil, peran digabung.
1. Project lead dan backend: arsitektur, database, RLS, layanan bisnis.
2. Frontend dan UX: antarmuka mobile first, alur pengguna.
3. AI engineer: prompt, skema, cache, kuota, uji akurasi.
4. Dokumentasi dan bisnis: dokumen, perhitungan bisnis, pitch, video.

## 5. Jadwal dan Milestone

Hari 1: fondasi dan setoran
1. Setup repositori, Next.js, Supabase, autentikasi, dan peran.
2. Skema database dan RLS.
3. Tabel harga, setoran, scan AI, koreksi manual, saldo, dan stok.
Milestone M1: satu setoran lengkap dari foto sampai stok berhasil.

Hari 2: ide, costing, dan produksi
1. Generator ide, template, dan cache.
2. Perhitungan modal dan harga jual.
3. Panduan pengerjaan, batch produksi, dan upah.
4. Kuota AI dan mode manual cadangan.
Milestone M2: stok sampai ide, modal, dan produksi berjalan.

Hari 3: penjualan, keuangan, dan dampak
1. Penjualan manual dan stok produk jadi.
2. Buku kas dan laporan laba rugi.
3. Dashboard dampak dan panel admin.
4. Pengujian RLS dan alur utama.
Milestone M3: alur setoran sampai laba terlihat di dashboard.

Hari 4: poles, demo, dan pitch
1. Perapian tampilan dan perbaikan bug.
2. Data demo dan uji akurasi AI.
3. Deploy produksi, video demo.
4. Bahan pitch dan perhitungan bisnis.
Milestone M4: aplikasi live, video selesai, pitch siap.

## 6. Anggaran

Total biaya tunai: Rp0.
1. Hosting: Vercel paket gratis.
2. Database dan penyimpanan: Supabase paket gratis.
3. AI: Gemini API paket gratis.
4. Peta atau geocoding tidak diperlukan pada versi ini.
5. Desain: komponen sumber terbuka.
Catatan: batas paket gratis dapat berubah, sehingga perlu dicek sebelum pengembangan. Biaya waktu tim tidak dihitung sebagai biaya tunai.

## 7. Manajemen Risiko

1. Waktu tidak cukup. Dampak tinggi. Mitigasi: prioritas M dahulu, fitur S dikerjakan bila sisa waktu, potong lingkup di hari 3.
2. Batas paket gratis AI tercapai saat demo. Mitigasi: cache, kuota, model cadangan, mode manual, dan data demo yang sudah tersimpan.
3. Akurasi scan rendah. Mitigasi: koreksi manual, uji 20 sampai 30 foto, tampilkan keterbatasan dengan jujur.
4. Bug RLS membocorkan data. Mitigasi: uji dua kelompok sebelum demo.
5. Layanan pihak ketiga gangguan. Mitigasi: rekaman video demo sebagai cadangan.
6. Anggota berhalangan karena kuliah. Mitigasi: peran saling menggantikan, pekerjaan dibagi per modul.
7. Biaya AI tidak menutup pendapatan. Mitigasi: hitung titik impas, kuota, dan paket premium.

## 8. Manajemen Komunikasi

1. Rapat singkat 15 menit di awal dan akhir tiap hari.
2. Kanal obrolan grup untuk koordinasi harian.
3. Papan tugas (misalnya GitHub Projects atau Trello) berdasarkan WBS.
4. Repositori Git dengan cabang per fitur dan penggabungan lewat pull request.
5. Laporan status singkat di akhir hari: selesai, kendala, rencana berikutnya.

## 9. Manajemen Kualitas

1. Definisi selesai: fitur berjalan, lolos uji manual, dan tidak merusak alur utama.
2. Pengujian unit untuk perhitungan harga, costing, dan ledger.
3. Pengujian integrasi alur setoran, produksi, dan penjualan.
4. Pengujian RLS antar kelompok.
5. Uji kegunaan dengan minimal satu pengguna awam.
6. Uji akurasi AI pada sampel foto nyata dan dicatat hasilnya.

## 10. Manajemen Perubahan

1. Perubahan lingkup diajukan di rapat harian dan disetujui project lead.
2. Fitur baru hanya diterima bila menggantikan fitur lain yang sebanding.
3. Fitur di luar MVP masuk daftar roadmap.

## 11. Manajemen Pengadaan

Tidak ada pengadaan berbayar. Seluruh layanan memakai paket gratis atau sandbox. Pembuatan akun layanan dilakukan pada hari 1.

## 12. Kriteria Keberhasilan Proyek

1. Seluruh fitur prioritas M berjalan.
2. Demo alur setoran, ide, produksi, penjualan, dan dampak berjalan tanpa gangguan.
3. Dokumen lengkap dan konsisten dengan produk.
4. Laporan validasi AI tersedia.
5. Perhitungan bisnis (biaya AI per mitra dan titik impas) tersedia untuk pitch.

## 13. Rencana Setelah Lomba

1. Uji coba lapangan di satu kelompok PKK.
2. Penyempurnaan berdasarkan masukan.
3. Pengembangan marketplace, ongkir, dan payout.
4. Penjajakan kemitraan desa dan CSR.
