# Analisis Kesesuaian Dokumentasi dengan Perangkat Lunak KriyaPKK

Dibuat: 9 November 2026 (terhadap dokumen versi 1.0)
Diperbarui: 10 November 2026 (status tiap temuan disamakan dengan dokumentasi versi 2.2)

Laporan ini mencatat selisih antara dokumen awal (versi 1.0) dan perangkat lunak. Kolom **Status** di setiap tabel menunjukkan keadaan terbaru. Hasil pemeriksaan dokumen 2.2 terhadap kode dan web live ada di [9_VERIFIKASI_WEB_v2.2.md](9_VERIFIKASI_WEB_v2.2.md).

Objek: dokumen versi 1.0 (BRD, PRD, SRS, FRD, PMP, WBS, konsep, alur kerja, proposal Markdown) dan README aplikasi. Dokumen itu sudah dihapus dari repositori dan hanya ada di riwayat git cabang `main`, yaitu di `kriyapkk/spesifikasi_software/` dan `kriyapkk/konsep_dan_alur/`. Proposal Markdown ada di `kriyapkk/KRIYAPKK_PROPOSAL_LENGKAP_ADIKARA_2026.md` (dihapus pada commit `8c4a535`). Penamaan `..._v1.0.md` di laporan ini hanyalah label.

Pembanding (sumber kebenaran): repositori `BevandJanuartama/adikara-2026`, cabang `main`, commit `aa876a4` (1 November 2026). Kode tidak dijalankan; yang diperiksa adalah isi berkas, migrasi SQL, dan hasil uji yang tersimpan.

## 1. Kesimpulan

### 1.1 Keadaan pada 9 November (dokumen 1.0)

Dokumen 1.0 belum sejalan dengan perangkat lunak. Enam dokumen spesifikasi (BRD sampai WBS) ditulis pada 25 Oktober 2026, sebelum kode dibuat, dan tidak diperbarui. Sesudahnya kode bertambah marketplace, akun pembeli, ongkir, pembayaran Midtrans, notifikasi WhatsApp, dan pencairan dana. Dokumen menyebut semuanya "di luar lingkup".

Tiga masalah yang ditemukan:

1. **Dokumen tertinggal dari kode.** Sekitar sepertiga fungsi (marketplace dan keuangan online) tidak tercatat di FRD dan SRS.
2. **Dokumen saling bertentangan.** `7_project_lengkap_v1.0.md` memasukkan marketplace ke MVP, sedangkan PRD, SRS, FRD, dan PMP menyebutnya di luar lingkup. Proposal Markdown dan `9_concept_draft_v1.0.md` memuat prinsip lama yang dibatalkan (AI menaksir harga, olahan makanan, langganan bulanan).
3. **Ada klaim yang tidak ada di kode** (bagian 3.1).

### 1.2 Keadaan sekarang (dokumen 2.2)

Seluruh selisih di bagian 3.1 sampai 3.3 sudah dikoreksi di dokumen 2.2. Dokumen 2.2 dibuat dari kode, setiap fungsi diberi status (Ada, Sebagian, Belum atau Rencana), dan klaim yang belum terbukti diberi label *belum diverifikasi* atau *belum diukur*.

Yang masih terbuka bukan di dokumen, melainkan di repositori dan keputusan tim: bagian 3.4 dan bagian 5.

## 2. Penilaian per dokumen (keadaan 9 November)

