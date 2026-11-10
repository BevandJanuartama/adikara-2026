# Analisis Kesesuaian Dokumentasi dengan Perangkat Lunak KriyaPKK

> **Laporan historis (9 November 2026)** tentang dokumen versi 1.0. Butir di bagian 3.1 sampai 3.3 sudah dikoreksi di dokumen versi 2.2. Yang masih terbuka hanya bagian 3.4 (repositori) dan keputusan di bagian 5. Hasil pemeriksaan terbaru ada di `9_VERIFIKASI_WEB_v2.2.md`.

Tanggal analisis: 9 November 2026
Objek: seluruh dokumen versi 1.0 (sudah dihapus dari repositori, ada di riwayat git: BRD, PRD, SRS, FRD, PMP, WBS, konsep, alur, proposal Markdown) dan README aplikasi.
Pembanding (sumber kebenaran): repositori `BevandJanuartama/adikara-2026`, cabang `main`, commit `aa876a4` (1 November 2026). Kode tidak dijalankan; yang diperiksa adalah isi berkas, migrasi SQL, dan hasil uji yang tersimpan.

## 1. Kesimpulan

**Dokumentasi belum sejalan dengan perangkat lunak.** Dokumen enam seri spesifikasi (BRD sampai WBS) ditulis pada 25 Oktober 2026, sebelum kode dibuat, dan tidak pernah diperbarui. Sesudahnya kode bertambah marketplace, akun pembeli, ongkir, pembayaran Midtrans, notifikasi WhatsApp, dan pencairan dana. Semua itu dinyatakan "di luar lingkup" oleh dokumen.

Akibatnya ada tiga masalah:

1. **Dokumen tertinggal dari kode.** Sekitar sepertiga fungsi sistem (marketplace dan keuangan online) tidak tercatat di FRD/SRS.
2. **Dokumen saling bertentangan.** `7_project_lengkap_v1.0.md` menyebut marketplace bagian dari MVP, sedangkan PRD/SRS/FRD/PMP menyebutnya di luar lingkup. Berkas proposal Markdown dan `9_concept_draft_v1.0.md` memuat prinsip lama yang dibatalkan (AI menaksir harga, olahan makanan, langganan bulanan).
3. **Ada klaim yang tidak ada di kode** (bagian 3). Beberapa juga masuk ke proposal PDF dan pitch deck.

Versi 2.0 dokumen (kini versi 2.1, berkas di folder `docs/`) dibuat dari kode. Setiap fungsi diberi status *Terimplementasi*, *Sebagian*, atau *Rencana*, dan klaim yang belum bisa dibuktikan diberi label *belum diverifikasi*.

## 2. Penilaian per dokumen

| Dokumen | Sesuai kode? | Alasan utama |
|---|---|---|
| `0_BRD_v1.0.md` | Sebagian | Inti bisnis benar. Lingkup salah (marketplace dan logistik "out-of-scope"), model Gemini usang, contoh hitungan tidak cocok dengan aturan aplikasi, BR-03 menyebut upah "wajib minimal" padahal sistem tidak memaksa |
| `1_PRD_v1.0.md` | Sebagian | Lima butir "tidak termasuk" ternyata sudah ada (marketplace, katalog, ongkir, WhatsApp, checkout). Persona warga dengan akses saldo tidak ada |
| `2_SRS_v1.0.md` | Sebagian | Arsitektur menyebut OpenRouter (tidak ada). Entitas data 14 buah, kode punya 17 tabel di migrasi yang berlaku, ditambah `orders` dan `order_items` dari migrasi yang hilang. Beberapa NFR tidak terbukti |
| `3_FRD_v1.0.md` | Sebagian | FR01 sampai FR37 umumnya benar, tetapi tujuh butir berbeda dari kode (FR03, FR07, FR12, FR23, FR31, FR33, FR37), satu belum ada (FR17), dan tidak ada FR untuk marketplace (21 fungsi baru) |
| `4_PMP_v1.0.md` | Tidak | Jadwal 4 hari dan lingkup "tanpa marketplace" sudah tidak berlaku. Tidak ada realisasi |
| `5_WBS_v1.0.md` | Tidak | Sama; butir 10.4 (OpenRouter), 5.3, 11.4, 11.5 tidak dikerjakan |
| `7_project_lengkap_v1.0.md` | Sebagian | Alur dan prinsip benar, tetapi zona ongkir, Nominatim, pembagian 95:5, dan komisi tidak ada di kode |
| `8_flow_cara_kerja_v1.0.md` | Sebagian | AI "menaksir harga" bertentangan dengan aturan sistem. Contoh hitungan tidak memakai aturan aplikasi. Pembeli "pesan lewat WhatsApp" sudah diganti checkout online |
| `9_concept_draft_v1.0.md` | Tidak | Draf awal (AI menaksir harga, olahan makanan, langganan bulanan). Layak diarsipkan |
| `9_proposal_lengkap_v1.0.md` | Tidak | Next.js 15, Gemini 1.5, skema SQL lain, AI menaksir harga, margin 20 sampai 30 persen, sisa pangan, jelantah. Digantikan oleh proposal PDF |
| `kriya-pkk/README.md` | Sebagian | Paling akurat. Merujuk berkas yang tidak ada (`docs/`, migrasi `0002`, seed, `.env.example`), dan menyebut Leaflet |
| `README.md` (akar) | Sebagian | Tautan `file:///d:/...` tidak berfungsi di GitHub |

