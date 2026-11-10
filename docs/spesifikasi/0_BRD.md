# BRD: Business Requirements Document

**Nama Proyek:** KriyaPKK  
**Versi:** 1.0  
**Konteks Kompetisi:** ADIKARA 2026 – Divisi Inovasi Software & Entrepreneurship  
**Fakultas / Universitas:** Fakultas Informatika, Universitas Telkom Bandung  
**Status Dokumen:** Approved / Baseline  

---

## 1. Ringkasan Eksekutif Bisnis (Executive Summary)

**KriyaPKK** adalah inisiatif sosio-teknopreneur yang menggabungkan aplikasi web ramah guna (*Mini ERP & POS*) dengan kecerdasan buatan (*Vision AI & Generative AI*) untuk mentransformasi limbah anorganik rumah tangga di tingkat kampung menjadi komoditas kerajinan bernilai jual tinggi melalui pemberdayaan ibu-ibu Pemberdayaan Kesejahteraan Keluarga (PKK).

Dokumen Kebutuhan Bisnis (*Business Requirements Document - BRD*) ini mendefinisikan visi strategis, model bisnis, pemetaan pemangku kepentingan (*stakeholders*), aturan bisnis (*business rules*), indikator keberhasilan (*KPIs*), serta kelayakan finansial yang menjadi landasan bagi pengembangan dokumen turunan teknis (PRD, SRS, dan FRD).

---

## 2. Visi, Misi, dan Proposisi Nilai (Value Proposition)

### 2.1 Visi
Menjadi platform digital sirkular berbasis komunitas desa terdepan di Indonesia yang mengentaskan masalah limbah dari hulu sekaligus menciptakan kemandirian ekonomi perempuan pedesaan.

### 2.2 Misi
1. **Valuasi Adil & Transparan:** Menghilangkan subjektivitas harga sampah dengan standardisasi harga per kilogram dan skrining AI.
2. **Katalisator Kreativitas Desa:** Menjembatani jurang keterampilan pengrajin dengan rekomendasi resep produk otomatis berbasis ketersediaan stok fisik riil di posko.
3. **Akuntabilitas Finansial Mikro:** Mengeliminasi *blind-spot* keuangan UMKM desa melalui otomasi kalkulasi Harga Pokok Penjualan (HPP), upah tenaga kerja, dan margin laba.
4. **Dampak Berkelanjutan Rp0:** Mengembangkan solusi perangkat lunak yang beroperasi tanpa modal awal server (*zero-cost infrastructure*) agar tidak membebani kas komunitas akar rumput.

### 2.3 Unique Value Proposition (UVP)
* *Bukan Sekadar Bank Sampah:* Aplikasi bank sampah biasa berhenti di pencatatan timbangan dan menjual murah ke pengepul. KriyaPKK menutup rantai sirkular sampai tahap hilirisasi produk jadi bernilai tambah 5x–10x lipat.
* *AI yang Membumi & Berhemat:* AI tidak dipakai untuk hal halusinatif, melainkan spesifik untuk klasifikasi visual sampah dan generator instruksi SOP modular.

---

## 3. Masalah Bisnis & Analisis Peluang Pasar

### 3.1 Identifikasi Masalah Utama (*Problem Statement*)
1. **Inefisiensi Bank Sampah Konvensional:** Sampah hanya ditimbun menunggu tengkulak dengan margin amat tipis (Rp 1.500–Rp 2.500/kg). Jika tengkulak tidak datang, posko menjadi kumuh.
2. **Kelumpuhan Kreativitas (*Creative Paralysis*):** Pengurus PKK memiliki kemauan tinggi dan waktu luang, tetapi tidak tahu limbah yang ada bisa diolah menjadi barang apa yang laku di pasar.
3. **Ketiadaan Akuntansi & HPP yang Jelas:** Pembelian bahan pelengkap (lem tembak, benang, ritsleting) dan upah lelah pengrajin sering tidak dihitung, sehingga usaha kerajinan desa kerap merugi tanpa disadari.
4. **Beban Biaya Langganan Software:** Solusi ERP komersial menerapkan model langganan bulanan (*monthly subscription*) yang mustahil dijangkau kas rukun tetangga/PKK.

