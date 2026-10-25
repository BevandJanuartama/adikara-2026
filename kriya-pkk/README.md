# KriyaPKK

Ekosistem digital pengelolaan sampah anorganik & ekonomi kreatif berbasis AI untuk kelompok PKK.
Karya Divisi Inovasi Software — ADIKARA 2026, Fakultas Informatika Telkom University.

**Aplikasi live:** https://<isi-url-vercel>.vercel.app · **Video demo:** <isi-link> · **Tim:** <nama tim>

## Masalah & solusi singkat

Kelompok PKK menerima setoran sampah anorganik warga, tetapi kesulitan menilai harga secara adil,
mencatat stok, menentukan produk kerajinan yang layak dibuat, dan menghitung modal serta laba.
KriyaPKK menggabungkan **kasir setoran**, **ERP mini**, dan **penasihat produksi AI** dalam satu aplikasi web (PWA).

## Fitur utama

| Modul | Isi | FR |
|---|---|---|
| Mitra & akun | Daftar kelompok, aktivasi admin, akun anggota, peran pengurus/anggota/admin | FR01–04, FR36 |
| Setoran & scan AI | Foto → AI kenali jenis/kondisi/kelayakan → koreksi manual → berat → persetujuan warga | FR07–14 |
| Stok | Stok per jenis dengan nilai rata-rata tertimbang | FR15–16 |
| Dapur kreasi | Ide kerajinan dari stok (AI / template), modal, harga jual, panduan + suara | FR18–23 |
| Produksi | Batch, pengurangan stok otomatis, hasil & unit gagal, upah anggota | FR24–26 |
| Penjualan & kas | Penjualan manual, stok produk jadi, buku kas append-only, laba rugi, ekspor CSV | FR27–31 |
| Dampak | Kg sampah, rupiah ke warga, produk, laba, tren bulanan | FR32 |
| Kuota & cache AI | Kuota harian per kelompok, cache hasil, mode manual saat AI gagal | FR33–35 |

## Arsitektur

```
Browser (Next.js App Router, PWA, Tailwind, shadcn/ui)
   │  Server Components / Server Actions / Route Handlers (Vercel)
   ├── /api/scan, /api/ideas, /api/guide ──► Gemini API (JSON berskema, timeout, 1x ulang, cache, kuota)
   └── Supabase
        ├── Auth (email + kata sandi)
        ├── Postgres + Row Level Security per group_id
        │     └── Fungsi RPC atomik: create/approve_deposit, start/finish_batch, pay_wages, record_sale, ...
        └── Storage bucket privat "photos" (path diawali group_id)
```

Keputusan desain penting:
- **Harga tidak ditentukan AI.** AI hanya mengenali jenis & kondisi; nilai = berat × tabel harga pengurus.
- **Semua perubahan saldo, stok, dan kas lewat fungsi database** dalam satu transaksi; klien tidak punya izin
  menulis langsung ke tabel tersebut. Koreksi kas memakai entri pembalik (tidak ada hapus).
- **Isolasi data antar kelompok** dijamin RLS di database, bukan hanya di UI.
- **Hemat token:** foto dikompres di browser (768 px), cache per hash foto/ringkasan stok, panduan dibuat
  hanya saat dipilih, kuota harian, model Flash-Lite sebagai default.

## Teknologi

Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Postgres, Auth, Storage, RLS) ·
Google Gemini API (`@google/genai`) · Zod · Vercel. Seluruh layanan memakai paket gratis.

## Menjalankan secara lokal

Prasyarat: Node.js 20.9+ dan akun Supabase + Google AI Studio.

```bash
git clone https://github.com/<akun>/kriyapkk.git
cd kriyapkk
npm install
cp .env.example .env.local   # isi kunci Supabase & Gemini
npm run dev                  # buka http://localhost:3000
```

Database: buka Supabase → SQL Editor → jalankan `supabase/migrations/0001_kriyapkk_schema.sql`.

Uji unit perhitungan: `npx tsx --test src/lib/calc.test.ts`

## Akun demo

| Peran | Email | Kata sandi |
|---|---|---|
| Pengurus | <isi> | <isi> |
| Anggota | <isi> | <isi> |

## Struktur folder

```
src/app/(app)/      halaman setelah login (beranda, setoran, stok, ide, produksi, produk, kas, laporan, ...)
src/app/api/        route AI (scan, ideas, guide), ekspor CSV, keepalive
src/lib/supabase/   klien Supabase (browser, server, proxy, admin)
src/lib/ai/         klien Gemini, skema JSON + Zod, cache & kuota
supabase/migrations skema database, RLS, fungsi RPC, storage, template ide
docs/               PRD, SRS, FRD, PMP, WBS
```
