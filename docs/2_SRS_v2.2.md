# SRS: Software Requirements Specification

Produk: KriyaPKK
Versi: 2.2 (diselaraskan dengan kode commit `aa876a4`, 1 November 2026, dan aplikasi live; diverifikasi dua putaran pada 10 November 2026)
Menggantikan: SRS 1.0 (25 Oktober 2026, "tanpa marketplace")

## 1. Pendahuluan

1.1 Tujuan: menetapkan kebutuhan perangkat lunak KriyaPKK sebagai acuan pengembangan dan pengujian.

1.2 Lingkup: aplikasi web progresif untuk kelompok PKK: pencatatan setoran sampah anorganik dengan scan AI, stok bahan, ide kerajinan dan costing, panduan, produksi dan upah, penjualan langsung, buku kas, dashboard dampak, serta toko online (katalog publik, akun pembeli, ongkir, pembayaran Midtrans, notifikasi WhatsApp, dan pencatatan pencairan dana ke posko).

1.3 Definisi:

| Istilah | Arti |
|---|---|
| Posko, kelompok, mitra | Kelompok PKK yang telah diaktivasi (tabel `groups`) |
| Setoran | Transaksi warga menyerahkan barang sisa |
| Stok | Persediaan bahan dari setoran, dengan nilai rata-rata tertimbang per kg |
| Costing | Perhitungan modal, upah, dan harga jual |
| Produk | Baris `finished_goods`; produk jadi sekaligus barang katalog |
| RLS | Row Level Security di Postgres |
| RPC | Fungsi database yang dipanggil dari aplikasi |
| Pesanan lunas | Pesanan yang pembayarannya sudah diverifikasi (`paid_at` terisi) |

1.4 Dokumen terkait: BRD, PRD, FRD, SDD (`6_SDD_v2.2.md`), PMP, WBS. Arsitektur rinci ada di SDD.

## 2. Deskripsi umum

2.1 Perspektif produk: satu basis kode Next.js 16 (App Router) dengan backend Supabase, di-deploy di Vercel. Dapat dipasang di layar utama ponsel (PWA).

2.2 Fungsi utama: lihat FRD (FR01 sampai FR58).

2.3 Kelas pengguna:

| Peran | Cara mendapat akun | Cakupan |
|---|---|---|
| Admin platform | Dibuat lewat SQL | Aktivasi mitra, kuota AI, pencairan dana |
| Pengurus | Daftar kelompok, lalu diaktifkan admin | Semua menu posko |
| Anggota (perajin) | Dibuat pengurus | Stok, dapur kreasi, produksi, upah sendiri, dashboard dampak |
| Pembeli | Daftar sendiri | Katalog, keranjang, checkout, pesanan sendiri |
| Warga penyetor | Tanpa akun | Dicatat pengurus; menerima saldo atau uang tunai |

2.4 Lingkungan operasi: peramban modern di ponsel dan komputer; internet seluler.

2.5 Batasan:

1. Layanan memakai paket gratis atau sandbox pada tahap lomba (Vercel, Supabase, Gemini, Midtrans sandbox).
2. Hanya sampah anorganik yang diterima pada setoran. Katalog produk menerima kategori kuliner, kerajinan, pupuk, dan kebersihan (lihat risiko di BRD).
3. Berat diinput manual; timbangan tidak terintegrasi.
4. Pengiriman maksimal 150 km garis lurus dari posko.
5. Dana pembayaran online masuk ke rekening pemilik akun Midtrans (pengelola platform); pencairan ke posko dicatat manual oleh admin.

2.6 Asumsi: timbangan tersedia di posko; pengurus mengisi tabel harga; AI hanya skrining awal; pengurus memesan dan menyerahkan paket ke ekspedisi sendiri.

## 3. Arsitektur sistem

| Lapisan | Isi |
|---|---|
| Klien | Next.js (App Router), Tailwind CSS v4, shadcn/ui, lucide-react; PWA (`manifest.ts`); keranjang di `localStorage` |
| Server | Server Components, Server Actions, 11 Route Handlers di Vercel; `proxy.ts` menyegarkan sesi Supabase dan melindungi halaman |
| Logika bisnis | Fungsi Postgres `security definer` (RPC). Uang, stok, kas, dan pesanan hanya berubah lewat fungsi ini |
| AI | Google Gemini (`@google/genai`) dengan keluaran JSON berskema (Zod), batas token, timeout, cache, dan kuota. Model utama dan model cadangan (Gemini) diatur lewat env |
| Data | Supabase Postgres dengan RLS, Auth (email dan kata sandi), Storage (bucket `photos` privat; bucket `produk` publik dipakai kode tetapi pembuatannya tidak ada di migrasi) |
| Eksternal | Midtrans Snap, Fonnte (WhatsApp), Biteship (opsional), OpenStreetMap (iframe peta) |
| Penjadwal | Vercel Cron: `/api/keepalive` setiap hari 01.00 UTC |

