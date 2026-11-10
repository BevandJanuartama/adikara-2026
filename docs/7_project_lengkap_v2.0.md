# KriyaPKK: Konsep dan Arsitektur Ringkas

Versi: 2.0 (diselaraskan dengan kode commit `aa876a4`, 1 November 2026)
Menggantikan versi awal 25 Oktober 2026 (tersedia di riwayat git).
Untuk desain rinci lihat `6_SDD_v2.0.md`.

Ekosistem digital pengelolaan sampah anorganik dan ekonomi kreatif kampung berbasis AI. Sistem kasir dan ERP mini untuk kelompok PKK, dengan toko online. Mitra membayar aktivasi sekali, tanpa biaya bulanan.

Label: **Ada** (sudah di kode), **Rencana** (belum ada).

## 1. Ringkasan

KriyaPKK membantu kelompok PKK mengubah sampah anorganik warga menjadi produk kerajinan bernilai jual. Warga menyetor sampah dan menerima saldo atau uang sesuai tabel harga. AI mengenali jenis dan kondisi barang, membaca stok, lalu menyusun ide kerajinan lengkap dengan bahan, alat, modal, harga jual, dan panduan. Produk dijual di posko atau lewat katalog online.

Prinsip: layanan memakai paket gratis atau sandbox pada tahap lomba, dan AI dipanggil hanya bila perlu.

## 2. Masalah

1. Limbah anorganik rumah tangga menumpuk, dibakar, atau dibuang karena belum dikelola dari kampung.
2. PKK sulit menemukan ide produk bernilai jual dan tidak tahu bahan tambahan yang perlu dibeli.
3. Modal, stok, harga pokok, dan harga jual tidak tercatat.
4. Penilaian harga setoran tidak seragam.
5. Pemasaran digital terbatas; langganan bulanan memberatkan.
6. Aplikasi bank sampah umumnya hanya mencatat setoran.

## 3. SDG dan Asta Cita

Fokus pada sampah anorganik (risiko keamanan pangan tidak ikut terbawa pada setoran).

SDG: 8 (utama), 11, 9, 4, 3 (pendukung). Asta Cita: 6 (paling kuat), 2, 4. Persyaratan lomba: SDG 3, 4, 7, 8, 9, 11 dan Asta Cita 2, 4, 6.

## 4. Solusi

Aplikasi web progresif (Next.js) yang berfungsi sebagai kasir setoran, pengelola stok, penasihat produksi, dan toko online:

1. **Scan AI** untuk jenis dan kondisi barang, termasuk menandai barang tidak layak atau berbahaya. (Ada)
2. **Harga dari tabel per kg** yang diatur pengurus; AI tidak menentukan harga. (Ada)
3. Pencatatan setoran, saldo warga, dan stok bahan. (Ada)
4. **Generator ide** dari ringkasan stok (AI atau 13 template). (Ada)
5. **Kalkulator modal**: bahan, bahan tambahan, alat, upah, margin. (Ada)
6. **Panduan pengerjaan** dari AI dengan mode suara. (Ada)
7. **Katalog publik, checkout, pembayaran Midtrans** (sandbox), ongkir, resi. (Ada)
8. **Dashboard dampak dan keuangan**: kg dialihkan, rupiah ke warga, kas, laba. (Ada)
9. Komisi platform dan pembagian dana otomatis. (**Rencana**)

## 5. Pihak yang terlibat

1. Tim pengembang (admin platform): penyedia platform; mengaktifkan mitra dan mencatat pencairan dana.
2. Pengurus PKK (mitra): daftar dan membayar aktivasi di luar aplikasi; mengelola posko, akun anggota, tabel harga, produk, dan pesanan.
3. Anggota perajin: memilih ide, memproduksi, menerima upah.
4. Warga: menyetor; **tanpa akun**.
5. Pembeli: akun pembeli untuk checkout.

## 6. Alur sistem

1. Pengurus mendaftar; admin mengaktifkan setelah biaya aktivasi diterima. Tidak ada biaya bulanan.
2. Pengurus membuat akun anggota, mengatur tabel harga, dan mengisi profil toko (WhatsApp, titik lokasi, rekening).
3. Warga membawa sampah anorganik ke posko.
4. Pengurus memotret barang dan menimbang; berat diinput manual.
5. AI mengenali jenis dan kondisi; harga dihitung dari tabel.
6. Warga menyetujui dan menerima saldo atau uang tunai; bila tidak setuju, transaksi dibatalkan.
7. Stok bahan bertambah.
8. AI atau template menyusun ide beserta bahan, alat, modal, upah, harga jual, margin. Ide dengan stok cukup tampil di atas; yang kurang ditandai.
9. Perajin memilih ide; panduan dibuat sekali dan disimpan.
10. Produk jadi dilengkapi data katalog oleh pengurus lalu ditayangkan.
11. Pembeli memesan, memilih pengiriman, dan membayar.
12. Saat lunas: penjualan dan kas masuk (nilai produk) tercatat, satu WhatsApp dikirim ke posko. Pengurus mengirim dengan nomor resi. Admin mencairkan dana online ke posko dan mencatatnya.

