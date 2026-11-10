# KriyaPKK

Ekosistem digital pengelolaan sampah anorganik dan ekonomi kreatif kampung berbasis AI. Sistem mini ERP dan kasir untuk kelompok PKK, dijual dengan biaya aktivasi sekali bayar.

## 1. Ringkasan

KriyaPKK membantu kelompok PKK mengubah sampah anorganik warga menjadi produk kerajinan bernilai jual. Warga menyetor sampah dan dibayar sesuai taksiran. AI mengenali jenis dan kondisi barang, membaca stok, lalu menyusun ide kerajinan lengkap dengan bahan, alat, modal, harga jual, dan panduan pengerjaan. Produk dijual lewat katalog online dengan pembagian hasil yang transparan.

Prinsip pengembangan: tanpa modal uang (semua layanan memakai paket gratis atau sandbox) dan hemat token AI (AI hanya dipanggil bila benar benar perlu).

## 2. Problem

1. Limbah anorganik rumah tangga seperti plastik, kardus, kain perca, kaca, dan logam menumpuk, dibakar, atau dibuang karena belum dikelola dari tingkat kampung.
2. Kelompok PKK kesulitan menemukan ide produk bernilai jual dari limbah, dan tidak tahu bahan apa yang harus dibeli tambahan.
3. Usaha kelompok tidak punya pencatatan modal, stok, harga pokok, dan harga jual. Untung rugi tidak diketahui dan keputusan sering berdasarkan perkiraan.
4. Penilaian harga barang setoran warga tidak seragam sehingga warga kurang termotivasi menyetor.
5. Akses pemasaran digital terbatas, dan sistem berlangganan bulanan terlalu memberatkan kelompok PKK.
6. Aplikasi bank sampah yang ada umumnya hanya mencatat setoran, belum membantu proses produksi dan penjualan.

## 3. Keterkaitan dengan SDG dan Asta Cita

Fokus hanya pada sampah anorganik, sehingga risiko keamanan pangan dan perizinan makanan tidak ikut terbawa.

SDG yang disasar:

1. SDG 8 (utama): penghasilan baru dari limbah, perhitungan modal, dan tumbuhnya usaha kecil kampung.
2. SDG 11: sampah kampung berkurang karena dikelola dari sumbernya.
3. SDG 9: teknologi AI untuk valuasi dan perhitungan biaya menjangkau kelompok desa.
4. SDG 4: panduan AI langkah demi langkah menjadi pelatihan keterampilan bagi ibu ibu.
5. SDG 3 (pendukung): berkurangnya pembakaran sampah menurunkan polusi udara dan risiko ISPA.

Asta Cita yang disasar:

1. Asta Cita 6: pembangunan dari desa dan pemberdayaan ekonomi (paling kuat).
2. Asta Cita 2: ekonomi hijau dan sirkular.
3. Asta Cita 4: penguatan sumber daya manusia melalui peningkatan keterampilan.

## 4. Solusi

Aplikasi web (Next.js) yang berfungsi sebagai kasir setoran sampah, pengelola stok, penasihat produksi, dan toko online bagi kelompok PKK.

Fitur utama:

1. Scan barang dengan AI Vision untuk mengenali jenis dan kondisi, termasuk menandai barang yang tidak layak atau berbahaya (kaca pecah, logam tajam, wadah bekas bahan kimia).
2. Taksiran harga dari tabel harga per kilogram yang diatur pengurus. AI tidak menentukan harga, sehingga hasilnya konsisten dan adil.
3. Pencatatan setoran warga, saldo warga, dan stok bahan baku.
4. Generator ide kerajinan dari ringkasan stok, lengkap dengan bahan, alat, dan bahan tambahan yang perlu dibeli di warung.
5. Kalkulator modal otomatis: nilai setoran warga, bahan tambahan, alat, dan upah, lalu taksiran harga jual dan margin.
6. Panduan pengerjaan detail dari AI, dibuat saat produk dipilih.
7. Katalog produk publik dengan checkout online dan pembagian hasil yang transparan.
8. Dashboard dampak dan keuangan: kilogram sampah dialihkan, rupiah yang diterima warga, kas PKK, dan komisi platform.

## 5. Pihak yang Terlibat