| Dokumen | Sesuai kode? | Alasan utama | Pengganti sekarang |
|---|---|---|---|
| `0_BRD_v1.0.md` | Sebagian | Inti bisnis benar. Lingkup salah (marketplace dan logistik "out-of-scope"), model Gemini usang, contoh hitungan tidak cocok dengan aturan aplikasi, BR-03 menyebut upah "wajib minimal" padahal sistem tidak memaksa | `0_BRD_v2.2.md` |
| `1_PRD_v1.0.md` | Sebagian | Lima butir "tidak termasuk" ternyata sudah ada (marketplace, katalog, ongkir, WhatsApp, checkout). Persona warga dengan akses saldo tidak ada | `1_PRD_v2.2.md` |
| `2_SRS_v1.0.md` | Sebagian | Arsitektur menyebut OpenRouter (tidak ada). Entitas data 14 buah, kode punya 17 tabel di migrasi yang berlaku, ditambah `orders` dan `order_items` dari migrasi yang hilang. Beberapa NFR tidak terbukti | `2_SRS_v2.2.md` |
| `3_FRD_v1.0.md` | Sebagian | FR01 sampai FR37 umumnya benar, tetapi tujuh butir berbeda dari kode (FR03, FR07, FR12, FR23, FR31, FR33, FR37), satu belum ada (FR17), dan tidak ada FR untuk marketplace (21 fungsi baru) | `3_FRD_v2.2.md` (FR01 sampai FR58) |
| `4_PMP_v1.0.md` | Tidak | Jadwal 4 hari dan lingkup "tanpa marketplace" sudah tidak berlaku. Tidak ada realisasi | `4_PMP_v2.2.md` |
| `5_WBS_v1.0.md` | Tidak | Sama; butir 10.4 (OpenRouter), 5.3, 11.4, 11.5 tidak dikerjakan | `5_WBS_v2.2.md` |
| `7_project_lengkap_v1.0.md` | Sebagian | Alur dan prinsip benar, tetapi zona ongkir, Nominatim, pembagian 95:5, dan komisi tidak ada di kode | `7_project_lengkap_v2.2.md` |
| `8_flow_cara_kerja_v1.0.md` | Sebagian | AI "menaksir harga" bertentangan dengan aturan sistem. Contoh hitungan tidak memakai aturan aplikasi. Pembeli "pesan lewat WhatsApp" sudah diganti checkout online | `8_flow_cara_kerja_v2.2.md` |
| `9_concept_draft_v1.0.md` | Tidak | Draf awal (AI menaksir harga, olahan makanan, langganan bulanan) | Tidak ada; dihapus dari repositori |
| `9_proposal_lengkap_v1.0.md` | Tidak | Next.js 15, Gemini 1.5, skema SQL lain, AI menaksir harga, margin 20 sampai 30 persen, sisa pangan, jelantah | Tidak ada; dihapus dari repositori, digantikan proposal PDF |
| `kriya-pkk/README.md` | Sebagian | Paling akurat. Merujuk berkas yang tidak ada (migrasi `0002`, seed, `.env.example`) dan folder `docs/` yang saat itu belum ada | Rujukan ke `docs/` sudah diperbaiki pada 10 November; rujukan ke berkas yang hilang masih ada (R-02) |
| `README.md` (akar) | Sebagian | Tautan `file:///d:/...` tidak berfungsi di GitHub | Ditulis ulang; tautan relatif |

Catatan koreksi: laporan 9 November menulis bahwa README aplikasi "menyebut Leaflet". Pemeriksaan ulang pada 10 November tidak menemukan kata itu di README maupun di seluruh `kriya-pkk/`. Klaim Leaflet hanya ada di dokumen konsep dan proposal.

## 3. Temuan utama

Kolom "Bukti" menunjuk berkas atau fungsi di repositori (nomor baris diperiksa ulang pada 10 November).

### 3.1 Klaim dokumen yang tidak ada di kode