### 3.2 Analisis Peluang Pasar (*Market Opportunity*)
* **Total Addressable Market (TAM):** Lebih dari 83.000 desa dan kelurahan di Indonesia, dengan jutaan kelompok dasawisma/PKK aktif.
* **Serviceable Addressable Market (SAM):** ~7.500 desa/kelurahan di Jawa Barat yang memiliki program bank sampah aktif dan sentra kerajinan rakyat.
* **Serviceable Obtainable Market (SOM):** 50 kelompok PKK di kawasan Bandung Raya dan lingkar kampus Telkom University pada tahun pertama inkubasi.

---

## 4. Penyelarasan Sasaran Global (SDGs) & Nasional (Asta Cita)

| Pilar Kebijakan | Target Spesifik | Kontribusi Nyata KriyaPKK |
|---|---|---|
| **SDG 8** | Pekerjaan Layak & Pertumbuhan Ekonomi | Memberikan upah produktif per item/jam bagi ibu-ibu rumah tangga dan menumbuhkan unit ekonomi mikro RT/RW. |
| **SDG 11** | Kota & Komunitas Berkelanjutan | Mengurangi timbulan sampah anorganik ke TPA dan menghentikan kebiasaan membakar sampah pekarangan. |
| **SDG 9** | Industri, Inovasi, & Infrastruktur | Menghadirkan teknologi kecerdasan buatan (*Computer Vision*) ke tangan masyarakat pedesaan. |
| **SDG 4** | Pendidikan Berkualitas | Panduan SOP interaktif bertindak sebagai media pelatihan vokasi keterampilan seumur hidup. |
| **Asta Cita 6** | Membangun dari Desa & Bawah | Pemerataan ekonomi digital langsung di tingkat posko RW/dusun untuk pengentasan kemiskinan. |
| **Asta Cita 2** | Ekonomi Sirkular & Kemandirian | Memanfaatkan limbah lokal menjadi produk bernilai jual kembali. |
| **Asta Cita 4** | Peningkatan Kualitas SDM | Pelatihan literasi digital, wirausaha mikro, dan akuntabilitas keuangan bagi kader perempuan. |

---

## 5. Analisis Pemangku Kepentingan (Stakeholders & RACI Matrix)

### 5.1 Persona Pemangku Kepentingan
1. **Warga Penyetor:** Masyarakat penghasil sampah rumah tangga yang menginginkan transparansi harga dan insentif tunai/saldo tabungan.
2. **Pengurus Posko PKK:** Pengelola operasional harian yang membutuhkan antarmuka kasir cepat, pencatatan stok otomatis, dan pembukuan kas anti-pusing.
3. **Ibu Pengrajin PKK:** Anggota kelompok yang memerlukan kepastian apa yang harus dikerjakan hari ini, panduan yang mudah diikuti, dan upah kerja yang adil.
4. **Pemerintah Desa / BUMDes:** Pembina komunitas yang berkepentingan menyerap anggaran pemberdayaan pos Dana Desa dan memantau KPI lingkungan wilayahnya.
5. **Tim Pengembang Platform:** Menyediakan infrastruktur teknologi andal, pemeliharaan sistem, dan model bisnis berkelanjutan.

### 5.2 RACI Matrix
| Fungsi Bisnis | Warga | Pengurus PKK | Pengrajin | Pemdes / BUMDes | Platform Dev |
|---|:---:|:---:|:---:|:---:|:---:|
| Penyetoran Sampah | **R** | **A** | I | I | I |
| Skrining Fisik & Valuasi Harga | C | **A / R** | I | I | C (via AI) |
| Pemilihan Ide Produk & Resep | I | **A** | **R** | I | C (via AI) |
| Eksekusi Produksi & SOP | I | A | **R** | I | I |
| Penetapan Harga Jual & Kasir POS | I | **A / R** | C | I | I |
| Laporan Dampak & Pertanggungjawaban | I | **R** | I | **A** | C |

