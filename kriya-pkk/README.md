# KriyaPKK

Ekosistem digital bank sampah, produksi kerajinan daur ulang, dan toko online untuk kelompok PKK.
Karya Divisi Inovasi Software — ADIKARA 2026, Fakultas Informatika Telkom University.

**Aplikasi live:** https://kriya-pkk.vercel.app

---

## Daftar isi

1. [Masalah & solusi](#masalah--solusi)
2. [Peran pengguna](#peran-pengguna)
3. [Fitur](#fitur)
4. [Alur singkat](#alur-singkat)
5. [Teknologi & arsitektur](#teknologi--arsitektur)
6. [Struktur folder](#struktur-folder)
7. [Menjalankan secara lokal](#menjalankan-secara-lokal)
8. [Environment variables](#environment-variables)
9. [Database](#database)
10. [Deploy ke Vercel](#deploy-ke-vercel)
11. [Toko online: ongkir, pembayaran, notifikasi](#toko-online-ongkir-pembayaran-notifikasi)
12. [Keamanan & privasi](#keamanan--privasi)
13. [Akun demo](#akun-demo)
14. [Pengujian](#pengujian)
15. [Batasan & rencana berikutnya](#batasan--rencana-berikutnya)

---

## Masalah & solusi

Kelompok PKK menerima setoran sampah anorganik dari warga. Kendala yang sering muncul:
- sulit menilai harga setoran secara adil;
- stok bahan tidak tercatat;
- bingung menentukan produk kerajinan yang layak dibuat;
- tidak tahu modal dan laba;
- kesulitan menjual hasilnya di luar lingkungan sendiri.

KriyaPKK menggabungkan beberapa alat dalam satu aplikasi web (PWA) yang nyaman dipakai di HP:
- **kasir setoran** dengan scan foto AI;
- **ERP mini** untuk stok, produksi, upah, dan kas;
- **penasihat produksi AI**;
- **toko online** dengan ongkir ekspedisi dan pembayaran QRIS/VA.

## Peran pengguna

| Peran | Cara mendapat akun | Akses |
|---|---|---|
| **Admin platform** | Dibuat lewat SQL seed | Aktivasi posko, kuota AI, pencairan dana penjualan online |
| **Pengurus posko** | Daftar di `/daftar`, lalu diaktifkan admin | Semua menu posko: setoran, warga, stok, ide, produksi, produk, pesanan, kas, laporan, anggota, pengaturan |
| **Anggota (perajin)** | Dibuatkan pengurus di menu Anggota | Stok, Dapur kreasi, Produksi, Upah saya |
| **Pembeli** | Daftar di `/daftar/pembeli` | Katalog, keranjang, checkout, Pesanan saya |
| **Warga** | Tanpa akun (dicatat pengurus) | Menerima saldo atau uang tunai dari setoran |

## Fitur

| Modul | Isi |
|---|---|
| Mitra & akun | Daftar kelompok (alamat, WA, titik lokasi), aktivasi admin, akun perajin, status kelompok |
| Setoran & scan AI | Foto → AI mengenali jenis dan kondisi barang → koreksi manual → timbang → warga memilih masuk saldo, dibayar tunai, atau batal |
| Warga & saldo | Daftar warga, saldo tabungan sampah, pencairan tunai |
| Stok bahan | Stok per jenis (kg) dengan nilai rata-rata tertimbang |
| Dapur kreasi | Ide kerajinan dari stok (AI atau template), editor harga (bahan, alat, upah, margin), panduan langkah, mode suara |
| Produksi | Batch produksi, stok bahan terpotong otomatis, hasil jadi dan unit gagal, pembayaran upah perajin |
| Produk & katalog | Kategori, foto, deskripsi, bahan limbah, berat dan ukuran kemasan, tampil di katalog, penjualan langsung di posko |
| Toko online | Katalog publik, keranjang, akun pembeli, cek ongkir ekspedisi, pembayaran Midtrans, Pesanan saya (status dan nomor resi) |
| Pesanan online (posko) | Proses → kirim (nomor resi wajib) / siap diambil → selesai, plus simulasi bayar saat sandbox |
| Dana online | Saldo penjualan online per posko, pencairan oleh admin, riwayat pencairan |
| Keuangan | Buku kas append-only (koreksi dengan entri pembalik), laporan laba rugi, ekspor CSV |
| Dampak | Kg sampah, rupiah ke warga, produk dibuat dan terjual, upah perajin, tren bulanan |
| Kuota & cache AI | Kuota harian per kelompok, cache hasil, mode manual saat AI gagal atau kuota habis |
| Privasi | Halaman `/privasi` (UU No. 27 Tahun 2022), persetujuan saat mendaftar |

## Alur singkat

```
Posko sewa sistem → pengurus daftar → admin aktivasi → pengurus buat akun perajin
Warga setor sampah → saldo/tunai → stok bahan → ide kerajinan → produksi (upah perajin)
→ produk jadi → jual di posko / katalog online → pembeli login & bayar (Midtrans)
→ WA "LUNAS" ke posko → kirim lewat ekspedisi (resi) / diambil → selesai
→ dana online dicairkan admin ke rekening posko → kas & laporan dampak
```

Alur lengkap 24 langkah ada di [`docs/ALUR-KRIYAPKK.md`](docs/ALUR-KRIYAPKK.md).

## Teknologi & arsitektur

**Teknologi:**
- Next.js 16 (App Router, Server Actions, `proxy.ts`) · TypeScript · Tailwind CSS v4 · shadcn/ui · lucide-react · Zod
- Supabase: Postgres, Auth, Storage, Row Level Security
- Google Gemini API (`@google/genai`)
- Midtrans Snap (QRIS & Virtual Account)
- Fonnte (WhatsApp)
- Vercel (hosting & cron)
- Biteship (opsional)

```
Browser (Next.js App Router, PWA)
   │  Server Components · Server Actions · Route Handlers (Vercel)
   ├── /api/scan, /api/ideas, /api/guide ──► Gemini (JSON berskema, cache, kuota harian)
   ├── /api/ongkir ──► tarif manual ekspedisi (atau Biteship)
   ├── /api/checkout, /api/pesanan/bayar ──► Midtrans Snap
   ├── /api/midtrans/notifikasi ◄── webhook Midtrans (tanda tangan SHA512)
   │        └──► Fonnte: 1 WhatsApp ke posko saat lunas
   └── Supabase
        ├── Auth (email + kata sandi; peran admin / pengurus / anggota / pembeli)
        ├── Postgres + RLS per kelompok & per pembeli
        │     └── Fungsi RPC atomik: setoran, produksi, upah, penjualan, pesanan, pencairan
        └── Storage: "photos" (privat, foto setoran) · "produk" (publik, foto katalog)
```

**Keputusan desain penting:**
- **Harga setoran tidak ditentukan AI.** AI hanya mengenali jenis dan kondisi barang. Nilainya = berat × tabel harga pengurus.
- **Uang, stok, dan kas hanya berubah lewat fungsi database** dalam satu transaksi. Klien tidak punya izin menulis langsung ke tabel-tabel itu.
- **Harga produk, ongkir, dan total pesanan dihitung ulang di server.** Browser hanya mengirim ID produk dan jumlah.
- **Isolasi data dijamin RLS di database:**
  - tiap posko hanya melihat datanya sendiri;
  - pembeli hanya melihat pesanannya sendiri;
  - perajin tidak melihat data pembeli maupun kas.
- **Hemat token AI:** foto dikompres di browser (768 px), hasil di-cache, kuota harian, dan model Flash-Lite sebagai default.

## Struktur folder

```
src/
  app/
    (app)/            halaman setelah login (posko & admin)
      beranda, setoran, setoran/baru, warga, stok, ide, produksi, produk,
      pesanan, kas, laporan, anggota, pengaturan, upah, menu,
      admin, admin/pencairan
    (toko)/           toko online
      katalog, katalog/[id], keranjang, checkout,
      akun/pesanan, akun/pesanan/[kode], privasi
    api/              scan, ideas, guide, export/kas, keepalive, ongkir, checkout,
                      pesanan/bayar, pesanan/simulasi, midtrans/notifikasi, diagnosa
    login, daftar, daftar/pembeli, status, page.tsx (landing)
  components/         komponen UI (kriya-ui, nav, form, toko/*)
  lib/
    supabase/         klien Supabase (browser, server, proxy, admin)
    ai/               klien Gemini, skema JSON + Zod, cache & kuota
    actions/          Server Actions (auth, ops, admin)
    marketplace/      ongkir, ongkir-manual, midtrans, snap, pesanan, fonnte, geo, keranjang, ...
  proxy.ts            sesi Supabase & proteksi halaman (pengganti middleware.ts di Next.js 16)
supabase/
  migrations/         0001–0004 (skema, RLS, fungsi RPC, storage)
  reset_dan_seed.sql  kosongkan data + akun demo
  seed_akun_demo.sql  akun demo + 9 produk contoh (opsional)
  tests/              uji database di Postgres lokal
docs/                 ALUR-KRIYAPKK.md, PRD, SRS, dll.
vercel.json           cron harian /api/keepalive
```

## Menjalankan secara lokal

Prasyarat:
- Node.js 20.9+
- akun Supabase, Google AI Studio, Midtrans (Sandbox), dan Fonnte (opsional).

```bash
git clone https://github.com/<akun>/kriyapkk.git
cd kriyapkk
npm install
cp .env.example .env.local      # isi semua nilai (lihat tabel di bawah)
npm run dev                     # http://localhost:3000
```

Lalu siapkan database (lihat [Database](#database)). Setelah mengubah `.env.local`, hentikan server, hapus folder `.next`, lalu jalankan lagi `npm run dev`.

Cek konfigurasi: buka `http://localhost:3000/api/diagnosa`. Halaman ini menampilkan status database, Midtrans (mode dan kecocokan kunci), dan Fonnte tanpa memperlihatkan isi kunci.

## Environment variables

| Nama | Wajib | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL proyek Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Publishable key Supabase |
| `SUPABASE_SECRET_KEY` | ✅ | Secret key, **hanya server**. Jangan diberi awalan `NEXT_PUBLIC_` |
| `GEMINI_API_KEY` | ✅ | Google AI Studio |
| `GEMINI_MODEL` | ✅ | Model utama, mis. `gemini-3.5-flash-lite` |
| `GEMINI_MODEL_FALLBACK` | ✅ | Model cadangan |
| `CRON_SECRET` | ✅ | String acak panjang (≥16 karakter) untuk cron dan `/api/diagnosa` di produksi |
| `NEXT_PUBLIC_APP_URL` | ✅ | Lokal `http://localhost:3000`, produksi `https://kriya-pkk.vercel.app` |
| `ONGKIR_MODE` | ✅ | `manual` (tarif bawaan) atau `biteship` |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | ✅ | Client key Midtrans |
| `MIDTRANS_SERVER_KEY` | ✅ | Server key Midtrans (hanya server) |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | ✅ | `false` untuk kunci Sandbox, `true` hanya untuk kunci Production |
| `SIMULASI_PEMBAYARAN` | – | `true` = pengurus bisa menandai lunas/gagal manual (hanya saat sandbox). **Hapus sebelum dipakai sungguhan** |
| `FONNTE_API_TOKEN` | – | Token perangkat Fonnte. Kosong = WhatsApp tidak dikirim |
| `ADMIN_EMAIL` | – | Email kontak di halaman `/privasi` |
| `BITESHIP_API_KEY` | – | Hanya bila `ONGKIR_MODE=biteship` |
| `BITESHIP_COURIERS` | – | Hanya bila `ONGKIR_MODE=biteship`, mis. `jne,jnt,sicepat,pos,anteraja` |

> `.env.local` jangan pernah di-commit. Bila kunci pernah terbagikan, buat ulang (rotate) di dashboard masing-masing layanan.

## Database

Buka Supabase → **SQL Editor** dan jalankan berurutan. Semua file migrasi aman dijalankan ulang.

| File | Isi |
|---|---|
| `migrations/0001_kriyapkk_schema.sql` | Tabel inti, RLS, fungsi RPC (setoran, stok, ide, produksi, upah, penjualan, kas, laporan, kuota AI, admin), bucket `photos`, template ide |
| `migrations/0002_marketplace.sql` | Profil posko (slug, WA, lokasi), produk katalog, bucket `produk`, tabel pesanan, fungsi katalog & pesanan |
| `migrations/0003_ongkir_manual.sql` | Ukuran kemasan produk (P × L × T) untuk berat volumetrik |
| `migrations/0004_akun_pembeli.sql` | Peran pembeli, pesanan terhubung ke akun, resi wajib saat dikirim, rekening posko & pencairan dana |
| `reset_dan_seed.sql` | **Menghapus semua data** dan menyisakan 4 akun demo + posko "PKK Sukapura" (aktif, tanpa produk) |
| `seed_akun_demo.sql` | Opsional: akun demo + 9 produk contoh di katalog |

Foto di Storage tidak ikut terhapus oleh `reset_dan_seed.sql`. Kosongkan bucket `photos` dan `produk` lewat Supabase → Storage bila perlu.

**Pengaturan Supabase Auth:**
- **Authentication → URL Configuration → Site URL:** isi `https://kriya-pkk.vercel.app`, supaya tautan konfirmasi email tidak mengarah ke localhost.
- **Confirm email:** bila aktif, pembeli harus mengonfirmasi email dulu sebelum bisa masuk. Untuk demo, opsi ini boleh dimatikan.

## Deploy ke Vercel

1. Impor repo ke Vercel. Framework: Next.js.
2. **Settings → Environment Variables:** isi semua variabel di tabel atas untuk **Production and Preview**.
   - `NEXT_PUBLIC_APP_URL=https://kriya-pkk.vercel.app`
3. **Redeploy** setiap kali env berubah.
4. **Cron:** `vercel.json` memanggil `/api/keepalive` setiap hari pukul 01.00 UTC. Panggilan ini:
   - menjaga proyek Supabase gratis tetap aktif;
   - menutup pesanan yang tidak dibayar sehingga stok kembali.
5. **Midtrans:** di dashboard (Sandbox/Production) → Settings → Payment → **Notification URL**, isi `https://kriya-pkk.vercel.app/api/midtrans/notifikasi`.
6. **Cek konfigurasi:** `https://kriya-pkk.vercel.app/api/diagnosa?kunci=<CRON_SECRET>`.

## Toko online: ongkir, pembayaran, notifikasi

**Alur pembeli:**
1. Buka `/katalog` tanpa login, lalu tambah produk ke keranjang. Keranjang disimpan di browser.
2. Tekan **Checkout**. Bila belum login, pembeli diarahkan ke **Masuk** atau **Daftar pembeli**, lalu kembali ke checkout dengan keranjang tetap utuh.
3. Pilih pengiriman:
   - **Ambil di posko** (gratis), atau
   - **Kirim lewat ekspedisi**: tentukan titik antar, lalu cek ongkir.
4. **Total = harga produk + ongkir.** Bayar lewat Midtrans Snap (QRIS / Virtual Account), selesaikan dalam 60 menit.
5. Pantau di **Pesanan saya**. Setelah paket dikirim, nomor resi tampil dan pembeli melacaknya sendiri di situs ekspedisi.

**Ongkir manual** (`src/lib/marketplace/ongkir-manual.ts`), hanya ekspedisi bernomor resi tanpa ojek online:
- **Jarak tagih** D = jarak garis lurus × 1,3, dibulatkan ke atas per km. Maksimal 150 km dari posko.
- **Berat volumetrik** = P × L × T / 6000.
- **Berat dikenakan** = yang lebih besar antara berat asli dan berat volumetrik, dengan toleransi 0,3 kg (≤1,30 → 1 kg). Minimal 1 kg.
- **Tarif per layanan:**

  | Layanan | Rumus | Estimasi |
  |---|---|---|
  | JNE REG | 8.000 + D×50 + (W−1)×7.000 | 1–2 hari |
  | JNE YES | 15.000 + D×80 + (W−1)×10.000 | 1 hari |
  | J&T EZ | 9.000 + D×50 + (W−1)×7.500 | 1–2 hari |
  | SiCepat REG | 8.500 + D×50 + (W−1)×7.000 | 1–2 hari |
  | Pos Kilat Khusus | 7.500 + D×40 + (W−1)×6.500 | 1–2 hari |
  | JNE JTR / SiCepat GOKIL (kargo) | 25.000 + D×100 + max(0, W−10)×2.000 | 2–3 hari |

**Status pesanan:**
- `menunggu_bayar` → `dibayar` → `diproses` → `dikirim` (resi wajib) / `siap_diambil` → `selesai`.
- Pesanan yang tidak dibayar ditutup otomatis (`kedaluwarsa`) dan stoknya kembali.

**Notifikasi:** hanya **1 WhatsApp (Fonnte) ke nomor posko saat pesanan lunas**. Isinya barang, pembeli, alamat, dan ekspedisi.

**Dana:**
- Pembayaran masuk ke rekening Midtrans pengelola platform.
- Saldo posko = pesanan lunas (produk + ongkir) − sudah dicairkan − potongan biaya.
- Admin mentransfer ke rekening posko, lalu mencatatnya di **Pencairan dana**.

**Mode uji (sandbox):** dengan `SIMULASI_PEMBAYARAN=true`, pengurus bisa menekan **Tandai lunas / gagal** di Pesanan online. Endpoint-nya `POST /api/pesanan/simulasi` (khusus pengurus posko pemilik pesanan).

## Keamanan & privasi

- **RLS di semua tabel.** Fungsi yang mengubah uang, stok, dan pesanan memakai `security definer` dengan pemeriksaan peran. Fungsi pesanan hanya bisa dipanggil server (`service_role`).
- **Webhook Midtrans** diverifikasi tanda tangan SHA512, dan status dicek ulang ke API Midtrans.
- **Nominal pembayaran** harus sama dengan tagihan. Notifikasi ganda tidak mencatat penjualan dua kali.
- **Login & peran:** checkout dan Pesanan saya wajib login sebagai pembeli. Metadata peran palsu saat mendaftar diabaikan.
- **Kunci rahasia** hanya ada di server dan tidak pernah memakai awalan `NEXT_PUBLIC_`.
- **Kebijakan privasi** di `/privasi`, dengan persetujuan wajib saat mendaftar.

## Akun demo

Dibuat oleh `supabase/reset_dan_seed.sql`:

| Peran | Email | Kata sandi |
|---|---|---|
| Admin | kriya@kriya.com | kriya2026 |
| Pengurus (PKK Sukapura) | claudepkk@kriya.com | claudelimit |
| Anggota / perajin | claude@kriya.com | claude2026 |
| Pembeli | lihat `reset_dan_seed.sql`, atau daftar sendiri di `/daftar/pembeli` | |

Setelah seed, isi dulu di **Pengaturan posko**:
- WhatsApp posko, untuk notifikasi lunas;
- rekening posko, untuk pencairan dana.

Lalu tambahkan produk di **Produk & katalog** supaya katalog tidak kosong.

> Ganti kata sandi akun demo setelah masa penjurian. Jangan commit file seed yang berisi kata sandi dan data pribadi ke repo publik.

## Pengujian

- **Uji database** (Postgres lokal yang meniru Supabase): lihat [`supabase/tests/README.md`](supabase/tests/README.md). Isinya:
  - RLS dan transaksi;
  - marketplace;
  - akun pembeli, resi, dan pencairan.

  Hasilnya tersimpan di `supabase/tests/hasil_uji*.txt`.
- **Uji unit perhitungan:** `npx tsx --test src/lib/calc.test.ts`

## Batasan & rencana berikutnya

- **Kurir** masih dipesan manual oleh pengurus. Pembeli melacak resi sendiri di situs ekspedisi karena belum ada API pelacakan.
- **Pencairan dana** ke posko masih dicatat manual oleh admin, belum lewat split payment otomatis.
- **Pesanan yang sudah dibayar** belum bisa dibatalkan atau di-refund dari aplikasi. Refund dilakukan lewat dashboard Midtrans.
- **Belum ada:**
  - rating dan ulasan produk;
  - edit profil pembeli;
  - hapus akun mandiri (masih lewat admin).