| ID | Klaim | Fakta di kode | Bukti | Dampak | Status |
|---|---|---|---|---|---|
| T-01 | Pembagian dana 95% kas PKK dan 5% komisi platform "dicatat di ledger" (`7_project_lengkap_v1.0` bagian 6 dan 7) | Tidak ada logika komisi. Saldo posko = pesanan lunas (produk + ongkir) dikurangi pencairan dan biaya yang diisi admin saat pencairan. Komisi 5% hanya rencana | `_saldo_platform` di `0004_akun_pembeli.sql:365`; pencarian `komisi`, `0.05`, `0.95` di `src/` dan `supabase/` tidak menemukan logika | **Tinggi.** Klaim fitur yang tidak ada | Dokumen: dikoreksi (BRD 8.1, PRD 9, konsep bagian 7, FR55). Proposal: lihat catatan di bawah tabel |
| T-02 | Cadangan AI memakai OpenRouter (SRS bagian 3 dan 4, WBS 10.4) | Tidak ada rujukan OpenRouter. Cadangannya model Gemini kedua (`GEMINI_MODEL_FALLBACK`) | `src/lib/ai/gemini.ts:7-8`; pencarian `openrouter` kosong | **Tinggi** | Dokumen: dikoreksi (SRS 3, WBS 10.4 "tidak dikerjakan") |
| T-03 | Peta memakai Leaflet; geocoding memakai Nominatim OpenStreetMap | Peta berupa iframe `openstreetmap.org/export/embed` dan tautan Google Maps. Lokasi lewat GPS peramban (`navigator.geolocation`) atau tempel koordinat | `src/components/toko/lokasi-input.tsx`, `src/lib/marketplace/geo.ts`, `package.json` | Sedang | Dikoreksi (SRS 4.3, konsep bagian 8 dan 11) |
| T-04 | Ongkir dibagi tiga zona (0 sampai 10, 10 sampai 50, 50 sampai 150 km); tarif per zona diatur pengurus; ada kurir lokal dan COD; ongkir maksimal 30% harga produk; gratis ongkir; minimal belanja zona 3 | Tidak ada zona. Tarif dari rumus per layanan ekspedisi yang tertanam di kode (`MATRIKS`), tidak bisa diubah pengurus. Hanya dua metode: ambil di posko atau ekspedisi. Tidak ada batas 30%, gratis ongkir, maupun minimal belanja | `src/lib/marketplace/ongkir-manual.ts`; `create_order` di `0004_akun_pembeli.sql:191` | Sedang | Dikoreksi (FR45, FR46, konsep bagian 8) |
| T-05 | Batas garis lurus sekitar 100 km sebagai pengganti 150 km jarak jalan | Batas 150 km garis lurus. Jarak yang ditagih = garis lurus x 1,3 | `MAKS_JARAK_KM = 150` di `geo.ts:2`; `FAKTOR_JALAN = 1.3` di `ongkir-manual.ts:9` | Rendah | Dikoreksi (BR-08, FR46) |
| T-06 | 20 sampai 30 template ide; AI hanya menyesuaikan jumlah dan bahan template (FR23) | 13 template, dipakai sebagai mode manual (`create_idea_from_template`). AI tidak memakai template | `0001_kriyapkk_schema.sql:1318` dan seterusnya | Rendah | Dikoreksi (FR23, status Sebagian) |
| T-07 | Peringatan stok menumpuk atau menipis (FR17, prioritas C) | Tidak ada | pencarian `menipis`, `menumpuk`, `ambang` kosong | Rendah | Dicatat sebagai Belum (FR17, WBS 5.3) |
| T-08 | Foto diakses melalui signed URL (NFR06) | Tidak ada `createSignedUrl`. Bucket privat dengan kebijakan per kelompok; foto diunggah dari peramban dan diunduh server untuk scan | `src/app/api/scan/route.ts:23` | Rendah | Dikoreksi (NFR06 status Sebagian) |
| T-09 | Uji akurasi scan AI pada 20 sampai 30 foto; uji kegunaan (SUS) | Tidak ada laporan atau data uji di repositori | `supabase/tests/` hanya uji database | Sedang (bukti validasi) | Dicatat sebagai Belum (WBS 11.4 dan 11.5). **Masih terbuka**: ujinya belum dilakukan |
| T-10 | Konsep: poin sembako, estimasi jejak karbon (CO2e), Supabase Edge Functions, Next.js 15, Gemini 1.5 Flash | Tidak ada poin sembako dan tidak ada hitungan CO2. Edge Functions tidak dipakai. Next.js 16.4.3, model lewat env (bawaan `gemini-3.5-flash-lite`) | `package.json`, `src/lib/ai/gemini.ts` | Rendah | Dikoreksi (konsep bagian 11, FR32) |
| T-11 | "Tarif ongkir diatur sendiri oleh pengurus dalam tabel sederhana" (`7_project_lengkap_v1.0` bagian 8) | Tarif tertanam di kode. Jalur lain: Biteship (mode `ONGKIR_MODE=biteship`, opsional) | `src/lib/marketplace/ongkir.ts` | Sedang | Dikoreksi (konsep bagian 8, SDD bagian 9) |
| T-12 | Dashboard menampilkan "komisi platform"; "Tabungan Sampah Hari Raya" pencairan per 3 bulan (BRD risiko) | Tidak ada keduanya | pencarian kosong | Rendah | Dikoreksi (BRD bagian 10, FR32, FR55) |