*(Keterangan: R = Responsible, A = Accountable, C = Consulted, I = Informed)*

---

## 6. Batasan Ruang Lingkup Bisnis (Business Scope)

### 6.1 In-Scope (Fase Rilis MVP 1.0)
* Pendaftaran kelompok PKK mitra dengan koordinat posko dan aturan harga master.
* Modul Kasir Setoran: Foto kamera, deteksi AI Vision untuk jenis limbah, input berat timbangan manual, dan kalkulasi tarif otomatis berdasarkan master data harga.
* Modul Manajemen Stok Gudang Bahan Mentah (kuantitas dan nilai perolehan).
* Mesin Rekomendasi Kreasi: Pemetaan stok aktif menjadi ide kerajinan dengan *Bill of Materials (BOM)* otomatis.
* Kalkulator HPP: Penjumlahan biaya bahan limbah, bahan tambahan toko, alokasi upah pengerja, dan margin kas PKK.
* Modul Panduan Kerja Interaktif: Teks terstruktur per langkah produksi.
* Pencatatan Penjualan Produk & Buku Kas Sederhana (pencatatan pemasukan, pengeluaran kas, dan saldo).
* Dashboard Ringkasan Dampak Lingkungan (kg terolah) dan Dampak Ekonomi (upah tersalurkan & kas kelompok).

### 6.2 Out-of-Scope (Roadmap Pasca Lomba)
* Marketplace e-commerce multi-vendor publik dan payment gateway split otomatis.
* Integrasi logistik ekspedisi pihak ketiga (JNE, Biteship, RajaOngkir).
* Pengolahan sampah basah organik yang membutuhkan sertifikasi BPOM/Dinkes P-IRT.
* Otomasi pengiriman resi via WhatsApp Gateway berbayar.

---

## 7. Aturan Bisnis Inti (Business Rules)

* **BR-01 (Kategori Sampah Aman):** Sistem hanya memproses sampah padat anorganik (kain, plastik kering, kardus, botol kaca utuh, kaleng logam). Bahan berbahaya, pecahan kaca tajam, jarum suntik, atau wadah kimia beracun wajib ditolak otomatis oleh sistem/pengurus demi K3.
* **BR-02 (Anti-Halusinasi Harga):** AI dilarang menetapkan nominal harga secara mandiri. AI hanya mengklasifikasi kategori fisik bahan; nominal rupiah wajib bersumber dari perkalian matematis tabel tarif master yang ditentukan pengurus PKK.
* **BR-03 (Formula HPP Wajib):** Setiap produk kerajinan yang dibuat wajib mengikutsertakan komponen upah tenaga kerja ibu pengrajin (minimal standar Rp 10.000–Rp 15.000/jam setara UMR riil pengerjaan rumahan) sebelum margin kas ditambahkan.
* **BR-04 (Prinsip Cadangan Manual / Zero Downtime):** Apabila koneksi internet terputus atau batas kuota gratis API AI tercapai, sistem wajib menyediakan tombol input manual agar transaksi warga tidak tertunda.

---

## 8. Model Finansial & Kelayakan Usaha

### 8.1 Aliran Pendapatan (*Revenue Streams*)
1. **Biaya Aktivasi Sekali Bayar (*One-time Setup Fee*):** Dikenakan Rp 250.000 per kelompok PKK saat *onboarding*, mencakup pelatihan kader, konfigurasi database, dan akun mitra selamanya.
2. **Kemitraan Dana Desa & CSR Korporasi:** Paket adopsi 1 desa binaan (3–5 pos RW) didanai melalui pos Anggaran Pendapatan dan Belanja Desa (APBDes) bidang pemberdayaan masyarakat.
3. **Komisi Penjualan Mikro (Tahap Lanjut):** Komisi 5% untuk kas platform dari tiap transaksi produk kerajinan yang terjual melalui katalog bersama.