Penyedia cadangan AI adalah **model Gemini kedua**, bukan OpenRouter.

Rincian dan diagram: SDD.

## 4. Antarmuka eksternal

4.1 Pengguna: mobile first, bahasa Indonesia, navigasi bawah di ponsel dan sidebar di layar lebar. Alur setoran berbentuk wizard.

4.2 Perangkat keras: kamera ponsel. Timbangan manual.

4.3 Perangkat lunak:

| Layanan | Fungsi | Catatan |
|---|---|---|
| Gemini API | Analisis gambar dan teks JSON | Kunci hanya di server. Jenis fungsi: scan, ide, panduan |
| Supabase | Auth, Postgres, Storage | Kunci rahasia hanya di server |
| Midtrans Snap | QRIS dan virtual account; batas bayar 60 menit | Webhook `POST /api/midtrans/notifikasi` bertanda tangan SHA512; status dicek ulang ke API Core. `GET` pada alamat yang sama hanya mengembalikan info |
| Fonnte | Satu WhatsApp ke posko saat pesanan lunas | Opsional; gagal kirim tidak menggagalkan pesanan |
| Biteship | Tarif ongkir | Opsional (`ONGKIR_MODE=biteship`); bawaan tarif manual |
| OpenStreetMap | Peta tampilan (iframe) dan tautan Google Maps | Tanpa kunci API; tidak memakai Leaflet atau Nominatim |

4.4 Komunikasi: HTTPS.

## 5. Kebutuhan fungsional

Rincian di FRD 2.0. Ringkasan modul:

1. Mitra dan akun (FR01 sampai FR04).
2. Pengaturan harga dan upah (FR05, FR06).
3. Setoran dan scan (FR07 sampai FR14).
4. Stok (FR15 sampai FR17).
5. Ide dan costing (FR18 sampai FR23).
6. Produksi (FR24 sampai FR26).
7. Penjualan langsung (FR27, FR28).
8. Keuangan (FR29 sampai FR31).
9. Dampak (FR32).
10. AI dan kuota (FR33 sampai FR35).
11. Admin platform (FR36, FR37).
12. Profil toko dan rekening (FR38, FR39).
13. Produk dan katalog (FR40, FR41).
14. Akun pembeli dan keranjang (FR42 sampai FR44).
15. Checkout, ongkir, pembayaran (FR45 sampai FR51).
16. Pesanan (FR52 sampai FR54).
17. Dana online dan pencairan (FR55 sampai FR57).
18. Operasional (FR58).

## 6. Kebutuhan data

Entitas utama (tabel Postgres; skema lengkap di SDD):

| Tabel | Isi |
|---|---|
| `groups` | Kelompok: nama, alamat, status (pending, active, inactive), upah per jam (12.500), margin bawaan (0,40), kuota scan (30) dan ide (10) per hari; profil toko (slug, WhatsApp, kota, kode pos, koordinat, toko buka); rekening bank |
| `profiles` | Akun 1:1 dengan `auth.users`: kelompok, nama, peran (admin, pengurus, anggota, pembeli), aktif, HP, tanggal persetujuan privasi |
| `residents` | Warga: nama, HP, saldo (tidak negatif) |
| `price_table` | Harga per kg per jenis per kelompok (unik) |
| `deposits`, `deposit_items` | Setoran dan rincian: foto, hasil AI, status (draft, approved, cancelled), kondisi, kelayakan, berat, harga yang disalin, subtotal |
| `stock` | Stok per jenis: kg dan nilai rata-rata per kg |
| `idea_templates` | 13 template global |
| `ideas` | Ide kelompok beserta rincian biaya, harga jual, panduan, hash stok |
| `production_batches`, `wages` | Batch produksi, bahan terpakai, upah per anggota |
| `finished_goods` | Produk jadi dan barang katalog: kategori, deskripsi, bahan limbah, berat, ukuran, harga, stok, foto, tampil di katalog |
| `sales` | Penjualan dengan modal per unit saat terjual |
| `cash_ledger` | Buku kas append-only; koreksi lewat entri pembalik (unik per entri) |
| `ai_usage`, `ai_cache` | Pencatatan pemakaian dan cache hasil AI (cache tanpa data pribadi, lintas kelompok) |
| `orders`, `order_items` | Pesanan dan baris pesanan (dibuat oleh migrasi `0002` yang belum ada di repositori; kolom dirunut dari fungsi) |
| `platform_payouts` | Pencairan dana online ke posko: jumlah, biaya, referensi, tanggal |
| `v_idea_capacity` (view) | Berapa unit tiap ide bisa dibuat dari stok sekarang |

