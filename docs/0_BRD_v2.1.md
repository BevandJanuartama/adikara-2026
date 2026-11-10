# BRD: Business Requirements Document

**Nama proyek:** KriyaPKK
**Versi:** 2.1 (diselaraskan dengan kode commit `aa876a4`, 1 November 2026, dan aplikasi live; diverifikasi 10 November 2026)
**Menggantikan:** BRD 1.0 (25 Oktober 2026)
**Konteks:** ADIKARA 2026, Divisi Inovasi Software dan Entrepreneurship
**Institusi:** Fakultas Informatika, Universitas Telkom
**Status dokumen:** Baseline 2.0 (draf untuk disetujui tim)

Label pada dokumen ini: **Ada** (sudah di kode), **Rencana** (belum ada di kode), **Belum bersumber** (angka yang belum didukung rujukan).

## 1. Ringkasan eksekutif

KriyaPKK adalah aplikasi web ramah ponsel (kasir dan ERP mini) yang memadukan AI (Vision dan teks) untuk mengubah limbah anorganik rumah tangga menjadi produk kerajinan bernilai jual lewat kelompok PKK, lalu menjualnya lewat posko dan toko online. Dokumen ini mendefinisikan visi, model bisnis, pemangku kepentingan, aturan bisnis, KPI, dan kelayakan finansial sebagai dasar PRD, SRS, FRD, dan SDD.

## 2. Visi, misi, proposisi nilai

### 2.1 Visi
Menjadi platform digital sirkular berbasis komunitas desa yang mengatasi masalah limbah dari hulu sekaligus menumbuhkan kemandirian ekonomi perempuan di kampung.

### 2.2 Misi
1. **Valuasi adil dan transparan:** harga setoran dari tabel per kilogram yang diatur pengurus; AI hanya mengenali jenis dan kondisi.
2. **Katalisator kreativitas:** rekomendasi ide kerajinan dari stok fisik di posko.
3. **Akuntabilitas finansial mikro:** otomasi modal (HPP), upah, margin, dan buku kas.
4. **Biaya rendah:** tanpa biaya bulanan untuk mitra; infrastruktur memakai paket gratis atau sandbox pada tahap lomba.
5. **Akses pasar:** katalog online dengan ongkir dan pembayaran yang jelas.

### 2.3 Unique value proposition
- *Bukan sekadar bank sampah:* menutup rantai dari setoran, stok, ide, produksi, upah, sampai penjualan.
- *AI yang membumi:* AI dipakai untuk klasifikasi visual dan penyusunan teks terstruktur, bukan untuk menetapkan harga.

## 3. Masalah bisnis dan peluang pasar

### 3.1 Masalah utama
1. Bank sampah konvensional berhenti di pencatatan timbangan dan menjual murah ke pengepul.
2. Pengurus PKK tidak tahu limbah yang ada bisa dijadikan barang apa yang laku.
3. Bahan tambahan dan upah pengrajin sering tidak dihitung, sehingga usaha rugi tanpa disadari.
4. ERP komersial berlangganan bulanan, tidak terjangkau kas PKK.
5. Pemasaran produk di luar lingkungan sendiri sulit.

### 3.2 Peluang pasar (belum bersumber)
Angka TAM, SAM, dan SOM pada BRD 1.0 (83.000 desa dan kelurahan; sekitar 7.500 di Jawa Barat; 50 kelompok di Bandung Raya pada tahun pertama) adalah perkiraan awal tim dan **belum bersumber**. Untuk proposal gunakan data resmi (SIPSN KLHK, BPS, Kemendagri) dan cantumkan rujukannya.

## 4. Penyelarasan SDG dan Asta Cita