### 8.2 Struktur Biaya Operasional (*Zero-Cost Development Architecture*)
Untuk tahap kompetisi dan validasi awal, platform memanfaatkan ekosistem cloud gratis:
* *Frontend & Backend Hosting:* Vercel Hobby Tier (Gratis Rp0).
* *Database, Auth & Storage:* Supabase Free Plan (Gratis Rp0).
* *Multimodal AI Engine:* Google Gemini 1.5 Flash Free Tier dengan kuota harian yang diefisiensikan melalui *prompt caching* dan kompresi gambar klien (Gratis Rp0).

### 8.3 Unit Economics Produk Kerajinan (Contoh: Tas Belanja Perca)
```
+--------------------------------------------------------------+
| Rincian Biaya Produksi 1 Unit Tas Belanja                    |
+--------------------------------------------------------------+
| 1. Bahan Limbah (300 gr kain perca disetor warga) : Rp  1.500 |
| 2. Bahan Tambahan (Ritsleting & Benang toko)      : Rp  2.500 |
| 3. Upah Pengerjaan Ibu PKK (45 menit kerja)       : Rp  9.500 |
+--------------------------------------------------------------+
| HARGA POKOK PENJUALAN (HPP TOTAL)                 : Rp 13.500 |
| Margin Kas Sosial PKK (48%)                       : Rp  6.500 |
+--------------------------------------------------------------+
| HARGA JUAL KE KONSUMEN                            : Rp 20.000 |
+--------------------------------------------------------------+
```
*Dampak Finansial:* Warga menerima uang sampah Rp 1.500, Ibu pengrajin menerima upah tunai Rp 9.500, dan Kas PKK memperoleh surplus bersih Rp 6.500 per unit.

---

## 9. Indikator Keberhasilan Bisnis (Key Performance Indicators)

```text
+-------------------------+-------------------------------------------------------------+
| Kategori KPI            | Tolak Ukur Keberhasilan (Target 3 Bulan Pertama)            |
+-------------------------+-------------------------------------------------------------+
| Operasional Komunitas   | Minimal 3 Pos RW aktif mengadopsi KriyaPKK.                 |
| Partisipasi Warga       | > 100 Kepala Keluarga aktif memilah dan menyetor sampah.    |
| Reduksi Limbah          | > 500 kg limbah anorganik dialihkan dari TPA per posko.     |
| Pemberdayaan Finansial  | > Rp 3.000.000 akumulasi upah produktif tersalurkan ke ibu. |
| Kepuasan Pengguna       | System Usability Scale (SUS) > 75 (Kategori Good/Excellent).|
+-------------------------+-------------------------------------------------------------+
```

---

## 10. Manajemen Risiko Bisnis & Mitigasi

| Risiko Bisnis | Probabilitas | Dampak | Strategi Mitigasi Terencana |
|---|:---:|:---:|---|
| **Resistensi Teknologi oleh Ibu-Ibu PKK** | Sedang | Tinggi | Antarmuka berorientasi kamera tanpa mengetik (*zero-typing flow*), tulisan ukuran besar, dan pendampingan kader muda karang taruna. |
| **Volatilitas Permintaan Produk Kerajinan** | Sedang | Sedang | Produksi hanya berbasis pesanan (*make-to-order*) atau pesanan suvenir kantor desa/acara wisuda, bukan menimbun stok jadi. |
| **Keterbatasan Kuota Layanan Cloud Gratis** | Rendah | Sedang | Penerapan *client-side image compression*, *response caching*, dan pembatasan kuota scan per posko (30 scan/hari). |
| **Defisit Kas Posko di Awal Operasional** | Sedang | Tinggi | Warga dapat memilih skema "Tabungan Sampah Hari Raya" di mana pencairan dana dilakukan periodik per 3 bulan. |