Aturan data:

1. Semua tabel bertenant memiliki `group_id` dan dilindungi RLS (17 tabel terlihat di migrasi, ditambah `orders` dan `order_items` dari `0002`; 30 kebijakan pada migrasi yang tersedia, termasuk 2 kebijakan Storage).
2. Perubahan saldo, stok, kas, dan pesanan terjadi dalam satu transaksi database lewat RPC; klien tidak punya izin tulis langsung.
3. Data keuangan tidak dihapus; koreksi lewat entri pembalik. (Pengecualian: pencatatan pencairan dapat dihapus admin.)
4. Harga, ongkir, dan total pesanan dihitung ulang di server; peramban hanya mengirim ID produk dan jumlah.
5. Foto setoran di bucket privat dengan jalur `<id_kelompok>/...`; akses dibatasi kebijakan Storage.

## 7. Kebutuhan non-fungsional

Status verifikasi: **Terbukti** (ada di kode atau hasil uji), **Sebagian**, **Belum diverifikasi** (tidak ada bukti pengukuran), **Tidak ada**.

| ID | Kebutuhan | Status | Bukti atau catatan |
|---|---|---|---|
| NFR01 | Scan satu foto kurang dari 8 detik | Belum diverifikasi | Tidak ada pengukuran. Batas teknis: 12 detik per model, 30 detik per fungsi |
| NFR02 | Halaman daftar dimuat kurang dari 3 detik | Belum diverifikasi | |
| NFR03 | Foto dikompres di klien (768 px) | Terbukti | `lib/image.ts`; JPEG 70% |
| NFR04 | Kunci API hanya di server | Terbukti | Tanpa awalan `NEXT_PUBLIC_`; klien Supabase `admin` hanya di server |
| NFR05 | RLS aktif, data kelompok terisolasi | Terbukti sebagian | Uji `10_rls_dan_transaksi_test.sql` (23 percobaan ilegal ditolak). Tabel pesanan dari `0002` tidak dapat diaudit |
| NFR06 | Foto lewat signed URL | Sebagian | Bucket privat dengan kebijakan per kelompok. Tidak memakai signed URL; foto setoran tidak ditampilkan ulang di peramban |
| NFR07 | Validasi input di server dengan Zod | Sebagian | Zod di route checkout dan ongkir, aksi setoran dan anggota; sisanya divalidasi oleh fungsi database |
| NFR08 | Peran membatasi akses | Terbukti | `requireMe`, RLS, pemeriksaan peran di tiap RPC |
| NFR09 | Panggilan AI: timeout dan satu kali ulang, lalu manual | Terbukti | Dua model berurutan; timeout 12 detik (ide 14, panduan 15) |
| NFR10 | Operasi saldo, stok, kas atomik | Terbukti | Fungsi `security definer`; baris dikunci `for update` |
| NFR11 | Antarmuka Indonesia, kontras tinggi, huruf 16 piksel atau lebih | Sebagian | Bahasa Indonesia terbukti; kontras dan ukuran huruf belum diverifikasi |
| NFR12 | Tugas utama maksimal tiga langkah | Belum diverifikasi | Setoran berbentuk wizard; belum diuji dengan pengguna |
| NFR13 | Hasil scan dan ide di-cache | Terbukti | `ai_cache` |
| NFR14 | Kuota AI per kelompok per hari dapat diatur | Terbukti | `admin_set_quota`; bawaan 30 scan, 10 ide |
| NFR15 | Ringkasan stok ke AI berupa teks pendek | Terbukti | Hanya jenis dengan stok lebih dari 0,2 kg, kg dibulatkan |
| NFR16 | Panduan dibuat hanya saat ide dipilih | Terbukti | Disimpan sekali |
| NFR17 | Keluaran AI dibatasi skema JSON dan batas token | Terbukti | 1.024 (scan), 3.072 (ide, panduan) |
| NFR18 | Layanan gratis atau sandbox | Sebagian | Gemini, Supabase, Vercel gratis; Midtrans sandbox. Biaya Midtrans produksi dan WhatsApp Fonnte belum dihitung |
| NFR19 | Chrome dan Safari di Android, iOS, komputer | Belum diverifikasi | |
| NFR20 (baru) | Webhook pembayaran tidak dapat dipalsukan atau diulang | Terbukti | Tanda tangan SHA512, cek ulang API, nominal harus sama, idempoten |
| NFR21 (baru) | Pembatasan laju untuk endpoint publik | Tidak ada | Pembatasan di migrasi dibatalkan; belum ada captcha atau header keamanan |
| NFR22 (baru) | Proyek Supabase gratis tidak dijeda karena tidak aktif | Terbukti | Cron `keepalive` harian |