| Pilar | Target | Kontribusi KriyaPKK |
|---|---|---|
| SDG 8 | Pekerjaan layak dan pertumbuhan ekonomi | Upah produktif perajin, tercatat per batch |
| SDG 11 | Kota dan permukiman berkelanjutan | Kg sampah anorganik dialihkan dari pembakaran atau TPA |
| SDG 9 | Industri, inovasi, infrastruktur | AI Vision di tangan kelompok desa |
| SDG 4 | Pendidikan berkualitas | Panduan langkah demi langkah dengan mode suara |
| SDG 3 | Kesehatan | Berkurangnya pembakaran sampah (pendukung) |
| Asta Cita 6 | Membangun dari desa | Posko RW sebagai simpul ekonomi digital |
| Asta Cita 2 | Ekonomi hijau dan sirkular | Limbah lokal menjadi produk |
| Asta Cita 4 | Kualitas SDM | Literasi digital dan keuangan kader perempuan |

## 5. Pemangku kepentingan

### 5.1 Persona
1. **Warga penyetor:** ingin harga transparan; menerima saldo atau tunai.
2. **Pengurus posko:** operator kasir, stok, kas, produk, dan pesanan.
3. **Perajin PKK:** memilih ide, mengikuti panduan, menerima upah.
4. **Pembeli:** membeli produk lewat katalog online.
5. **Pemerintah desa dan BUMDes:** pembina; memantau dampak.
6. **Tim pengembang (admin platform):** infrastruktur, aktivasi mitra, pencairan dana, pemeliharaan.

### 5.2 RACI

| Fungsi bisnis | Warga | Pengurus | Perajin | Pembeli | Admin platform |
|---|:---:|:---:|:---:|:---:|:---:|
| Penyetoran sampah | R | A | I | | I |
| Valuasi harga (tabel harga) | C | A/R | I | | C (AI) |
| Pemilihan ide dan resep | I | A | R | | C (AI) |
| Produksi dan SOP | I | A | R | | I |
| Penetapan harga jual dan penjualan | I | A/R | C | R (membeli) | I |
| Pengiriman dan nomor resi | | A/R | | I | I |
| Pencairan dana online | | I | | | A/R |
| Laporan dampak | I | R | I | | C |

(R = Responsible, A = Accountable, C = Consulted, I = Informed.)

## 6. Ruang lingkup bisnis

### 6.1 In-scope (sudah ada)
- Pendaftaran mitra dengan alamat dan titik lokasi; aktivasi oleh admin.
- Kasir setoran: foto, scan AI, berat manual, harga dari tabel, persetujuan (saldo atau tunai).
- Stok bahan (kuantitas dan nilai rata-rata).
- Rekomendasi ide dari stok (AI atau 13 template), dengan kapasitas unit yang bisa dibuat.
- Kalkulator modal: bahan limbah, bahan tambahan, porsi alat, upah, margin.
- Panduan kerja terstruktur (teks dan suara).
- Produksi, hasil, unit gagal, upah anggota.
- Penjualan langsung dan buku kas append-only, laba rugi, ekspor CSV buku kas.
- Dashboard dampak lingkungan dan ekonomi.
- **Toko online:** katalog publik, akun pembeli, keranjang, ongkir ekspedisi (maksimal 150 km), pembayaran Midtrans (sandbox pada tahap lomba), WhatsApp ke posko saat lunas, status pesanan dengan nomor resi, kedaluwarsa otomatis.
- **Dana online:** saldo posko dan pencatatan pencairan oleh admin.

### 6.2 Out-of-scope (rencana pasca-lomba)
- Komisi platform otomatis dan pembagian dana 95:5.
- Pencairan otomatis (Midtrans Iris atau split pembayaran).
- Pelacakan resi lewat API kurir; kurir lokal dan COD.
- Pembatalan dan pengembalian dana pesanan terbayar dari aplikasi.
- Rating, ulasan, edit profil pembeli, hapus akun mandiri.
- Marketplace dengan satu keranjang untuk banyak posko.
- Sampah organik dan pangan olahan pada setoran.

### 6.3 Keputusan terbuka
Teks halaman katalog di aplikasi live menyebut produk dari "minyak jelantah, sampai sisa dapur". Itu bertentangan dengan batas setoran yang hanya menerima sampah anorganik (BR-01) dan memperkuat perlunya keputusan di bawah.

