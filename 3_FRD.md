# FRD: Functional Requirements Document

Produk: KriyaPKK
Versi: 1.0 (tanpa marketplace)

Keterangan prioritas: M (wajib MVP), S (sebaiknya ada), C (tahap lanjut).
Aktor: ADM (admin platform), PGR (pengurus), ANG (anggota), WRG (warga).

## Modul 1: Mitra dan Akun

FR01 Pendaftaran kelompok (M)
Aktor: PGR. Input: nama kelompok, alamat, nama pengurus, email, kata sandi. Proses: membuat grup dan akun pengurus dengan status belum aktif. Output: akun dibuat. Aturan: email unik.

FR02 Aktivasi mitra (M)
Aktor: ADM. Proses: admin mengubah status grup menjadi aktif setelah biaya aktivasi diterima di luar sistem. Aturan: grup belum aktif hanya bisa melihat halaman status. Output: akses fitur terbuka.

FR03 Kelola anggota (M)
Aktor: PGR. Input: nama, email atau nomor HP, peran. Proses: membuat, mengubah, dan menonaktifkan akun anggota. Aturan: pengurus tidak dapat menghapus dirinya sendiri.

FR04 Autentikasi dan peran (M)
Aktor: semua. Proses: login dan logout, pembatasan menu dan data berdasarkan peran dan group_id. Aturan: sesi berakhir saat logout, akses lintas grup ditolak oleh RLS.

## Modul 2: Pengaturan

FR05 Tabel harga (M)
Aktor: PGR. Input: jenis barang, harga per kg, status aktif. Proses: menyimpan dan mengubah harga. Aturan: harga lebih dari nol, perubahan hanya berlaku untuk setoran berikutnya. Data awal disediakan template jenis umum (plastik PET, HDPE, kardus, kertas, kain perca, kaca, logam).

FR06 Pengaturan upah dan margin (M)
Aktor: PGR. Input: tarif upah per jam atau persentase, margin default. Proses: menyimpan nilai default untuk costing. Aturan: margin antara 0 dan 300 persen.

## Modul 3: Setoran dan Scan

FR07 Unggah foto (M)
Aktor: PGR. Proses: ambil foto dari kamera atau galeri, kompres di klien, unggah ke Storage. Aturan: format JPEG atau PNG, ukuran akhir kurang dari 500 KB.

FR08 Scan AI (M)
Aktor: PGR. Proses: server memeriksa kuota dan cache, memanggil AI Vision, memvalidasi JSON. Output: daftar barang dengan jenis, kondisi (bersih, kotor, rusak), kelayakan, dan alasan singkat. Aturan: barang berbahaya ditandai tidak layak. Satu foto dapat berisi beberapa jenis barang.

FR09 Koreksi manual (M)
Aktor: PGR. Proses: mengubah jenis, kondisi, atau kelayakan hasil AI, atau memilih jenis secara manual. Aturan: koreksi selalu diutamakan di atas hasil AI.

FR10 Berat dan taksiran harga (M)
Aktor: PGR. Input: berat per jenis (kg). Proses: harga diambil dari tabel harga, total dihitung. Aturan: barang tidak layak bernilai nol. Rumus: total = berat dikali harga per kg.

FR11 Persetujuan warga (M)
Aktor: PGR atas nama WRG. Proses: menampilkan rincian dan total, pengurus memilih setuju atau batal. Output: setoran berstatus disetujui atau dibatalkan.

FR12 Saldo dan stok bertambah (M)
Aktor: sistem. Proses: saat setoran disetujui, saldo warga bertambah, stok bertambah, dan baris kas dicatat sebagai pembelian bahan. Aturan: dalam satu transaksi database.

FR13 Pembayaran atau penarikan saldo (S)
Aktor: PGR. Proses: mencatat pembayaran tunai atau penarikan saldo warga. Aturan: tidak boleh melebihi saldo. Output: saldo berkurang dan kas tercatat.

FR14 Data warga (M)
Aktor: PGR. Input: nama dan nomor HP. Proses: membuat atau memilih warga saat setoran. Aturan: warga baru dapat dibuat langsung dari form setoran.

## Modul 4: Stok

FR15 Daftar stok (M)
Aktor: PGR, ANG. Output: stok per jenis dengan jumlah kg dan nilai.

FR16 Pengurangan stok saat produksi (M)
Aktor: sistem. Proses: stok berkurang sesuai bahan batch produksi. Aturan: tidak boleh negatif, batch ditolak jika stok kurang.

FR17 Peringatan stok (C)
Aktor: sistem. Proses: menandai stok menumpuk atau menipis berdasarkan ambang.

## Modul 5: Ide dan Costing

FR18 Generator ide (M)
Aktor: PGR, ANG. Proses: sistem membuat ringkasan stok singkat, memeriksa cache, lalu memanggil AI. Output: beberapa ide kerajinan. Aturan: ide hanya tampil bila stok bahan utama cukup. Ide dibuat ulang hanya bila stok berubah signifikan atau pengguna meminta.

FR19 Detail ide (M)
Output: bahan dari stok dan jumlahnya, alat, bahan tambahan yang perlu dibeli di warung, tingkat kesulitan, dan estimasi waktu.

