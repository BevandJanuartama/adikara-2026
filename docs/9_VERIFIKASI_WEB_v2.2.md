# Verifikasi Dokumentasi terhadap Aplikasi dan Web Live

Tanggal: 10 November 2026 (putaran 1: versi 2.1; putaran 2: versi 2.2)
Dasar: kode di `kriya-pkk/` (commit `aa876a4`) dan aplikasi live https://kriya-pkk.vercel.app
Hasil: dokumentasi 2.0 dinaikkan menjadi 2.1, lalu 2.2 setelah putaran kedua. Setelah putaran kedua tidak ada selisih isi yang tersisa di dokumen; yang tersisa hanya butir bagian 3.3 yang memang harus diperbaiki di kode atau repositori.

## 1. Cara memeriksa

1. Membaca seluruh dokumen 2.0 (BRD, PRD, SRS, FRD, PMP, WBS, SDD, konsep, alur kerja).
2. Mencocokkan angka, aturan, dan nama dengan kode: modul ongkir, status pesanan, AI dan kuota, kompresi foto, migrasi SQL, fungsi database, route, konfigurasi, dependensi, riwayat git.
3. Membuka halaman publik di web live: beranda, `/daftar`, `/daftar/pembeli`, `/login`, `/privasi`, `/katalog`, detail produk.

## 2. Yang tidak diperiksa

- Halaman setelah login (setoran, ide, produksi, kas, pesanan, admin). Tidak ada login ke aplikasi live; kebenarannya diperiksa dari kode dan hasil uji database yang tersimpan.
- Checkout dan pembayaran Midtrans sungguhan, WhatsApp Fonnte, dan Biteship. Tidak dijalankan.
- Basis data yang sedang berjalan. Hanya migrasi di repositori yang dibaca, sehingga tabel `orders` dan `order_items` tidak dapat diaudit (migrasi `0002` hilang).
- Kecepatan, akurasi AI, dan kegunaan. Tidak ada pengukuran.

## 3. Hasil pemeriksaan

### 3.1 Cocok dengan kode atau web live

| Butir dokumen | Bukti |
|---|---|
| Contoh Pouch: modal Rp11.250, harga jual Rp16.000; 10 pouch menghasilkan Rp160.000 dengan Rp47.500 masuk kas | Halaman depan live; `calc.ts`; template pada migrasi `0001` |
| Tujuh harga awal (PET 3.000, HDPE 2.500, Kardus 1.500, Kertas 1.200, Kain perca 3.000, Kaca 500, Logam 4.000) | `seed_default_prices` |
| Upah Rp12.500 per jam, margin 40%, kuota 30 scan dan 10 ide per hari | Migrasi `0001` |
| Kompresi 768 px, JPEG 70%, batas 1 MB | `lib/image.ts`, `api/scan` |
| Gemini model utama dan cadangan, timeout 12 detik (ide 14, panduan 15), batas token 1.024 dan 3.072 | `lib/ai/gemini.ts`, route AI |
| Ide maksimal 3, stok lebih dari 0,2 kg, panduan 3 sampai 12 langkah, scan maksimal 10 baris | `ideas/route.ts`, `schemas.ts` |
| Ongkir: 150 km, faktor 1,3, pembagi volumetrik 6000, toleransi 0,3 kg, tujuh layanan dengan rumus yang sama | `ongkir-manual.ts`, `geo.ts` |
| Alur status pesanan, resi 6 sampai 40 karakter, penjualan dan kas saat lunas tanpa ongkir | `set_order_status`, `mark_order_paid` |
| Saldo posko dan pengecualian pembayaran simulasi | `_saldo_platform` |
| Kedaluwarsa 90 menit lewat cron harian 01.00 UTC | `api/keepalive`, `vercel.json` |
| 11 route API, empat peran, halaman publik dan yang wajib login | Pohon `src/app`, `lib/supabase/proxy.ts` |
| Tidak ada komisi 95:5, OpenRouter, Leaflet, Nominatim, zona ongkir, peringatan stok | Pencarian kode kosong |
| Next.js 16.4.3, Tailwind v4, Zod, `@google/genai` | `package.json` |
| Formulir pendaftaran mitra dan pembeli, login, kebijakan privasi (UU 27/2022), katalog dengan filter kategori, posko, dan pencarian | Web live |
| 14 commit, pembagian kontributor, 83 berkas awal, 49 berkas marketplace | `git log` |

### 3.2 Selisih yang ditemukan dan sudah dikoreksi di 2.1