1. Tim pengembang: penyedia platform, penerima biaya aktivasi dan komisi platform.
2. Pengurus PKK (mitra): membayar aktivasi, mengelola posko, membuat akun anggota, mengatur tabel harga, dan mengunggah produk.
3. Ibu ibu PKK (pengrajin): memilih ide, memproduksi, dan menerima upah.
4. Warga: menyetor sampah dan menerima saldo atau uang.
5. Pembeli: membeli produk dari katalog.

## 6. Alur Sistem

1. Pengurus PKK mendaftar dan membayar aktivasi sekali di awal. Tidak ada biaya bulanan.
2. Pengurus membuat akun anggota dan mengatur tabel harga per kilogram serta koordinat posko.
3. Warga membawa sampah anorganik ke posko.
4. Pengurus memotret barang dan menimbang. Berat diinput manual dari timbangan.
5. AI mengenali jenis dan kondisi barang. Harga dihitung dari tabel harga, bukan dari AI.
6. Warga menyetujui taksiran dan menerima saldo atau uang. Jika tidak setuju, transaksi dibatalkan.
7. Data jenis, berat, dan harga masuk database sebagai stok bahan baku.
8. Saat stok berubah signifikan, AI membaca ringkasan stok dan menyusun ide produk beserta bahan, alat, modal, upah, harga jual, dan margin. Ide hanya muncul jika stok cukup, dan bahan yang kurang ditandai.
9. Ibu ibu PKK memilih ide. Panduan pengerjaan detail dibuat saat itu dan disimpan.
10. Produk jadi diunggah pengurus ke katalog dengan foto, berat, dan harga.
11. Pembeli memesan, memilih pengiriman sesuai zona, dan membayar.
12. Sistem mencatat pembagian dana: 95 persen untuk kas PKK dan 5 persen komisi platform, lalu upah anggota dicatat dalam buku kas internal.

## 7. Pembagian Dana (Split Payment)

Pembeli membayar sekali. Dana dibagi menjadi bagian PKK dan komisi platform.

Pilihan cara pembagian:

1. Split asli di gateway: gateway membagi dana ke beberapa rekening. Perlu fitur marketplace atau sub merchant dari penyedia pembayaran. Pada dokumentasi publik Midtrans belum ditemukan fitur ini, sehingga harus dikonfirmasi ke Midtrans atau dicek pada penyedia lain.
2. Tampung lalu bayarkan: semua dana masuk akun platform, lalu 95 persen dicairkan ke rekening PKK melalui layanan payout (Midtrans Iris). Tidak real time, ada biaya transfer, dan butuh verifikasi bisnis.
3. Langsung ke PKK: tiap PKK punya akun merchant sendiri dan komisi ditagih terpisah. Paling aman secara regulasi tetapi pendaftarannya rumit.

Keputusan untuk lomba dan tanpa modal:

1. Demo memakai Midtrans Snap sandbox (gratis). Pembagian 95 dan 5 persen dicatat di tabel ledger database, dan dashboard menampilkan saldo PKK serta komisi platform.
2. Pada pitch, tahap produksi ditulis sebagai payout via Iris atau split asli bila tersedia. Kata real time tidak dipakai sebelum terbukti.
3. Biaya gateway dihitung: komisi bersih adalah 5 persen dikurangi biaya gateway. Alternatifnya, biaya gateway dibebankan kepada pembeli sebagai biaya layanan.

## 8. Pengiriman dan Batas Radius

Batas pengiriman 150 km dari posko, agar ongkir tidak melebihi nilai produk yang harganya relatif murah.

Cara kerja:

1. Koordinat posko disimpan saat mitra mendaftar.
2. Pembeli memilih lokasi lewat pin peta atau kecamatan. Geocoding memakai Nominatim OpenStreetMap yang gratis.
3. Jarak dihitung dengan rumus Haversine (garis lurus) di sisi server. Karena jarak jalan lebih jauh, batas garis lurus ditetapkan sekitar 100 km sebagai pengganti 150 km jarak jalan.
4. Zona 1, 0 sampai 10 km: ambil di posko atau kurir lokal atau COD.
5. Zona 2, 10 sampai 50 km: kurir lokal atau ekspedisi.
6. Zona 3, 50 sampai 150 km: ekspedisi.
7. Lebih dari 150 km: tidak tersedia, tampilkan pesan jelas.