## 8. Kualitas dan pengujian

| Jenis uji | Status |
|---|---|
| Unit perhitungan harga dan costing | Ada, 3 kasus (`src/lib/calc.test.ts`) |
| Uji database: RLS, transaksi, setoran, produksi, kas, kuota | Ada, hasil tersimpan (`hasil_uji.txt`) |
| Uji database: akun pembeli, resi, pencairan | Ada (`hasil_uji_akun_pembeli.txt`) |
| Uji database: marketplace (`20_marketplace_test.sql`) | Dirujuk, berkas tidak ada |
| Uji `30_kelengkapan_test.sql` | Milik pembaruan yang dibatalkan; tidak berlaku |
| Uji integrasi aplikasi (setoran sampai stok) | Belum ada |
| Akurasi scan AI pada 20 sampai 30 foto | Belum ada |
| Uji kegunaan (SUS) | Belum ada |
| CI otomatis | Tidak ada |

## 9. Kriteria penerimaan

1. Setoran dari foto sampai saldo warga dan stok berhasil dalam satu alur.
2. Ide yang tampil di atas hanya yang stoknya cukup, dengan modal dan harga jual terhitung.
3. Penjualan langsung memperbarui stok produk dan buku kas.
4. Dashboard menampilkan kilogram sampah, rupiah ke warga, produk terjual, dan laba.
5. Saat AI gagal, pengurus tetap dapat menyelesaikan setoran secara manual.
6. Data kelompok A tidak dapat dibaca kelompok B.
7. Pembeli dapat membuat pesanan, membayar lewat Midtrans (sandbox), dan melihat status serta nomor resi.
8. Pesanan lunas menghasilkan penjualan, kas masuk, dan satu WhatsApp ke posko.
9. Pembayaran dengan nominal salah atau tanda tangan tidak sah ditolak; notifikasi ganda tidak menggandakan penjualan.
10. Pesanan yang tidak dibayar kedaluwarsa dan stoknya kembali.

## 10. Lampiran: ringkasan perhitungan

| Hitungan | Rumus |
|---|---|
| Subtotal setoran | berat x harga per kg tabel harga, dibulatkan ke rupiah; tidak layak = 0 |
| Nilai rata-rata stok | (kg lama x nilai lama + nilai setoran baru) / (kg lama + kg baru) |
| Modal per unit | nilai bahan stok + bahan tambahan + porsi alat + (jam x upah per jam) |
| Harga jual | modal x (1 + margin), dibulatkan **ke atas** ke kelipatan Rp500 |
| Modal per unit produk jadi | (nilai bahan + bahan tambahan + alat + upah batch) / jumlah jadi |
| Laba | pendapatan penjualan dikurangi (jumlah terjual x modal per unit saat terjual) |
| Jarak tagih | garis lurus x 1,3, dibulatkan ke atas, minimal 1 km |
| Berat volumetrik | P x L x T (cm) x jumlah / 6000 |
| Berat dikenakan | terbesar antara berat asli dan volumetrik; ke bawah bila sisa 0,3 kg atau kurang; minimal 1 kg |
| Tarif ekspedisi | lihat FR46 dan SDD (tabel layanan) |
| Total pesanan | subtotal produk + ongkir |
| Saldo posko | total pesanan lunas bukan simulasi dikurangi pencairan dikurangi biaya |

Contoh (template "Pouch kosmetik kain perca": 0,25 kg kain perca, ritsleting Rp2.000, benang Rp500, alat Rp500, 0,6 jam): bahan 0,25 x 3.000 = 750; tambahan 2.500; alat 500; upah 0,6 x 12.500 = 7.500; modal Rp11.250; dengan margin 40% = 15.750, dibulatkan ke Rp16.000.

## Riwayat revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 25 Okt 2026 | Versi awal |
| 2.0 | 9 Nov 2026 | Lingkup mencakup marketplace; OpenRouter diganti model cadangan Gemini; entitas data sesuai skema; NFR diberi status verifikasi; NFR20 sampai NFR22; bagian pengujian; contoh hitungan sesuai aturan aplikasi |
| 2.1 | 10 Nov 2026 | Diverifikasi ulang terhadap kode dan web live; tidak ada perubahan kebutuhan |
| 2.2 | 10 Nov 2026 | Bucket `produk` ditandai tidak ada di migrasi; endpoint notifikasi punya GET info |