## 7. Dana pembayaran online

### Kondisi sekarang (Ada)

Pembeli membayar sekali (produk + ongkir) lewat Midtrans Snap. Dana masuk ke rekening pemilik akun Midtrans (pengelola platform). Saldo posko = pesanan lunas (bukan simulasi) dikurangi pencairan dan biaya. Admin mentransfer ke rekening posko di luar aplikasi, lalu mencatat pencairan (jumlah, biaya, referensi). Biaya QRIS atau virtual account dapat dibebankan ke posko lewat kolom biaya. **Tidak ada pembagian 95:5 dan tidak ada komisi di kode.**

### Opsi tahap produksi (Rencana)

1. Split asli di gateway (perlu fitur marketplace atau sub-merchant dari penyedia; belum dikonfirmasi pada dokumentasi publik Midtrans).
2. Tampung lalu bayarkan: semua dana masuk platform, lalu bagian PKK dicairkan lewat layanan payout (Midtrans Iris), komisi platform ditahan. Tidak real time; ada biaya transfer; butuh verifikasi bisnis.
3. Merchant per PKK: komisi ditagih terpisah; paling aman secara regulasi tetapi pendaftarannya rumit.

Keputusan: untuk lomba tetap memakai sandbox dan pencairan manual. Komisi 5% dijelaskan sebagai rencana, dan istilah "real time" tidak dipakai sebelum terbukti.

## 8. Pengiriman dan batas radius

Batas 150 km dari posko agar ongkir tidak melebihi nilai produk yang relatif murah.

1. Posko menyimpan titik lokasi (lintang dan bujur) di profil toko. Tanpa titik lokasi, hanya ambil di posko.
2. Pembeli menentukan titik tujuan lewat GPS peramban atau menempel koordinat; peta berupa iframe OpenStreetMap (tanpa Leaflet atau Nominatim).
3. Jarak garis lurus dihitung dengan Haversine di server; lebih dari 150 km ditolak.
4. **Tidak ada zona.** Tarif memakai rumus per layanan ekspedisi (JNE REG, YES, JTR; J&T EZ; SiCepat REG, GOKIL; Pos Kilat Khusus) berdasarkan jarak tagih (garis lurus x 1,3) dan berat dikenakan (terbesar antara berat asli dan volumetrik P x L x T / 6000, toleransi 0,3 kg, minimal 1 kg).
5. Tarif tertanam di kode (`ongkir-manual.ts`); mode `biteship` memakai API Biteship bila kunci diisi.
6. Nomor resi diisi pengurus saat status dikirim (wajib). Pembeli melacak resi sendiri di situs ekspedisi.
7. Metode yang tersedia: ambil di posko (gratis) atau ekspedisi. Kurir lokal dan COD **tidak ada**.

Aturan yang pernah dirancang tetapi **belum ada**: batas ongkir 30% dari harga produk, gratis ongkir, minimal belanja zona jauh, tarif yang dapat diatur pengurus.

## 9. Model bisnis

Subtema: Bidang Teknologi (a), terkait Industri Kreatif (d).

| Sumber | Status |
|---|---|
| Biaya aktivasi sekali bayar (rencana Rp250.000) | Rencana; aktivasi manual oleh admin |
| Komisi platform 5% dari produk terjual | **Rencana tahap lanjut**; belum ada di kode |
| Fitur premium (laporan, ekspor, kuota tambahan) | Rencana |
| Kemitraan Dana Desa, CSR, pemda | Rencana |

Perlu dihitung untuk pitch: biaya AI per mitra per bulan (dari `ai_usage`), titik impas, dan arus kas awal PKK untuk membayar warga sebelum produk laku (saat ini dapat dicatat sebagai saldo warga dahulu).

Pembeda: tidak berhenti di pencatatan setoran, tetapi mencakup valuasi, ide, modal dan harga jual, panduan, penjualan, dan pengiriman.

## 10. Cakupan dan roadmap

**Sudah ada:** login dan empat peran; setoran (foto, scan AI, berat, harga tabel, saldo); stok; ide dan kalkulator modal; panduan dengan cache; produksi dan upah; penjualan langsung; buku kas dan laporan; dashboard dampak; katalog dan checkout Midtrans sandbox; ongkir manual dengan batas 150 km; dana online dan pencairan manual; WhatsApp saat lunas.