| No | Dokumen | Sebelumnya | Sesudahnya |
|---|---|---|---|
| 1 | SDD 7.5 | Kata sandi akun demo "aman selama repositori privat" | Repositori GitHub publik; kata sandi terlihat siapa pun |
| 2 | SDD 8 | `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` satu-satunya; `NEXT_PUBLIC_APP_URL` dan `ONGKIR_MODE` wajib | Kode membaca `MIDTRANS_IS_PRODUCTION` lebih dulu; dua variabel lain punya nilai bawaan sehingga tidak wajib |
| 3 | SDD 5 | Fungsi `demo_seed` tidak tercatat | Ditambahkan |
| 4 | SDD 7.4, FRD FR58 | Diagnosa "dilindungi `CRON_SECRET`", hanya Midtrans dan Fonnte | Aktif saat pengembangan atau lewat `?kunci=`; juga memeriksa database dan Biteship |
| 5 | FRD FR01 | Kolom wajib tidak dirinci | Wajib dan opsional dirinci sesuai formulir live (kode pos dan titik lokasi opsional) |
| 6 | BRD, PRD, konsep | Biaya aktivasi Rp250.000 tampil seperti fakta | Ditandai angka tim, belum bersumber, tidak ada di aplikasi |
| 7 | BRD 6.3 | Tidak menyebut teks katalog | Teks katalog live menyebut "minyak jelantah, sisa dapur", bertentangan dengan batas anorganik |
| 8 | PMP 4 | Nama tiga anggota seolah terverifikasi | Ditandai berasal dari tim, tidak ada di repositori |
| 9 | README aplikasi | Merujuk `docs/ALUR-KRIYAPKK.md` yang tidak ada | Menaut ke `docs/8_flow_cara_kerja_v2.2.md` |
| 10 | Seluruh dokumen | Versi 2.0 | Versi 2.1 dengan baris riwayat revisi |

### 3.3 Selisih yang belum dapat dikoreksi di dokumen

Perbaikannya ada di kode atau repositori, bukan di dokumen. Dokumen sudah mencatatnya sebagai utang teknis.

1. `supabase/migrations/0002_marketplace.sql` tidak ada, sehingga basis data tidak dapat dibangun ulang dari repositori.
2. `reset_dan_seed.sql`, `seed_akun_demo.sql`, `.env.example`, dan `20_marketplace_test.sql` dirujuk README aplikasi tetapi tidak ada.
3. Tidak ada pembatasan laju maupun header keamanan.
4. Uji akurasi scan AI dan uji kegunaan belum ada.
5. Kata sandi akun demo masih tertulis di README aplikasi yang publik.

### 3.4 Putaran kedua (versi 2.2)

Cakupan tambahan: badan seluruh fungsi database di migrasi `0001`, `0003`, dan `0004_akun_pembeli` (setoran, stok, ide, produksi, upah, penjualan, kas, laporan, kuota AI, admin, pesanan, pencairan), seluruh kebijakan RLS dan hibah eksekusi, kebijakan Storage, kode galat, validasi form di sisi aplikasi, rute pembayaran, dan konsistensi angka antar dokumen.

Hasil: seluruh aturan FR01 sampai FR58, matriks akses SDD 7.3, rumus lampiran SRS, dan contoh hitungan sesuai. Selisih yang ditemukan dan sudah dikoreksi:

| No | Dokumen | Sebelumnya | Sesudahnya |
|---|---|---|---|
| 11 | FRD FR16 dan FR24, SDD 4.3, alur kerja | Pembatalan batch hanya disebut mengembalikan bahan | `cancel_batch` tidak membalik kas bahan tambahan atau upah; dicatat dan diarahkan ke entri pembalik |
| 12 | SDD 7.2 | "Fungsi pesanan hanya untuk `service_role`" | Hanya `create_order` dan `mark_order_paid`; fungsi pesanan lain terbuka untuk pengguna masuk dengan pemeriksaan peran di dalam fungsi |
| 13 | SDD, SRS, FRD FR40 | Bucket `produk` ditulis ada | Pembuatan bucket dan kebijakannya tidak ada di migrasi (bagian dari migrasi `0002` yang hilang); bagian 4.4 SDD ditambah |
| 14 | FRD FR48 | Mandiri disebut sebagai VA | Mandiri lewat Bill Payment (`echannel`) |
| 15 | FRD FR08 | "Maksimal 12 kata" tampak seperti aturan keras | Itu permintaan di prompt; batas teknis 200 karakter |
| 16 | BRD 8.2 | "Vercel (paket hobi)" | Nama paket tidak tercatat di repositori; ditulis paket gratis |
| 17 | SRS 4.3 | Endpoint notifikasi hanya POST | Ada `GET` yang hanya mengembalikan info |
| 18 | Laporan analisis | "18 tabel" bertentangan dengan 17 di bagian lain; tidak ditandai historis | Diperbaiki menjadi 17 ditambah `orders` dan `order_items`; diberi catatan laporan historis |

## 4. Kesimpulan

Isi dokumentasi 2.2 selaras dengan kode, migrasi yang tersedia, dan halaman publik web live. Batasnya: halaman setelah login, checkout, pembayaran, WhatsApp, dan basis data yang berjalan tidak diuji langsung, dan bagian skema yang berasal dari migrasi `0002` hanya dapat dirunut dari kode pemanggil.