Tanpa modal: tarif ongkir per zona dan per kilogram diatur sendiri oleh pengurus dalam tabel sederhana, sehingga tidak perlu berlangganan API kurir. Integrasi Biteship atau RajaOngkir masuk roadmap. Nomor resi diinput manual.

Aturan anti ongkir berlebihan:

1. Ongkir maksimal sekitar 30 persen dari harga produk. Jika lebih, tampilkan peringatan atau sarankan menambah barang.
2. Minimal pembelian untuk zona 3.
3. Gratis ongkir untuk zona 1 dan 2 di atas nominal tertentu.
4. Berat dan dimensi wajib diisi saat unggah produk.

## 9. Model Bisnis (untuk Divisi Entrepreneur)

Sub tema yang dipilih: Bidang Teknologi (a), dengan keterkaitan pada Industri Kreatif (d).

Sumber pendapatan:

1. Biaya aktivasi sekali bayar dari setiap kelompok PKK.
2. Komisi platform 5 persen dari setiap produk yang terjual.
3. Fitur premium pada tahap lanjut: laporan keuangan, ekspor pembukuan, dan paket tambahan kuota scan.
4. Kemitraan Dana Desa, CSR, atau pemerintah daerah untuk pendaftaran banyak PKK sekaligus.

Hal yang harus dihitung di pitch:

1. Biaya AI per mitra per bulan, berdasarkan jumlah scan dan pembuatan ide yang dibatasi kuota.
2. Titik impas: berapa mitra dan berapa produk terjual per bulan agar komisi dan aktivasi menutup biaya server dan AI.
3. Arus kas awal PKK: kas awal untuk membayar warga sebelum produk laku, serta cara pencatatannya.

Perbedaan dengan pesaing (aplikasi bank sampah digital): KriyaPKK tidak berhenti di pencatatan setoran, tetapi mencakup valuasi, ide produksi, perhitungan modal dan harga jual, panduan, penjualan, dan pembagian hasil.

## 10. Cakupan MVP dan Roadmap

MVP (4 hari):

1. Login dan peran: pengurus dan anggota.
2. Setoran: foto, scan AI, berat, harga dari tabel, saldo warga.
3. Stok bahan baku.
4. Generator ide dan kalkulator modal dan harga jual.
5. Panduan pengerjaan dengan cache.
6. Katalog produk dan checkout Midtrans Snap sandbox.
7. Ongkir per zona dengan tabel dan batas 150 km.
8. Ledger pembagian dana dan dashboard dampak.

Roadmap:

1. Payout otomatis lewat Iris atau split asli.
2. Integrasi API kurir dan pelacakan resi.
3. Marketplace lintas kelompok PKK.
4. Mode offline dan notifikasi WhatsApp.
5. Analitik tren harga dan permintaan pasar.

## 11. Teknologi Tanpa Modal

Semua memakai paket gratis atau sandbox. Batas paket gratis dapat berubah, sehingga perlu dicek ulang saat membangun.

1. Frontend dan backend: Next.js dengan App Router, Tailwind, dan shadcn/ui.
2. Database, autentikasi, dan penyimpanan foto: Supabase paket gratis, dengan Row Level Security.
3. Hosting: Vercel paket hobby atau layanan gratis lain.
4. AI Vision dan teks: Gemini API paket gratis (model Flash atau Flash Lite). OpenRouter dengan model gratis sebagai cadangan.
5. Pembayaran: Midtrans Snap sandbox.
6. Peta dan geocoding: Leaflet, OpenStreetMap, dan Nominatim.
7. Desain: komponen shadcn, tanpa aset berbayar.
8. Data demo: data contoh yang dibuat sendiri, tanpa membeli dataset.

## 12. Efisiensi Token dan Biaya AI

