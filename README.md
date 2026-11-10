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
└── docs/                 # Dokumentasi pembuatan software
    ├── konsep/           # Konsep, arsitektur, alur kerja posko
    └── spesifikasi/      # BRD, PRD, SRS, FRD, PMP, WBS
```

## Dokumentasi

| Dokumen | Isi |
|---|---|
| [Project lengkap](docs/konsep/project_lengkap.md) | Arsitektur dan solusi |
| [Alur kerja](docs/konsep/flow_cara_kerja_kriyapkk.md) | SOP posko dan alur pengguna |
| [Draft konsep](docs/konsep/concept_draft.md) | Ideasi awal |
| [BRD](docs/spesifikasi/0_BRD.md) | Kebutuhan bisnis |
| [PRD](docs/spesifikasi/1_PRD.md) | Kebutuhan produk |
| [SRS](docs/spesifikasi/2_SRS.md) | Spesifikasi kebutuhan sistem |
| [FRD](docs/spesifikasi/3_FRD.md) | Kebutuhan fungsional |
| [PMP](docs/spesifikasi/4_PMP.md) | Rencana manajemen proyek |
| [WBS](docs/spesifikasi/5_WBS.md) | Rincian pekerjaan |
| [README aplikasi](kriya-pkk/README.md) | Fitur, arsitektur, cara menjalankan, deploy, pengujian |
| [Hasil uji database](kriya-pkk/supabase/tests/README.md) | Cara menjalankan dan hasil uji RLS |