**Catatan tentang proposal.** Diperiksa pada 10 November, hanya untuk kata kunci tertentu, pada berkas `.docx` di folder `proposal/` lokal (bukan bagian repositori GitHub):

- Proposal ver10 (arsip) memuat OpenRouter (5 kali), Leaflet (3), Nominatim (3), dan pembagian 95:5 (7).
- Proposal ver11 dan dua berkas di `siap_kumpul/` tidak memuat satupun dari kata itu. Komisi 5% di sana ditulis sebagai rencana yang "belum berjalan pada MVP".
- Belum diperiksa: berkas PDF proposal, pitch deck, dan isi lengkap proposal selain kata kunci di atas.

### 3.2 Fungsi yang ada di kode tetapi tidak ada di spesifikasi 1.0

Tidak tercatat di PRD, SRS, dan FRD 1.0, dan malah disebut "di luar lingkup". Semuanya kini tercatat di FRD 2.2:

| No | Fungsi | Tercatat di |
|---|---|---|
| 1 | Peran **pembeli** (akun tanpa kelompok), pendaftaran pembeli, halaman privasi (UU No. 27 Tahun 2022) dan persetujuan saat mendaftar | FR42, FR44 |
| 2 | Profil toko posko (slug, WhatsApp, kota, kode pos, titik lokasi, buka atau tutup toko) dan rekening posko | FR38, FR39 |
| 3 | Manajemen produk (kategori kuliner, kerajinan, pupuk, kebersihan; berat; ukuran kemasan; tampil di katalog; foto di bucket publik `produk`) | FR40 |
| 4 | Katalog publik (daftar lintas posko, filter, pencarian, detail), keranjang di peramban, checkout | FR41, FR43, FR45, FR47 |
| 5 | Ongkir manual dan Biteship; berat volumetrik (P x L x T / 6000) | FR46 |
| 6 | Pembayaran Midtrans Snap (QRIS dan virtual account, batas 60 menit), webhook bertanda tangan SHA512, verifikasi ulang status ke API Midtrans, nominal harus sama dengan tagihan, notifikasi ganda tidak dicatat dua kali | FR48, FR49 |
| 7 | WhatsApp ke posko saat pesanan lunas (Fonnte) | FR50 |
| 8 | Status pesanan (menunggu bayar, dibayar, diproses, dikirim, siap diambil, selesai, batal, kedaluwarsa, gagal), nomor resi wajib saat dikirim, pesanan kedaluwarsa otomatis (stok kembali) | FR51, FR53 |
| 9 | Pesanan saya (pembeli) dan Pesanan online (pengurus) | FR52, FR53 |
| 10 | Dana online: saldo posko, pencairan oleh admin (jumlah, biaya, referensi), halaman admin pencairan | FR55, FR56, FR57 |
| 11 | Mode simulasi pembayaran (`SIMULASI_PEMBAYARAN`) untuk uji sandbox | FR54 |
| 12 | Cron harian `keepalive` (menjaga Supabase gratis aktif dan menutup pesanan kedaluwarsa), `/api/diagnosa` | FR58 |
| 13 | Mode suara panduan (Web Speech API), PWA, ekspor CSV buku kas | FR22, SRS bagian 3, FR31 |

### 3.3 Aturan dan angka yang berbeda