Katalog saat ini menerima kategori **kuliner** dan **pupuk**. Bila produk pangan dijual, diperlukan izin P-IRT atau BPOM. Tim perlu memutuskan: membatasi kategori ke kerajinan dan kebersihan, atau menyiapkan persyaratan izin.

## 7. Aturan bisnis inti

| ID | Aturan | Penegakan di sistem |
|---|---|---|
| BR-01 | Sistem hanya memproses sampah padat anorganik pada setoran; bahan berbahaya (pecahan kaca, logam tajam, wadah bahan kimia, organik, medis) ditandai tidak layak | Prompt AI menetapkan `is_eligible=false`; barang tidak layak bernilai Rp0; keputusan akhir di pengurus |
| BR-02 | AI dilarang menetapkan harga. Nominal = berat x harga tabel pengurus | `create_deposit` mengambil harga dari `price_table`; AI tidak menaksir berat maupun harga |
| BR-03 | Setiap produk memasukkan upah tenaga kerja sebelum margin | Upah per jam bawaan Rp12.500, dapat diubah pengurus. **Sistem tidak memaksa batas minimum** (hanya tidak boleh negatif) |
| BR-04 | Bila internet atau kuota AI habis, tersedia input manual | API membalas `manual: true`; jenis dipilih dari daftar, ide dari template |
| BR-05 | Harga produk, ongkir, dan total pesanan dihitung ulang di server; peramban hanya mengirim ID dan jumlah | `create_order` dan `/api/checkout` |
| BR-06 | Uang, stok, dan kas hanya berubah lewat fungsi database dalam satu transaksi | RPC `security definer`; klien tanpa izin tulis |
| BR-07 | Buku kas tidak dihapus; koreksi lewat entri pembalik (sekali per entri) | Indeks unik `reverses_id` |
| BR-08 | Pengiriman maksimal 150 km garis lurus dari posko; hanya ekspedisi bernomor resi | `create_order` menolak `DI_LUAR_JANGKAUAN` |
| BR-09 | Status "dikirim" wajib nomor resi (6 sampai 40 karakter) | `set_order_status` |
| BR-10 | Pembayaran harus bernominal sama dengan tagihan dan tidak boleh dicatat dua kali | `mark_order_paid` |
| BR-11 | Saldo posko = pesanan lunas (produk + ongkir, bukan simulasi) dikurangi pencairan dan biaya; pencairan tidak boleh melebihi saldo | `_saldo_platform`, `admin_record_payout` |
| BR-12 | Pesanan menunggu bayar yang ditinggal ditutup dan stok dikembalikan | Batas Snap 60 menit; pembersihan 90 menit dan cron harian |

## 8. Model finansial dan kelayakan usaha

### 8.1 Sumber pendapatan

| Sumber | Status | Keterangan |
|---|---|---|
| Biaya aktivasi sekali bayar, rencana Rp250.000 per kelompok (angka tim, **belum bersumber**; tidak ada di aplikasi) | Rencana | Aktivasi dilakukan admin setelah biaya diterima di luar aplikasi. Tidak ada biaya bulanan |
| Kemitraan Dana Desa dan CSR | Rencana | Paket desa binaan |
| Komisi penjualan 5% | **Rencana tahap lanjut** | **Belum ada di kode.** Saat ini dana online masuk penuh ke saldo posko dikurangi biaya yang diisi admin saat pencairan. Pembagian 95:5 belum dicatat |
| Paket premium | Rencana | Kuota AI tambahan, laporan lanjutan, ekspor |

### 8.2 Struktur biaya
- Hosting: Vercel (paket hobi) dan Supabase (paket gratis) pada tahap lomba.
- AI: Google Gemini; model diatur lewat env (bawaan `gemini-3.5-flash-lite`, dengan model cadangan Gemini). Penghematan: kompresi foto 768 px, cache hasil di database, kuota harian, keluaran JSON berskema. (Ini **cache respons di database**, bukan prompt caching milik penyedia.)
- Pembayaran: Midtrans sandbox. Pada produksi ada biaya per transaksi QRIS dan virtual account; biaya itu dapat dibebankan ke posko lewat kolom biaya saat pencairan.
- WhatsApp: Fonnte (opsional); biaya mengikuti paket Fonnte (belum dihitung).
- Ongkir: tarif manual tanpa biaya; Biteship opsional.