## 3. Temuan utama

Kolom "Bukti" menunjuk berkas atau fungsi di repositori.

### 3.1 Klaim dokumen yang tidak ada di kode

| ID | Klaim | Fakta di kode | Bukti | Dampak |
|---|---|---|---|---|
| T-01 | Pembagian dana 95% kas PKK dan 5% komisi platform "dicatat di ledger" (`7_project_lengkap_v1.0` bagian 6 dan 7); proposal PDF dan pitch deck menyebut "ledger 95% : 5%" | Tidak ada logika komisi. Saldo posko = pesanan lunas (produk + ongkir) dikurangi pencairan dan biaya yang diisi admin saat pencairan. Komisi 5% hanya rencana (BRD 8.1 butir 3: "tahap lanjut") | `_saldo_platform` di `0004_akun_pembeli.sql:365`; pencarian `komisi`, `0.05`, `0.95` di `src/` dan `supabase/` tidak menemukan logika | **Tinggi.** Klaim fitur yang tidak ada |
| T-02 | Cadangan AI memakai OpenRouter (SRS bagian 3 dan 4, WBS 10.4, proposal, pitch deck) | Tidak ada satu pun rujukan OpenRouter. Cadangannya model Gemini kedua (`GEMINI_MODEL_FALLBACK`) | `src/lib/ai/gemini.ts:27`; pencarian `openrouter` kosong | **Tinggi** |
| T-03 | Peta memakai Leaflet; geocoding memakai Nominatim OpenStreetMap | Peta berupa iframe `openstreetmap.org/export/embed` dan tautan Google Maps. Lokasi lewat GPS peramban (`navigator.geolocation`) atau tempel koordinat. Tidak ada Leaflet dan tidak ada Nominatim | `src/components/toko/lokasi-input.tsx`, `src/lib/marketplace/geo.ts`, `package.json` | Sedang |
| T-04 | Ongkir dibagi tiga zona (0 sampai 10, 10 sampai 50, 50 sampai 150 km); tarif per zona diatur pengurus; ada kurir lokal dan COD; ongkir maksimal 30% harga produk; gratis ongkir; minimal belanja zona 3 | Tidak ada zona. Tarif dari rumus per layanan ekspedisi yang tertanam di kode (`MATRIKS`), tidak bisa diubah pengurus. Hanya dua metode: ambil di posko atau ekspedisi. Tidak ada batas 30%, gratis ongkir, maupun minimal belanja | `src/lib/marketplace/ongkir-manual.ts`, `create_order` di `0004_akun_pembeli.sql:219` | Sedang |
| T-05 | Batas garis lurus sekitar 100 km sebagai pengganti 150 km jarak jalan | Batas 150 km garis lurus. Jarak yang ditagih = garis lurus x 1,3 | `MAKS_JARAK_KM = 150`; `FAKTOR_JALAN = 1.3` | Rendah |
| T-06 | 20 sampai 30 template ide; AI hanya menyesuaikan jumlah dan bahan template (FR23) | 13 template, dipakai sebagai mode manual (`create_idea_from_template`). AI tidak memakai template | `0001_kriyapkk_schema.sql:1318` dan seterusnya | Rendah |
| T-07 | Peringatan stok menumpuk atau menipis (FR17, prioritas C) | Tidak ada | pencarian `menipis`, `menumpuk`, `ambang` kosong | Rendah (prioritas C) |
| T-08 | Foto diakses melalui signed URL (NFR06) | Tidak ada `createSignedUrl`. Bucket privat dengan kebijakan per kelompok; foto diunggah dari peramban dan diunduh server untuk scan | `src/app/api/scan/route.ts:23` | Rendah |
| T-09 | Uji akurasi scan AI pada 20 sampai 30 foto; uji kegunaan (SUS) | Tidak ada laporan atau data uji di repositori | `supabase/tests/` hanya uji database | Sedang (bukti validasi) |
| T-10 | Konsep: poin sembako, estimasi jejak karbon (CO2e), Supabase Edge Functions, Next.js 15, Gemini 1.5 Flash | Tidak ada poin sembako dan tidak ada hitungan CO2. Edge Functions tidak dipakai. Next.js 16.4.3, model lewat env (bawaan `gemini-3.5-flash-lite`) | `package.json`, README aplikasi | Rendah |
| T-11 | "Tarif ongkir diatur sendiri oleh pengurus dalam tabel sederhana" (`7_project_lengkap_v1.0` bagian 8) | Tarif tertanam di kode. Jalur lain: Biteship (mode `ONGKIR_MODE=biteship`, opsional) | `src/lib/marketplace/ongkir.ts` | Sedang |
| T-12 | Dashboard menampilkan "komisi platform"; "Tabungan Sampah Hari Raya" pencairan per 3 bulan (BRD risiko) | Tidak ada keduanya | pencarian kosong | Rendah |

