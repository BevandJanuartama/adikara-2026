# WBS: Work Breakdown Structure

Proyek: KriyaPKK
Versi: 2.2 (rencana awal ditambah status pekerjaan per 1 November 2026; diverifikasi dua putaran pada 10 November 2026)
Menggantikan: WBS 1.0 (25 Oktober 2026, "tanpa marketplace")

Peran: LEAD (project lead dan backend), FE (frontend dan UX), AI (AI engineer), DOC (dokumentasi dan bisnis). Prioritas: M wajib, S sebaiknya, C tahap lanjut. Estimasi dalam jam kerja orang (rencana awal). Jam realisasi tidak dicatat.

Status: **Selesai**, **Sebagian**, **Belum**, **Tidak dikerjakan** (diganti keputusan lain), **Tambahan** (tidak ada di rencana awal). Bukti merujuk ke kode atau dokumen.

## 1.0 Manajemen proyek

| ID | Tugas | Rencana | Status | Catatan |
|---|---|---|---|---|
| 1.1 | Perencanaan, papan tugas, repositori | LEAD 2 | Sebagian | Repositori ada; papan tugas tidak tercatat |
| 1.2 | Pemantauan harian | LEAD 2 | Tidak tercatat | |
| 1.3 | Pengelolaan risiko dan perubahan | LEAD 1 | Sebagian | Perubahan lingkup tidak tercermin di dokumen sampai 2.0 |

## 2.0 Fondasi teknis

| ID | Tugas | Rencana | Status | Catatan |
|---|---|---|---|---|
| 2.1 | Setup Next.js, TypeScript, Tailwind, shadcn/ui, deploy Vercel | LEAD 2 | Selesai | Next.js 16.4.3, Tailwind v4 |
| 2.2 | Skema Supabase, RLS, Storage | LEAD 3 | Selesai | `0001_kriyapkk_schema.sql` |
| 2.3 | Autentikasi dan peran | LEAD 3 | Selesai | Empat peran (pembeli ditambah) |
| 2.4 | Kerangka UI mobile first | FE 4 | Selesai | Navigasi bawah dan sidebar; PWA |

## 3.0 Mitra dan pengaturan

| ID | Tugas | Rencana | Status | Catatan |
|---|---|---|---|---|
| 3.1 | Pendaftaran dan aktivasi (FR01, FR02) | 3 M | Selesai | |
| 3.2 | Kelola anggota (FR03) | 3 M | Selesai | Email dan kata sandi |
| 3.3 | Tabel harga (FR05) | 3 M | Selesai | |
| 3.4 | Upah dan margin (FR06) | 2 M | Selesai | |

## 4.0 Setoran dan scan

| ID | Tugas | Rencana | Status | Catatan |
|---|---|---|---|---|
| 4.1 | Data warga (FR14) | FE 2 M | Selesai | |
| 4.2 | Unggah dan kompresi foto (FR07) | FE 3 M | Selesai | 768 px, JPEG 70% |
| 4.3 | Integrasi AI Vision (FR08) | AI 6 M | Selesai | Prompt, skema Zod, timeout, satu kali ulang dengan model Gemini cadangan, penandaan barang berbahaya |
| 4.4 | Koreksi manual (FR09) | FE 3 M | Selesai | |
| 4.5 | Berat dan taksiran (FR10) | 3 M | Selesai | |
| 4.6 | Persetujuan, saldo, stok (FR11, FR12) | LEAD 4 M | Selesai | Saldo atau kas tunai |
| 4.7 | Pencairan saldo warga (FR13) | LEAD 2 S | Selesai | |

## 5.0 Stok

| ID | Tugas | Rencana | Status | Catatan |
|---|---|---|---|---|
| 5.1 | Daftar stok dan nilai rata-rata (FR15) | 3 M | Selesai | |
| 5.2 | Pengurangan stok saat produksi (FR16) | LEAD 1 M | Selesai | |
| 5.3 | Peringatan stok (FR17) | FE 2 C | Belum | |

## 6.0 Ide dan costing

| ID | Tugas | Rencana | Status | Catatan |
|---|---|---|---|---|
| 6.1 | Template ide (FR23) | AI+DOC 4 S | Sebagian | 13 template (rencana 20 sampai 30) |
| 6.2 | Generator ide dari ringkasan stok (FR18, FR19) | AI 6 M | Selesai | Dengan filter stok cukup |
| 6.3 | Modal dan harga jual (FR20, FR21) | 5 M | Selesai | Di database |
| 6.4 | Panduan lazy dengan cache (FR22) | AI 4 M | Selesai | Ditambah mode suara |
| 6.5 | Halaman ide dan detail | FE 4 M | Selesai | |

## 7.0 Produksi

| ID | Tugas | Rencana | Status | Catatan |
|---|---|---|---|---|
| 7.1 | Batch produksi (FR24) | 4 M | Selesai | |
| 7.2 | Hasil produksi (FR25) | FE 3 M | Selesai | |
| 7.3 | Upah anggota (FR26) | 3 M | Selesai | |

## 8.0 Penjualan dan keuangan

| ID | Tugas | Rencana | Status | Catatan |
|---|---|---|---|---|
| 8.1 | Stok produk jadi (FR28) | FE 2 M | Selesai | |
| 8.2 | Penjualan langsung (FR27) | 3 M | Selesai | |
| 8.3 | Buku kas (FR29) | 4 M | Selesai | |
| 8.4 | Laba rugi (FR30) | 3 M | Selesai | |
| 8.5 | Ekspor CSV (FR31) | FE 2 S | Sebagian | Buku kas saja |