### 8.3 Unit economics (aturan aplikasi, template "Pouch kosmetik kain perca")

```
Bahan limbah   : 0,25 kg kain perca x Rp3.000/kg   = Rp   750
Bahan tambahan : ritsleting Rp2.000 + benang Rp500 = Rp 2.500
Porsi alat     :                                     Rp   500
Upah           : 0,6 jam x Rp12.500/jam            = Rp 7.500
-----------------------------------------------------------------
Modal (HPP)                                         = Rp11.250
Harga jual     : 11.250 x (1 + 40%) = 15.750, dibulatkan ke atas ke Rp500
                                                    = Rp16.000
Selisih terhadap modal                               = Rp 4.750
```

Contoh ini sama dengan angka di halaman depan aplikasi. Contoh BRD 1.0 (tas belanja, harga jual Rp20.000) memakai harga kain perca Rp5.000/kg dan margin 48%, tidak cocok dengan nilai bawaan aplikasi.

### 8.4 Titik impas
Rumus: titik impas tercapai bila jumlah mitra aktif x komisi x penjualan per mitra memenuhi biaya tetap bulanan. Karena komisi belum ada, titik impas saat ini hanya dapat dihitung dari biaya aktivasi dan kemitraan. Perhitungan biaya AI per mitra per bulan dapat diambil dari tabel `ai_usage` (token masuk dan keluar) setelah ada uji lapangan.

## 9. Indikator keberhasilan (target tiga bulan pertama)

Semua target **belum diukur**.

| Kategori | Tolok ukur |
|---|---|
| Operasional | Minimal 3 posko aktif |
| Partisipasi | Lebih dari 100 kepala keluarga aktif menyetor |
| Reduksi limbah | Lebih dari 500 kg dialihkan per posko |
| Pemberdayaan | Lebih dari Rp3.000.000 upah tersalurkan |
| Kepuasan | SUS di atas 75 |

## 10. Risiko bisnis dan mitigasi

| Risiko | Probabilitas | Dampak | Mitigasi |
|---|:---:|:---:|---|
| Resistensi teknologi oleh pengurus | Sedang | Tinggi | Antarmuka berorientasi kamera, tulisan besar, pendampingan kader muda. (Berat tetap diketik manual; alur tidak sepenuhnya tanpa mengetik) |
| Permintaan produk tidak stabil | Sedang | Sedang | Produksi berdasarkan pesanan; katalog dibagikan lewat WhatsApp dan sekolah atau kantor desa |
| Batas layanan gratis | Rendah | Sedang | Kompresi foto, cache, kuota (30 scan dan 10 ide per hari), model cadangan |
| Defisit kas posko di awal | Sedang | Tinggi | Setoran dapat dicatat sebagai saldo warga dahulu, sehingga kas tidak langsung keluar. (Skema "Tabungan Sampah Hari Raya" per 3 bulan belum ada; saldo dapat ditarik kapan saja) |
| Penyalahgunaan endpoint publik | Sedang | Sedang | Belum ada pembatasan laju; rencana |
| Pembayaran produksi dan regulasi | Sedang | Tinggi | Sandbox pada lomba; pencairan manual dicatat admin |
| Produk pangan tanpa izin | Sedang | Tinggi | Keputusan kategori (bagian 6.3) |

## Riwayat revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 25 Okt 2026 | Versi awal |
| 2.0 | 9 Nov 2026 | Lingkup mencakup toko online dan dana online; BR-03 diperbaiki; BR-05 sampai BR-12; komisi 5% ditandai rencana; model AI; contoh unit economics sesuai aturan aplikasi; angka pasar ditandai belum bersumber; keputusan terbuka kategori produk |
| 2.1 | 10 Nov 2026 | Biaya aktivasi Rp250.000 ditandai belum bersumber; temuan teks katalog yang menyebut jelantah dan sisa dapur (6.3) |