| ID | Dokumen | Isi dokumen | Isi kode | Status |
|---|---|---|---|---|
| A-01 | FRD FR07 | Foto akhir kurang dari 500 KB | Kompresi 768 px, JPEG 70%; batas keras 1 MB (bucket dan API); format JPEG, PNG, WebP | Dikoreksi (FR07) |
| A-02 | FRD FR12 | Saat setoran disetujui: saldo warga, stok, dan kas bertambah dalam satu transaksi | Stok selalu bertambah. Lalu **salah satu**: saldo warga naik, atau (bila dibayar tunai) kas keluar `pembelian_setoran`. Kas tidak tercatat saat hanya masuk saldo; baru tercatat saat saldo ditarik | Dikoreksi (FR12, FR13) |
| A-03 | BRD BR-03 | Upah wajib minimal Rp10.000 sampai Rp15.000 per jam | Bawaan Rp12.500 per jam, bisa diubah pengurus, tidak ada batas minimum (hanya tidak boleh negatif) | Dikoreksi (BR-03, FR06) |
| A-04 | Proposal Markdown | Margin bawaan 20 sampai 30% | Margin bawaan 40% (0 sampai 300%), harga dibulatkan ke atas Rp500, ditambah porsi alat per unit (bawaan Rp500) | Dokumen sumber sudah dihapus; aturan benar ada di FR20, FR21 |
| A-05 | BRD 8.3 | Bahan limbah 300 g kain perca = Rp1.500 | Harga bawaan kain perca Rp3.000 per kg, jadi Rp900 | Dikoreksi (BRD 8.3 memakai contoh Pouch) |
| A-06 | Flow bagian 6 | HPP Rp10.750, harga jual Rp18.000 | Aturan aplikasi memasukkan porsi alat. Untuk template Pouch: HPP Rp11.250, harga jual Rp16.000 (sama dengan contoh di halaman depan aplikasi) | Dikoreksi (alur kerja bagian 5) |
| A-07 | FRD FR33 | Kuota harian dibagi dua jenis | Tiga jenis dicatat (scan, ide, panduan). Panduan memakai batas kuota ide (10 per hari), dihitung sendiri | Dikoreksi (FR33) |
| A-08 | FRD FR35 | Cache AI | Cache **lintas kelompok** (tabel `ai_cache` tanpa `group_id`; dibaca semua anggota aktif); aman karena bukan data pribadi | Dikoreksi (FR35, SDD D5) |
| A-09 | FRD FR37 | Panel admin menampilkan estimasi biaya per kelompok | Menampilkan panggilan hari ini, 30 hari, dan token. Tidak ada estimasi biaya | Dikoreksi (FR37) |
| A-10 | FRD FR31 | Ekspor CSV buku kas dan laba rugi | Hanya buku kas | Dikoreksi (FR31) |
| A-11 | FRD FR03 | Akun anggota dibuat dengan email atau nomor HP | Email dan kata sandi minimal 8 karakter, peran anggota atau pengurus; tidak ada pendaftaran lewat HP | Dikoreksi (FR03) |
| A-12 | SRS 6 | 14 entitas | 17 tabel di migrasi yang berlaku (16 di `0001` ditambah `platform_payouts`), ditambah `orders` dan `order_items` (migrasi `0002` hilang); `finished_goods` dipakai sebagai produk katalog. Pencarian `create table` menemukan 18 karena `rate_limits` milik migrasi yang dibatalkan | Dikoreksi (SRS 6, SDD 4) |
| A-13 | README aplikasi | Pesanan kedaluwarsa dalam 60 menit | Batas pembayaran Snap 60 menit; pembersihan pesanan yang ditinggal 90 menit (`create_order` dan cron) | Dikoreksi (BR-12, FR51) |
| A-14 | SRS NFR01 | Scan kurang dari 8 detik | Tidak diukur. Batas teknis 12 detik per model, 30 detik per fungsi (`maxDuration` scan, ide, panduan = 30) | Dikoreksi (NFR01 "belum diverifikasi") |
| A-15 | PRD, BRD | Warga dapat melihat saldo | Warga tidak punya akun; saldo hanya dilihat pengurus | Dikoreksi (PRD 5, user story 14, FR14) |
| A-16 | BRD 6.2 | Sertifikasi P-IRT/BPOM untuk pangan di luar lingkup | Katalog menerima kategori **kuliner** dan pupuk. Perlu keputusan tim | Dicatat sebagai keputusan terbuka (BRD 6.3). **Masih terbuka** |
| A-17 (baru, 10 Nov) | BRD BR-01 | Sistem hanya memproses sampah anorganik | Teks halaman katalog di aplikasi live berbunyi "Dari kain perca, minyak jelantah, sampai sisa dapur" (`src/app/(toko)/katalog/page.tsx`) | Dicatat di BRD 6.3 sebagai bagian dari keputusan kategori. **Masih terbuka** |