## 9.0 Dashboard dan admin

| ID | Tugas | Rencana | Status | Catatan |
|---|---|---|---|---|
| 9.1 | Dashboard dampak (FR32) | FE 5 M | Selesai | |
| 9.2 | Kelola mitra (FR36) | LEAD 3 M | Selesai | |
| 9.3 | Pantau AI (FR37) | LEAD 2 S | Sebagian | Tanpa estimasi biaya |

## 10.0 AI lintas modul

| ID | Tugas | Rencana | Status | Catatan |
|---|---|---|---|---|
| 10.1 | Kuota dan pencatatan (FR33) | AI 3 M | Selesai | |
| 10.2 | Cache (FR35) | AI 3 M | Selesai | |
| 10.3 | Mode manual (FR34) | 3 M | Selesai | |
| 10.4 | Penyedia cadangan **OpenRouter** | AI 2 S | **Tidak dikerjakan** | Diganti model Gemini kedua (`GEMINI_MODEL_FALLBACK`) |

## 11.0 Pengujian dan validasi

| ID | Tugas | Rencana | Status | Catatan |
|---|---|---|---|---|
| 11.1 | Uji unit perhitungan | LEAD 3 | Sebagian | 3 kasus di `calc.test.ts` |
| 11.2 | Uji integrasi alur | 3 | Sebagian | Tingkat database saja |
| 11.3 | Uji RLS dua kelompok | LEAD 2 | Selesai | `10_rls_dan_transaksi_test.sql`; hasil tersimpan |
| 11.4 | Uji akurasi scan 20 sampai 30 foto | AI+DOC 4 | **Belum** | Tidak ada laporan |
| 11.5 | Uji kegunaan | FE+DOC 2 | **Belum** | |
| 11.6 | Perbaikan bug | semua 6 | Berjalan | |

## 12.0 Dokumentasi dan pitch

| ID | Tugas | Rencana | Status | Catatan |
|---|---|---|---|---|
| 12.1 | Finalisasi PRD, SRS, FRD, PMP, WBS | DOC 4 | Selesai, lalu tertinggal | Diperbarui menjadi 2.0 |
| 12.2 | Perhitungan bisnis (biaya AI, titik impas) | DOC 3 | Belum | |
| 12.3 | Data demo dan skenario demo | 3 | Sebagian | Akun demo di README; seed tidak ada di repositori |
| 12.4 | Video demo | 4 | Di luar repositori | |
| 12.5 | Slide pitch | 5 | Di luar repositori | |
| 12.6 | **Dokumen desain (SDD)** | DOC | Tambahan | Dibuat pada 2.0 |

## 13.0 Rilis

| ID | Tugas | Rencana | Status | Catatan |
|---|---|---|---|---|
| 13.1 | Deploy produksi dan cek env | LEAD 2 | Selesai | https://kriya-pkk.vercel.app; `/api/diagnosa` |
| 13.2 | Pemeriksaan alur demo di ponsel | 2 | Tidak tercatat | |
| 13.3 | Pengumpulan berkas lomba | DOC 1 | Di luar repositori | |

## 14.0 Toko online (tambahan, tidak ada di rencana awal)

| ID | Tugas | Status | Catatan |
|---|---|---|---|
| 14.1 | Profil toko dan rekening posko (FR38, FR39) | Selesai | |
| 14.2 | Manajemen produk (FR40) dan katalog publik (FR41) | Selesai | |
| 14.3 | Akun pembeli, keranjang, privasi (FR42 sampai FR44) | Selesai | |
| 14.4 | Ongkir manual dan Biteship (FR45, FR46) | Selesai | |
| 14.5 | Pesanan dan pembayaran Midtrans (FR47, FR48) | Selesai | |
| 14.6 | Webhook, sinkronisasi, kedaluwarsa (FR49, FR51) | Selesai | |
| 14.7 | Notifikasi WhatsApp Fonnte (FR50) | Selesai | |
| 14.8 | Pesanan saya dan pesanan online dengan resi (FR52, FR53) | Selesai | |
| 14.9 | Simulasi pembayaran sandbox (FR54) | Selesai | |
| 14.10 | Dana online dan pencairan (FR55 sampai FR57) | Selesai | Tanpa komisi |
| 14.11 | Keepalive dan diagnosa (FR58) | Selesai | |
| 14.12 | Migrasi `0002_marketplace.sql`, seed, `.env.example` di repositori | **Belum** | Berkas hilang |
| 14.13 | Pembatasan laju, header keamanan | **Belum** | |

## Prioritas berikutnya

1. 14.12 pulihkan berkas yang hilang.
2. 11.4 dan 11.5 uji akurasi AI dan kegunaan (bukti untuk juri).
3. 14.13 keamanan endpoint publik.
4. 12.2 perhitungan biaya AI dan titik impas.
5. 5.3, 8.5, 9.3 penyempurnaan fitur prioritas S dan C.

## Riwayat revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 25 Okt 2026 | Rencana awal |
| 2.0 | 9 Nov 2026 | Status per butir; bagian 14.0 toko online; butir 10.4 dan 12.6; prioritas berikutnya |
| 2.1 | 10 Nov 2026 | Tidak ada perubahan status; diverifikasi ulang |
| 2.2 | 10 Nov 2026 | Diverifikasi putaran kedua; tidak ada perubahan isi |