### 3.2 Fungsi yang ada di kode tetapi tidak ada di spesifikasi

Tidak tercatat di PRD/SRS/FRD, dan malah disebut "di luar lingkup":

1. Peran **pembeli** (akun tanpa kelompok), pendaftaran pembeli, halaman privasi (UU No. 27 Tahun 2022) dan persetujuan saat mendaftar.
2. Profil toko posko (slug, WhatsApp, kota, kode pos, titik lokasi, buka atau tutup toko) dan rekening posko.
3. Manajemen produk (kategori kuliner, kerajinan, pupuk, kebersihan; berat; ukuran kemasan; tampil di katalog; foto di bucket publik `produk`).
4. Katalog publik (daftar lintas posko, filter, pencarian, detail), keranjang di peramban, checkout.
5. Ongkir manual dan Biteship; berat volumetrik (P x L x T / 6000).
6. Pembayaran Midtrans Snap (QRIS dan virtual account, batas 60 menit), webhook bertanda tangan SHA512, verifikasi ulang status ke API Midtrans, nominal harus sama dengan tagihan, notifikasi ganda tidak dicatat dua kali.
7. WhatsApp ke posko saat pesanan lunas (Fonnte).
8. Status pesanan (menunggu bayar, dibayar, diproses, dikirim, siap diambil, selesai, batal, kedaluwarsa, gagal), nomor resi wajib saat dikirim, pesanan kedaluwarsa otomatis (stok kembali).
9. Pesanan saya (pembeli) dan Pesanan online (pengurus).
10. Dana online: saldo posko, pencairan oleh admin (jumlah, biaya, referensi), halaman admin pencairan.
11. Mode simulasi pembayaran (`SIMULASI_PEMBAYARAN`) untuk uji sandbox.
12. Cron harian `keepalive` (menjaga Supabase gratis aktif dan menutup pesanan kedaluwarsa), `/api/diagnosa`.
13. Mode suara panduan (Web Speech API), PWA, ekspor CSV buku kas.

### 3.3 Aturan dan angka yang berbeda

