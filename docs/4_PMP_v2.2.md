# PMP: Project Management Plan

Proyek: KriyaPKK
Versi: 2.0 (rencana awal ditambah realisasi sampai 1 November 2026)
Menggantikan: PMP 1.0 (25 Oktober 2026, "tanpa marketplace", 4 hari)

Sumber realisasi: riwayat git repositori `adikara-2026` (14 commit, 25 Oktober sampai 1 November 2026). Jam kerja dan rapat tidak tercatat, sehingga tidak dilaporkan.

## 1. Ikhtisar proyek

1.1 Latar belakang: aplikasi untuk Kompetisi Inovasi (Software) dan Entrepreneur Business Plan ADIKARA 2026, tema *Shaping a Resilient Future through Digital Transformation*.

1.2 Tujuan: MVP KriyaPKK yang berfungsi, dilengkapi dokumen, demo, dan bahan pitch. Rencana awal 4 hari kerja; realisasi 8 hari kalender dengan lingkup lebih luas.

1.3 Hasil akhir:

| Hasil | Status |
|---|---|
| Aplikasi web yang dapat diakses lewat tautan (https://kriya-pkk.vercel.app) | Ada |
| Dokumen BRD, PRD, SRS, FRD, PMP, WBS | Ada (versi 1.0 tertinggal dari kode; diperbarui menjadi 2.0) |
| Dokumen desain (SDD) | Baru dibuat pada 2.0 |
| Data demo dan skenario demo | Sebagian (akun demo di README; berkas seed tidak ada di repositori) |
| Video demo dan bahan pitch | Dikerjakan terpisah dari repositori (lihat proposal) |
| Laporan validasi akurasi scan AI | **Belum ada** |

## 2. Lingkup dan batasan

Masuk lingkup (berubah dari 1.0): seluruh fitur FRD 2.0, termasuk toko online, pembayaran sandbox, ongkir, notifikasi WhatsApp, dan pencatatan pencairan.

Di luar lingkup: komisi otomatis, pencairan otomatis, pelacakan resi lewat API, pengembalian dana dari aplikasi, sampah organik pada setoran.

Batasan:
1. Waktu: anggota masih kuliah.
2. Biaya tunai: Rp0 pada tahap lomba (paket gratis dan sandbox).
3. Teknologi: Next.js 16, Supabase, Gemini API, Midtrans, Fonnte.
4. Persyaratan lomba: SDG 3, 4, 7, 8, 9, 11 dan Asta Cita 2, 4, 6.

## 3. Pemangku kepentingan

1. Tim pengembang.
2. Dosen pembimbing atau mentor (bila ada).
3. Panitia dan juri ADIKARA.
4. Calon pengguna (pengurus dan anggota PKK) dan pembeli.
5. Calon mitra (desa, CSR, pemerintah daerah).

## 4. Organisasi dan peran

Tim tiga orang; nama berikut berasal dari tim dan tidak dapat diverifikasi dari repositori (Muhammad Bevand Januartama, Tama Adkhiya Raditya Putra, Azwina Nanda Kinanti). Dari riwayat git: kode aplikasi dikerjakan akun `BevandJanuartama`; dokumen dan struktur repositori dikerjakan akun `Tama1323`. Pembagian peran formal tidak tercatat.

## 5. Jadwal: rencana dan realisasi

| Rencana awal | Realisasi (riwayat git) |
|---|---|
| Hari 1: fondasi, skema, RLS, setoran, scan, stok | 25 Okt: `feat: setup awal KriyaPKK` (83 berkas, sekitar 17.000 baris): skema 0001, RLS, setoran, scan, stok, ide, produksi, penjualan, kas, dampak, admin, kuota AI |
| Hari 2: ide, costing, produksi, kuota AI | Selesai pada commit yang sama |
| Hari 3: penjualan, keuangan, dampak, admin, uji RLS | Selesai; uji RLS tersimpan di `supabase/tests` |
| Hari 4: poles, demo, deploy, video, pitch | 26 sampai 27 Okt: landing, tampilan ponsel, redesain pastel, logo |
| (tidak direncanakan: marketplace) | 28 Okt: katalog, keranjang, checkout, ongkir, Midtrans (49 berkas) |
| (tidak direncanakan) | 1 Nov: akun pembeli, ekspedisi dan resi, dana online dan pencairan; README |

Milestone:

| Milestone | Status |
|---|---|
| M1: setoran sampai stok | Tercapai |
| M2: ide, costing, produksi | Tercapai |
| M3: alur sampai laba di dashboard | Tercapai |
| M4: aplikasi live, video, pitch | Aplikasi live tercapai; video dan pitch di luar repositori |
| M5 (tambahan): toko online dan pembayaran sandbox | Tercapai |
| M6 (tambahan): akun pembeli, resi, pencairan | Tercapai |

## 6. Anggaran

Biaya tunai: Rp0 pada tahap lomba. Hosting Vercel gratis; Supabase gratis; Gemini paket gratis; Midtrans sandbox. Peta memakai iframe OpenStreetMap tanpa kunci. Biaya yang akan muncul bila produksi: biaya transaksi Midtrans (QRIS dan virtual account), paket Fonnte, batas paket gratis AI dan Supabase. Batas paket gratis dapat berubah dan perlu dicek ulang.

## 7. Manajemen risiko (realisasi)

| Risiko | Mitigasi rencana | Kondisi |
|---|---|---|
| Waktu tidak cukup | Prioritas M dahulu | Terkendali; lingkup justru bertambah |
| Batas AI tercapai saat demo | Cache, kuota, model cadangan, mode manual | Diterapkan |
| Akurasi scan rendah | Koreksi manual, uji 20 sampai 30 foto | Koreksi manual ada; **uji akurasi belum dilakukan** |
| Bug RLS membocorkan data | Uji dua kelompok | Uji database ada; tabel pesanan tidak dapat diaudit (0002 hilang) |
| Layanan pihak ketiga gangguan | Rekaman demo | Mode simulasi pembayaran untuk uji sandbox |
| Anggota berhalangan | Peran saling menggantikan | Tidak tercatat |
| Biaya AI melebihi pendapatan | Titik impas, kuota, premium | Titik impas belum dihitung karena komisi belum ada |
| **Baru:** endpoint publik disalahgunakan | (tidak direncanakan) | Belum ada pembatasan laju |
| **Baru:** berkas migrasi dan seed hilang dari repositori | (tidak direncanakan) | Perlu dipulihkan |

## 8. Manajemen komunikasi

Rapat singkat, grup obrolan, papan tugas berdasarkan WBS, repositori Git. Dari riwayat: commit langsung ke `main`, tanpa cabang fitur atau pull request. Praktik ini perlu diubah bila tim bertambah.

## 9. Manajemen kualitas

| Praktik | Status |
|---|---|
| Definisi selesai: fitur jalan dan lolos uji manual | Dipakai tidak tertulis |
| Uji unit perhitungan | Ada, 3 kasus |
| Uji integrasi setoran, produksi, penjualan | Ada di tingkat database (RPC); belum di tingkat aplikasi |
| Uji RLS antar kelompok | Ada |
| Uji kegunaan dengan pengguna awam | Belum |
| Uji akurasi AI pada foto nyata | Belum |
| CI | Tidak ada |

## 10. Manajemen perubahan

Perubahan lingkup besar terjadi tanpa pembaruan dokumen: marketplace (28 Okt) dan akun pembeli (1 Nov) tidak tercermin di SRS, FRD, PRD, PMP, dan WBS sampai versi 2.0. **Aturan untuk ke depan:** setiap perubahan lingkup mengubah FRD dan SDD pada commit atau pull request yang sama.

## 11. Manajemen pengadaan

Tidak ada pengadaan berbayar. Akun layanan (Supabase, Vercel, Google AI Studio, Midtrans sandbox, Fonnte) dibuat oleh tim.

## 12. Kriteria keberhasilan proyek

| Kriteria | Status |
|---|---|
| Seluruh fitur prioritas M berjalan | Tercapai (FR17 prioritas C belum) |
| Demo alur setoran, ide, produksi, penjualan, dampak tanpa gangguan | Belum dibuktikan di dokumen; aplikasi live tersedia |
| Dokumen lengkap dan konsisten dengan produk | Tercapai hanya setelah versi 2.0 |
| Laporan validasi AI | Belum |
| Perhitungan bisnis (biaya AI per mitra, titik impas) | Belum |

## 13. Rencana setelah lomba

1. Pulihkan migrasi `0002`, seed, dan `.env.example`; rapikan migrasi `0004`.
2. Uji coba lapangan di satu kelompok PKK; uji akurasi scan dan SUS.
3. Pembatasan laju dan header keamanan sebelum dibuka umum.
4. Putuskan komisi platform (implementasi atau tetap rencana) dan kebijakan kategori kuliner.
5. Pencairan otomatis dan pelacakan resi bila ada mitra.
6. Penjajakan kemitraan desa dan CSR.

## Riwayat revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 25 Okt 2026 | Rencana awal |
| 2.0 | 9 Nov 2026 | Menjadi rencana dan realisasi; lingkup mencakup toko online; risiko dan perubahan baru; kriteria berstatus |
| 2.1 | 10 Nov 2026 | Angka riwayat git diverifikasi; nama anggota ditandai belum terverifikasi dari repositori |
| 2.2 | 10 Nov 2026 | Diverifikasi putaran kedua; tidak ada perubahan isi |