**Roadmap:** komisi dan pembagian dana; payout otomatis (Iris atau split); pelacakan resi lewat API kurir; pengembalian dana dari aplikasi; marketplace lintas kelompok dengan satu keranjang; rating dan ulasan; mode luring; peringatan stok; analitik tren harga.

## 11. Teknologi

1. Frontend dan backend: Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS v4, shadcn/ui, Zod.
2. Basis data, autentikasi, penyimpanan: Supabase (Postgres, Auth, Storage), RLS.
3. Hosting dan cron: Vercel.
4. AI: Google Gemini (`@google/genai`); model utama dan model cadangan Gemini lewat env (bawaan `gemini-3.5-flash-lite`). **Tidak memakai OpenRouter.**
5. Pembayaran: Midtrans Snap (sandbox pada tahap lomba).
6. WhatsApp: Fonnte (opsional).
7. Ongkir: tarif manual; Biteship opsional.
8. Peta: iframe OpenStreetMap dan tautan Google Maps.
9. Data demo: dibuat sendiri.

## 12. Efisiensi token dan biaya AI

1. Foto dikecilkan di peramban (768 px, JPEG 70%) sebelum diunggah.
2. Keluaran JSON berskema dengan batas token (scan 1.024; ide dan panduan 3.072).
3. Harga tidak dihitung AI.
4. Cache hasil di database: scan per hash foto, ide per hash ringkasan stok, panduan per judul dan bahan. (Cache respons milik aplikasi, bukan prompt caching penyedia.)
5. Ringkasan stok ke AI singkat: jenis dengan stok lebih dari 0,2 kg, kg dibulatkan.
6. Ide dibuat hanya saat stok berubah berarti atau diminta ulang; panduan hanya saat ide dipilih.
7. 13 template ide sebagai mode manual tanpa AI.
8. Kuota harian per kelompok (bawaan 30 scan dan 10 ide; panduan memakai batas yang sama dengan ide); admin dapat mengubah.
9. Satu penyedia (Gemini) dengan satu model cadangan; timeout 12 detik (ide 14, panduan 15).
10. Bila AI gagal atau kuota habis, pengurus memilih jenis dan ide secara manual.

## 13. Struktur database

Ringkas di sini; lengkap di SDD bagian 4. Tabel inti: `groups`, `profiles`, `residents`, `price_table`, `deposits`, `deposit_items`, `stock`, `idea_templates`, `ideas`, `production_batches`, `wages`, `finished_goods` (produk jadi sekaligus barang katalog), `sales`, `cash_ledger`, `ai_usage`, `ai_cache`, `platform_payouts`, ditambah `orders` dan `order_items` (migrasi `0002`, belum ada di repositori).

## 14. Rencana kerja dan realisasi

Rencana awal 4 hari. Realisasi 25 Oktober sampai 1 November 2026 (lihat PMP 2.0): inti aplikasi pada 25 Oktober, tampilan 26 sampai 27 Oktober, marketplace 28 Oktober, akun pembeli dan pencairan 1 November.

## 15. Risiko dan batasan

1. AI hanya skrining awal; keputusan kelayakan di pengurus.
2. Barang tajam atau bekas bahan kimia ditandai tidak layak.
3. Pembayaran produksi dan payout memerlukan verifikasi bisnis; lomba memakai sandbox.
4. Pasar awal terbatas radius 150 km.
5. Batas paket gratis layanan pihak ketiga dapat berubah.
6. Pembeli awal belum ada; strategi: katalog dibagikan lewat WhatsApp, sekolah, kantor desa, pesanan seragam atau suvenir.
7. Endpoint publik belum memiliki pembatasan laju.
8. Katalog menerima kategori kuliner dan pupuk; izin P-IRT perlu diputuskan.

## 16. Validasi dan bahan pitch

1. Uji scan AI pada 20 sampai 30 foto nyata (**belum dilakukan**).
2. Contoh satu produk dari awal sampai akhir (lihat contoh di `8_flow_cara_kerja_v2.0.md` bagian 5).
3. Simulasi dampak satu PKK selama satu bulan.
4. Wawancara satu atau dua pengurus PKK atau bank sampah.
5. Perbandingan dengan aplikasi bank sampah yang ada.
6. Perhitungan biaya AI per mitra dan titik impas.

## Riwayat revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 25 Okt 2026 | Versi awal |
| 2.0 | 9 Nov 2026 | Bagian 7 dan 8 sesuai kode (tanpa 95:5, tanpa zona, tanpa Nominatim); OpenRouter dihapus; Next.js 16; status per fitur; realisasi jadwal; risiko baru |