| ID | Dokumen | Isi dokumen | Isi kode |
|---|---|---|---|
| A-01 | FRD FR07 | Foto akhir kurang dari 500 KB | Kompresi 768 px, JPEG 70%; batas keras 1 MB (bucket dan API); format JPEG, PNG, WebP |
| A-02 | FRD FR12 | Saat setoran disetujui: saldo warga, stok, dan kas bertambah dalam satu transaksi | Stok selalu bertambah. Lalu **salah satu**: saldo warga naik, atau (bila dibayar tunai) kas keluar `pembelian_setoran`. Kas tidak tercatat saat hanya masuk saldo; baru tercatat saat saldo ditarik |
| A-03 | BRD BR-03 | Upah wajib minimal Rp10.000 sampai Rp15.000 per jam | Bawaan Rp12.500 per jam, bisa diubah pengurus, tidak ada batas minimum (hanya tidak boleh negatif) |
| A-04 | Proposal Markdown | Margin bawaan 20 sampai 30% | Margin bawaan 40% (0 sampai 300%), harga dibulatkan ke atas Rp500, ditambah porsi alat per unit (bawaan Rp500) |
| A-05 | BRD 8.3 | Bahan limbah 300 g kain perca = Rp1.500 | Harga bawaan kain perca Rp3.000 per kg, jadi Rp900 |
| A-06 | Flow bagian 6 | HPP Rp10.750, harga jual Rp18.000 | Aturan aplikasi memasukkan porsi alat. Untuk template Pouch: HPP Rp11.250, harga jual Rp16.000 (sama dengan contoh di halaman depan aplikasi) |
| A-07 | FRD FR33 | Kuota harian dibagi dua jenis | Tiga jenis dicatat (scan, ide, panduan). Panduan memakai batas kuota ide (10 per hari), dihitung sendiri |
| A-08 | FRD FR35 | Cache AI | Cache **lintas kelompok** (tabel `ai_cache` tanpa `group_id`; dibaca semua anggota aktif); aman karena bukan data pribadi |
| A-09 | FRD FR37 | Panel admin menampilkan estimasi biaya per kelompok | Menampilkan panggilan hari ini, 30 hari, dan token. Tidak ada estimasi biaya |
| A-10 | FRD FR31 | Ekspor CSV buku kas dan laba rugi | Hanya buku kas |
| A-11 | FRD FR03 | Akun anggota dibuat dengan email atau nomor HP | Email dan kata sandi minimal 8 karakter, peran anggota atau pengurus; tidak ada pendaftaran lewat HP |
| A-12 | SRS 6 | 14 entitas | 17 tabel di migrasi yang berlaku (16 di `0001` ditambah `platform_payouts`), ditambah `orders` dan `order_items` (migrasi 0002 hilang); `finished_goods` dipakai sebagai produk katalog. Catatan: pencarian `create table` menemukan 18 karena `rate_limits` milik migrasi yang dibatalkan |
| A-13 | README aplikasi | Pesanan kedaluwarsa dalam 60 menit | Batas pembayaran Snap 60 menit; pembersihan pesanan yang ditinggal 90 menit (`create_order` dan cron) |
| A-14 | SRS NFR01 | Scan kurang dari 8 detik | Tidak diukur. Batas teknis 12 detik per model, 30 detik per fungsi |
| A-15 | PRD, BRD | Warga dapat melihat saldo | Warga tidak punya akun; saldo hanya dilihat pengurus |
| A-16 | BRD 6.2 | Sertifikasi P-IRT/BPOM untuk pangan di luar lingkup | Katalog menerima kategori **kuliner** dan pupuk. Perlu keputusan tim |

### 3.4 Ketidaksesuaian repositori