FR20 Perhitungan modal (M)
Proses: modal = nilai bahan dari stok + bahan tambahan + porsi alat + upah. Input tambahan: harga bahan tambahan dapat diubah pengurus. Aturan: nilai stok memakai nilai rata rata per kg.

FR21 Harga jual dan margin (M)
Proses: harga jual = modal dikali (1 + margin), dibulatkan ke Rp500. Aturan: pengurus dapat mengubah harga jual dan margin langsung tampil ulang.

FR22 Panduan pengerjaan (M)
Proses: dibuat saat ide dipilih, berisi persiapan, langkah, tips, dan keselamatan. Disimpan di database dan dipakai ulang. Aturan: tidak dibuat ulang bila sudah ada untuk kombinasi ide dan bahan yang sama.

FR23 Template ide (S)
Proses: tersedia 20 sampai 30 ide dasar yang sudah ditulis. AI hanya menyesuaikan jumlah dan bahan. Tujuan: mengurangi token.

## Modul 6: Produksi

FR24 Buat batch produksi (M)
Aktor: PGR. Input: ide, jumlah produk, anggota yang ditugaskan. Proses: memeriksa stok, mengunci bahan. Output: batch berstatus berjalan.

FR25 Catat hasil produksi (M)
Aktor: ANG, PGR. Input: jumlah jadi, jumlah gagal, foto hasil. Proses: batch selesai, stok produk jadi bertambah. Aturan: jumlah gagal tetap tercatat sebagai biaya.

FR26 Upah anggota (M)
Aktor: PGR. Proses: upah dihitung per anggota (berdasarkan jam atau jumlah produk) dan dicatat. Output: baris upah dan baris kas pengeluaran. Anggota melihat upahnya sendiri.

## Modul 7: Penjualan Manual

FR27 Catat penjualan (M)
Aktor: PGR. Input: produk jadi, jumlah, harga, nama pembeli (opsional), tanggal. Proses: stok produk jadi berkurang dan kas bertambah. Aturan: jumlah tidak boleh melebihi stok produk jadi.

FR28 Stok produk jadi (M)
Output: daftar produk jadi dengan jumlah, modal per unit, dan harga jual.

## Modul 8: Keuangan

FR29 Buku kas (M)
Aktor: PGR. Output: daftar pemasukan dan pengeluaran dengan kategori (pembelian setoran, bahan tambahan, upah, penjualan, lainnya). Aturan: koreksi dilakukan lewat entri pembalik, bukan hapus.

FR30 Laporan laba rugi sederhana (M)
Output: pendapatan, modal, upah, dan laba per periode (minggu, bulan).

FR31 Ekspor laporan (S)
Output: berkas CSV dari buku kas dan laba rugi.

## Modul 9: Dampak

FR32 Dashboard dampak (M)
Output: total kg sampah per jenis, rupiah ke warga, jumlah produk dibuat dan terjual, laba, dan grafik tren bulanan. Aturan: hanya data kelompok sendiri.

## Modul 10: AI dan Kuota

FR33 Kuota AI (M)
Proses: setiap panggilan AI memeriksa kuota harian kelompok (contoh: 30 scan dan 10 pembuatan ide). Output: pesan jelas bila habis. Pencatatan ke tabel ai_usage.

FR34 Mode manual cadangan (M)
Proses: bila AI gagal, timeout, atau kuota habis, pengurus memilih jenis barang dari daftar dan ide dari template. Aturan: seluruh alur tetap berjalan.

FR35 Cache AI (M)
Proses: hasil scan disimpan berdasarkan hash foto, hasil ide berdasarkan hash ringkasan stok, panduan berdasarkan ide dan bahan. Aturan: cache dipakai sebelum memanggil AI.

## Modul 11: Admin Platform

FR36 Kelola mitra (M)
Aktor: ADM. Output: daftar kelompok, status aktivasi, dan tombol aktifkan atau nonaktifkan.

FR37 Pantau penggunaan AI (S)
Aktor: ADM. Output: jumlah panggilan dan estimasi biaya per kelompok, serta pengaturan kuota.

## Alur Utama

Alur A, setoran: FR14, FR07, FR08, FR09, FR10, FR11, FR12.
Alur B, produksi: FR15, FR18 sampai FR22, FR24, FR25, FR26.
Alur C, penjualan: FR28, FR27, FR29, FR30.

## Matriks Peran

1. ADM: FR02, FR36, FR37.
2. PGR: semua kecuali FR02, FR36, FR37.
3. ANG: FR04, FR15, FR18 sampai FR22, FR25, melihat upah sendiri dari FR26.
4. WRG: melihat saldo dan riwayat setoran sendiri (opsional).

## Contoh Skema Keluaran AI

Scan: daftar objek dengan field jenis, kondisi, layak (boolean), dan alasan singkat.
Ide: daftar ide dengan field judul, bahan_dari_stok (jenis dan kg), alat, bahan_tambahan (nama dan perkiraan harga), waktu_jam, kesulitan.
Panduan: persiapan, langkah (urut), tips, dan catatan keselamatan.
