# KriyaPKK — ADIKARA 2026

Ekosistem digital bank sampah, produksi kerajinan daur ulang, dan toko online untuk kelompok PKK.
Karya Divisi Inovasi Software, ADIKARA 2026, Fakultas Informatika Telkom University.

Aplikasi live: https://kriya-pkk.vercel.app

## Struktur repositori

```text
adikara-2026/
├── README.md
├── kriya-pkk/            # Aplikasi (Next.js + Supabase), lihat kriya-pkk/README.md
│   ├── src/              # Halaman, komponen, logika bisnis, integrasi
│   ├── supabase/         # Migrasi database dan uji RLS/transaksi beserta hasilnya
│   └── public/           # Ikon PWA
└── docs/                 # Dokumentasi pembuatan software (v2.2), lihat docs/README.md
```

## Dokumentasi

Daftar lengkap ada di [docs/README.md](docs/README.md): BRD, PRD, SRS, FRD, PMP, WBS, SDD, konsep, alur kerja, dan laporan kesesuaian dokumen dengan kode.

| Dokumen | Isi |
|---|---|
| [README aplikasi](kriya-pkk/README.md) | Fitur, arsitektur, cara menjalankan, deploy, pengujian |
| [Hasil uji database](kriya-pkk/supabase/tests/README.md) | Cara menjalankan dan hasil uji RLS |