1. Kecilkan foto di browser sebelum diunggah (maksimal sekitar 768 piksel, JPEG kualitas 70 persen). Biaya vision mengikuti ukuran gambar.
2. Pisahkan model: model murah dan cepat untuk scan dan ide, model kuat hanya bila diperlukan.
3. Keluaran dibuat JSON dengan skema tetap dan batas max tokens. Saat scan tidak ada penjelasan panjang, hanya jenis, kondisi, dan alasan singkat.
4. Satu foto untuk banyak barang agar jumlah panggilan berkurang.
5. Harga tidak dihitung oleh AI. Harga berasal dari tabel per kilogram, sehingga hemat token dan konsisten.
6. Cache hasil scan berdasarkan hash foto dan jenis barang di database.
7. Kirim ringkasan stok ke AI dalam format pendek, misalnya plastik PET 12 kg, kardus 8 kg, kain 3 kg. Jangan kirim seluruh baris database.
8. Ide dibuat hanya saat stok berubah signifikan, lalu disimpan. Halaman yang dibuka ulang membaca dari database.
9. Panduan detail dibuat saat produk dipilih, lalu disimpan per kombinasi produk dan bahan.
10. Perpustakaan template berisi 20 sampai 30 ide umum yang sudah ditulis. AI hanya menyesuaikan jumlah, bahan, dan perhitungan modal.
11. Kuota per mitra, misalnya 30 scan per hari dan 10 pembuatan ide per hari. Kuota tambahan menjadi fitur premium.
12. System prompt dibuat pendek dan tetap, dan manfaatkan prompt caching bila penyedia mendukung.
13. Satu penyedia utama (Gemini) dengan satu cadangan, agar kode tidak rumit.
14. Penanganan error: bila AI gagal atau melebihi batas, pengurus bisa memilih jenis barang secara manual dari daftar, sehingga sistem tetap berjalan.

## 13. Struktur Database Ringkas

1. groups: kelompok PKK, koordinat posko, status aktivasi.
2. users: pengurus, anggota, dan peran.
3. price_table: jenis barang dan harga per kilogram.
4. deposits: setoran warga, berat, harga, dan status.
5. stock: jenis bahan, jumlah, dan nilai.
6. ideas: ide produk, bahan, alat, modal, harga jual, dan cache panduan.
7. products: produk jadi, foto, berat, dan harga.
8. orders: pesanan, zona, ongkir, dan status pembayaran.
9. ledger: pembagian dana PKK, komisi platform, dan upah anggota.
10. ai_usage: pencatatan kuota dan penggunaan AI.

## 14. Rencana Kerja 4 Hari

1. Hari 1: setup Next.js dan Supabase, autentikasi, skema database, alur setoran dan scan AI dengan JSON terstruktur.
2. Hari 2: stok, generator ide, kalkulator modal dan harga jual, panduan dengan cache dan kuota.
3. Hari 3: katalog, checkout Snap sandbox, ongkir zona dan batas radius, ledger pembagian dana.
4. Hari 4: dashboard dampak, data demo, perapian tampilan, deploy, video demo, dan bahan pitch.

## 15. Risiko dan Batasan

1. AI hanya skrining awal. Keputusan akhir kelayakan barang tetap di pengurus.
2. Keselamatan: barang tajam atau bekas bahan kimia ditandai tidak layak.
3. Pembayaran dan payout produksi butuh verifikasi bisnis dan penjelasan regulasi. Pada lomba cukup memakai sandbox dan menjelaskan rencana tahap produksi.
4. Pasar awal terbatas pada radius sekitar 150 km. Ini sejalan dengan cerita ekonomi sirkular kampung.
5. Batas paket gratis layanan pihak ketiga bisa berubah, sehingga ada rencana cadangan dan kuota.
6. Pembeli awal belum ada. Strategi: katalog dibagikan lewat WhatsApp, kerja sama sekolah dan kantor desa, serta pesanan seragam atau suvenir.

## 16. Validasi dan Bahan Pitch

1. Uji scan AI pada 20 sampai 30 foto barang nyata, lalu tampilkan tingkat akurasi dan keterbatasannya.
2. Contoh perhitungan satu produk dari awal sampai akhir: modal, upah, harga jual, margin, dan komisi.
3. Simulasi dampak satu PKK selama satu bulan: kilogram sampah, rupiah yang diterima warga, dan jumlah produk.
4. Wawancara singkat satu atau dua pengurus PKK atau bank sampah sebagai bukti masalah nyata.
5. Perbandingan dengan aplikasi bank sampah yang sudah ada dan penjelasan perbedaan KriyaPKK.
