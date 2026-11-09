# KriyaPKK — ADIKARA 2026

Ekosistem digital bank sampah, produksi kerajinan daur ulang, dan toko online untuk kelompok PKK.
Karya Divisi Inovasi Software, ADIKARA 2026, Fakultas Informatika Telkom University.

Aplikasi live: https://kriya-pkk.vercel.app

## Struktur repositori

```text
adikara-2026/
├── kriya-pkk/        # Kode aplikasi (Next.js + Supabase), lihat kriya-pkk/README.md
│   ├── src/          # Halaman, komponen, logika bisnis, integrasi
│   ├── supabase/     # Migrasi database dan uji RLS/transaksi beserta hasilnya
│   └── public/       # Ikon PWA
└── kriyapkk/         # Dokumentasi pembuatan software
    ├── KRIYAPKK_PROPOSAL_LENGKAP_ADIKARA_2026.md
    ├── konsep_dan_alur/        # Konsep, arsitektur, alur kerja posko
    └── spesifikasi_software/   # BRD, PRD, SRS, FRD, PMP, WBS
```

## Dokumentasi

| Dokumen | Isi |
|---|---|
| [Proposal lengkap](kriyapkk/KRIYAPKK_PROPOSAL_LENGKAP_ADIKARA_2026.md) | Naskah proposal terpadu |
| [Project lengkap](kriyapkk/konsep_dan_alur/project_lengkap.md) | Arsitektur dan solusi |
| [Alur kerja](kriyapkk/konsep_dan_alur/flow_cara_kerja_kriyapkk.md) | SOP posko dan alur pengguna |
| [Draft konsep](kriyapkk/konsep_dan_alur/concept_draft.md) | Ideasi awal |
| [BRD](kriyapkk/spesifikasi_software/0_BRD.md) | Kebutuhan bisnis |
| [PRD](kriyapkk/spesifikasi_software/1_PRD.md) | Kebutuhan produk |
| [SRS](kriyapkk/spesifikasi_software/2_SRS.md) | Spesifikasi kebutuhan sistem |
| [FRD](kriyapkk/spesifikasi_software/3_FRD.md) | Kebutuhan fungsional |
| [PMP](kriyapkk/spesifikasi_software/4_PMP.md) | Rencana manajemen proyek |
| [WBS](kriyapkk/spesifikasi_software/5_WBS.md) | Rincian pekerjaan |
| [README aplikasi](kriya-pkk/README.md) | Fitur, arsitektur, cara menjalankan, deploy, pengujian |
| [Hasil uji database](kriya-pkk/supabase/tests/README.md) | Cara menjalankan dan hasil uji RLS |