| ID | Masalah | Dampak |
|---|---|---|
| R-01 | `supabase/migrations/0002_marketplace.sql` tidak ada. Migrasi 0003 dan 0004 mengubah tabel `orders` yang dibuat di sana. Tabel `orders`, `order_items`, tujuh fungsi (`attach_payment`, `close_order`, `expire_stale_orders`, `expire_my_stale_orders`, `katalog_list`, `katalog_detail`, `set_midtrans_status`) dan fungsi bantu (`distance_km`, `_normalize_wa`, `_return_order_stock`) tidak terlihat | Basis data **tidak bisa dibangun ulang** dari repositori |
| R-02 | `reset_dan_seed.sql`, `seed_akun_demo.sql`, `.env.example`, `docs/`, `20_marketplace_test.sql`, `01_stub_auth_tambahan.sql`, `hasil_uji_marketplace.txt` dirujuk README tetapi tidak ada | Petunjuk instalasi tidak bisa diikuti |
| R-03 | Ada dua migrasi bernomor 0004. `0004_kelengkapan_toko.sql` adalah pembaruan yang dibatalkan (dibersihkan oleh `0004_akun_pembeli.sql`), tetapi masih ada beserta tesnya | Membingungkan; jangan dijalankan |
| R-04 | README aplikasi memuat kata sandi akun demo | **Repositori ini publik** (diperiksa 10 November 2026), sehingga kata sandi akun demo terbuka untuk siapa pun. Ganti setelah masa penjurian atau pindahkan ke dokumen terpisah |
| R-05 | Tidak ada pembatasan laju (rate limit), captcha, atau header keamanan di `next.config.ts`; rate limit di `0004_kelengkapan_toko.sql` dibatalkan | Risiko penyalahgunaan endpoint publik |
| R-06 | Uji unit hanya 3 kasus (`calc.test.ts`); uji database dijalankan manual; tidak ada CI | Regresi tidak tertangkap otomatis |

### 3.5 Hal yang sudah benar

Prinsip berikut sesuai antara dokumen dan kode (diverifikasi): AI hanya mengenali jenis dan kondisi, harga dari tabel per kg; harga setoran tidak ditentukan AI; stok memakai nilai rata-rata tertimbang; buku kas hanya ditambah dan dikoreksi dengan entri pembalik; kuota harian dan cache AI; mode manual saat AI gagal; RLS per kelompok; kunci rahasia hanya di server; ide hanya tampil di atas bila stok cukup; panduan dibuat sekali lalu disimpan; kompresi foto 768 px; formula harga jual dan pembulatan Rp500; empat peran akun; Haversine; batas 150 km.

## 4. Tindakan yang dilakukan pada v2.0

| Dokumen v2 | Perubahan |
|---|---|
| `0_BRD_v2.2.md` | Lingkup disesuaikan; model Gemini; aturan bisnis BR-03 diperbaiki, BR-05 sampai BR-11 ditambah; contoh unit economics memakai aturan aplikasi; komisi 5% ditandai rencana |
| `1_PRD_v2.2.md` | Ruang lingkup tiga tingkat (ada, sebagian, rencana); persona pembeli; metrik ditandai belum diukur |
| `2_SRS_v2.2.md` | Arsitektur sesuai kode; 18 tabel dan entitas pesanan; NFR diberi status verifikasi; kebutuhan antarmuka Midtrans, Fonnte, Biteship |
| `3_FRD_v2.2.md` | FR01 sampai FR37 diberi status dan dikoreksi; FR38 sampai FR58 baru untuk marketplace |
| `4_PMP_v2.2.md`, `5_WBS_v2.2.md` | Menjadi rencana dan realisasi (25 Oktober sampai 1 November) dengan status per butir |
| `6_SDD_v2.2.md` | **Baru**: arsitektur, model data, katalog fungsi, keamanan, alur, keputusan desain, utang teknis |
| `7_project_lengkap_v2.2.md`, `8_flow_cara_kerja_v2.2.md` | Disesuaikan; contoh hitungan memakai aturan aplikasi |

Dokumen **tidak diubah** dan hanya disimpan sebagai arsip: `9_concept_draft_v1.0.md` dan `9_proposal_lengkap_v1.0.md` (digantikan proposal PDF).

## 5. Keputusan yang dibutuhkan dari tim

1. **Komisi 5% dan pembagian 95:5.** Implementasikan di kode, atau ubah proposal dan pitch deck menjadi "rencana tahap lanjut". v2.0 memilih jalur kedua karena itu yang benar sekarang.
2. **OpenRouter.** Hapus dari proposal dan pitch deck, atau implementasikan sebagai penyedia cadangan kedua.
3. **Kategori kuliner dan pupuk di katalog.** Pertahankan (dengan catatan risiko P-IRT), atau batasi ke kerajinan dan kebersihan.
4. **Berkas yang hilang** (R-01 dan R-02). Tambahkan `0002_marketplace.sql`, seed, dan `.env.example` ke repositori.
5. **Pembatasan laju** untuk endpoint publik sebelum dibuka ke umum.