### 3.4 Ketidaksesuaian repositori

| ID | Masalah | Dampak | Status |
|---|---|---|---|
| R-01 | `supabase/migrations/0002_marketplace.sql` tidak ada. Migrasi 0003 dan 0004 mengubah tabel `orders` yang dibuat di sana. Tidak terlihat: tabel `orders` dan `order_items`; kolom profil toko di `groups` (`slug`, `whatsapp`, `city`, `postal_code`, `latitude`, `longitude`, `shop_open`); kolom katalog di `finished_goods` (`category`, `description`, `waste_materials`, `weight_grams`, `is_listed`); bucket Storage `produk` beserta kebijakannya; tujuh fungsi (`attach_payment`, `close_order`, `expire_stale_orders`, `expire_my_stale_orders`, `katalog_list`, `katalog_detail`, `set_midtrans_status`); dan fungsi bantu (`distance_km`, `_normalize_wa`, `_return_order_stock`) | Basis data **tidak bisa dibangun ulang** dari repositori | **Terbuka** |
| R-02 | Dirujuk tetapi tidak ada. Di `kriya-pkk/README.md`: `reset_dan_seed.sql`, `seed_akun_demo.sql`, `.env.example`, `0002_marketplace.sql`. Di `supabase/tests/README.md`: `20_marketplace_test.sql`, `01_stub_auth_tambahan.sql`, `hasil_uji_marketplace.txt`, `seed_akun_demo.sql`, `0002_marketplace.sql` | Petunjuk instalasi dan uji tidak bisa diikuti | **Terbuka**. Rujukan ke folder `docs/` dan `docs/ALUR-KRIYAPKK.md` sudah diperbaiki pada 10 November (kini `../docs/`) |
| R-03 | Ada dua migrasi bernomor 0004. `0004_kelengkapan_toko.sql` adalah pembaruan yang dibatalkan (dibersihkan oleh `0004_akun_pembeli.sql`), tetapi masih ada beserta tesnya (`30_kelengkapan_test.sql`, `hasil_uji_kelengkapan.txt`) | Membingungkan; jangan dijalankan | **Terbuka** |
| R-04 | README aplikasi memuat email dan kata sandi akun demo. **Repositori ini publik** (diperiksa 10 November 2026) | Kata sandi akun demo terbuka untuk siapa pun | **Terbuka**. Ganti setelah masa penjurian atau pindahkan ke dokumen terpisah |
| R-05 | Tidak ada pembatasan laju (rate limit), captcha, atau header keamanan (`next.config.ts` kosong); rate limit di `0004_kelengkapan_toko.sql` dibatalkan | Risiko penyalahgunaan endpoint publik | **Terbuka** |
| R-06 | Uji unit hanya 3 kasus (`calc.test.ts`); uji database dijalankan manual; tidak ada CI | Regresi tidak tertangkap otomatis | **Terbuka** |

### 3.5 Hal yang sudah benar

Prinsip berikut sesuai antara dokumen dan kode (diverifikasi): AI hanya mengenali jenis dan kondisi, harga dari tabel per kg; harga setoran tidak ditentukan AI; stok memakai nilai rata-rata tertimbang; buku kas hanya ditambah dan dikoreksi dengan entri pembalik; kuota harian dan cache AI; mode manual saat AI gagal; RLS per kelompok; kunci rahasia hanya di server; ide hanya tampil di atas bila stok cukup; panduan dibuat sekali lalu disimpan; kompresi foto 768 px; formula harga jual dan pembulatan Rp500; empat peran akun; Haversine; batas 150 km.

## 4. Tindakan yang dilakukan (versi 2.0 sampai 2.2)

| Dokumen | Perubahan |
|---|---|
| `0_BRD_v2.2.md` | Lingkup disesuaikan; model Gemini; BR-03 diperbaiki, BR-05 sampai BR-12 ditambah; contoh unit economics memakai aturan aplikasi; komisi 5% ditandai rencana; biaya aktivasi ditandai belum bersumber; keputusan kategori kuliner dan pupuk dicatat |
| `1_PRD_v2.2.md` | Ruang lingkup tiga tingkat (ada, sebagian, rencana); persona pembeli; metrik ditandai belum diukur |
| `2_SRS_v2.2.md` | Arsitektur sesuai kode; 17 tabel ditambah `orders` dan `order_items`; NFR diberi status verifikasi (NFR20 sampai NFR22 baru); antarmuka Midtrans, Fonnte, Biteship; bucket `produk` ditandai tidak ada di migrasi |
| `3_FRD_v2.2.md` | FR01 sampai FR37 diberi status dan dikoreksi; FR38 sampai FR58 baru untuk toko online; pembatalan batch dan kas dijelaskan |
| `4_PMP_v2.2.md`, `5_WBS_v2.2.md` | Menjadi rencana dan realisasi (25 Oktober sampai 1 November) dengan status per butir; angka riwayat git diverifikasi |
| `6_SDD_v2.2.md` | **Baru**: arsitektur, model data, katalog fungsi, keamanan, alur, keputusan desain, Storage, utang teknis |
| `7_project_lengkap_v2.2.md`, `8_flow_cara_kerja_v2.2.md` | Disesuaikan; contoh hitungan memakai aturan aplikasi |
| `9_VERIFIKASI_WEB_v2.2.md` | **Baru**: hasil pemeriksaan dua putaran terhadap kode dan web live |

Dokumen yang tidak dilanjutkan: konsep awal (`9_concept_draft_v1.0.md`) dan proposal Markdown (`9_proposal_lengkap_v1.0.md`). Keduanya dihapus dari repositori dan hanya ada di riwayat git; proposal resmi adalah PDF yang dikerjakan di luar repositori.

## 5. Keputusan yang dibutuhkan dari tim

| No | Keputusan | Status |
|---|---|---|
| 1 | **Komisi 5% dan pembagian 95:5.** Implementasikan di kode, atau tetap sebagai "rencana tahap lanjut". | Dokumen 2.2 memakai jalur kedua karena itu keadaan kode sekarang. Proposal ver11 sudah sejalan. Terbuka bila tim ingin mengimplementasikannya |
| 2 | **OpenRouter.** Hapus dari semua bahan, atau implementasikan sebagai penyedia cadangan kedua. | Dokumen 2.2 dan proposal ver11 sudah tidak menyebutnya. Pitch deck belum diperiksa |
| 3 | **Kategori kuliner dan pupuk di katalog**, termasuk teks halaman katalog yang menyebut jelantah dan sisa dapur (A-17). Pertahankan dengan catatan risiko P-IRT, atau batasi ke kerajinan dan kebersihan. | **Terbuka** |
| 4 | **Berkas yang hilang** (R-01 dan R-02). Tambahkan `0002_marketplace.sql`, seed, dan `.env.example` ke repositori. | **Terbuka** |
| 5 | **Pembatasan laju** dan header keamanan untuk endpoint publik sebelum dibuka ke umum (R-05). | **Terbuka** |
| 6 | **Kata sandi akun demo di README publik** (R-04). | **Terbuka** |
| 7 | **Uji akurasi scan AI dan uji kegunaan** (T-09). | **Terbuka** |

## Riwayat revisi

| Tanggal | Perubahan |
|---|---|
| 9 Nov 2026 | Laporan awal terhadap dokumen versi 1.0 |
| 10 Nov 2026 | Status tiap temuan disamakan dengan dokumen 2.2; nomor baris bukti diperbaiki (T-02, T-04, T-05); klaim Leaflet di README dicabut; R-01 dan R-02 dilengkapi; A-17 dan butir keputusan 6 dan 7 ditambah; hasil pemeriksaan proposal ver10 dan ver11 dicatat |
