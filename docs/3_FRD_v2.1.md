# FRD: Functional Requirements Document

Produk: KriyaPKK
Versi: 2.1 (diselaraskan dengan kode commit `aa876a4`, 1 November 2026, dan aplikasi live; diverifikasi 10 November 2026)
Menggantikan: FRD 1.0 (25 Oktober 2026, "tanpa marketplace")

## Cara membaca

Status setiap fungsi:

| Status | Arti |
|---|---|
| Ada | Terimplementasi dan sesuai uraian |
| Sebagian | Terimplementasi sebagian atau berbeda dari rencana awal (perbedaan ditulis) |
| Belum | Belum ada di kode |

Prioritas: M (wajib), S (sebaiknya ada), C (tahap lanjut). Aktor: ADM (admin platform), PGR (pengurus posko), ANG (anggota perajin), PMB (pembeli), SIS (sistem). Warga penyetor tidak punya akun; datanya dicatat pengurus.

Nomor FR01 sampai FR37 dipertahankan dari versi 1.0 agar keterlacakan tidak putus. FR38 sampai FR58 baru.

## Modul 1: Mitra dan akun

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR01 | Pendaftaran kelompok | PGR | Ada | Input: nama kelompok, alamat, kota, kode pos, WhatsApp, titik lokasi, nama pengurus, email, kata sandi, persetujuan privasi. Wajib: nama kelompok (minimal 3 huruf), alamat posko (minimal 5), kota (minimal 3), WhatsApp, nama pengurus (minimal 2), email, kata sandi (minimal 8), persetujuan; kode pos dan titik lokasi opsional (dapat diisi nanti di Pengaturan). Terbentuk kelompok berstatus `pending`, akun berperan `pengurus`, dan 7 harga awal. Peran dan kelompok dari metadata pendaftaran tidak pernah dipercaya |
| FR02 | Aktivasi mitra | ADM | Ada | Admin mengubah status `pending`, `active`, atau `inactive`. Biaya aktivasi diterima di luar sistem. Kelompok belum aktif hanya melihat halaman `/status` |
| FR03 | Kelola anggota | PGR | Sebagian | Pengurus membuat akun (nama, email, kata sandi minimal 8 karakter, peran anggota atau pengurus; email langsung terkonfirmasi), menonaktifkan, dan mengaktifkan. Tidak ada pendaftaran lewat nomor HP. Pengurus tidak bisa menonaktifkan dirinya sendiri; tidak ada fitur hapus akun |
| FR04 | Autentikasi dan peran | semua | Ada | Email dan kata sandi (Supabase Auth). Empat peran: admin, pengurus, anggota, pembeli. Penjaga halaman `requireMe` dan `proxy.ts`. Akses lintas kelompok ditolak RLS |

## Modul 2: Pengaturan

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR05 | Tabel harga | PGR | Ada | Harga per kg, status aktif. Harus lebih dari 0. Tujuh jenis awal: Plastik PET 3.000; Plastik HDPE 2.500; Kardus 1.500; Kertas 1.200; Kain perca 3.000; Kaca 500; Logam 4.000. Harga disalin ke baris setoran saat dibuat, sehingga perubahan hanya berlaku untuk setoran berikutnya |
| FR06 | Upah dan margin | PGR | Sebagian | Upah per jam (bawaan Rp12.500, tidak ada batas minimum) dan margin bawaan (bawaan 40%, rentang 0 sampai 300%). Tidak ada mode upah persentase |

## Modul 3: Setoran dan scan

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR07 | Unggah foto | PGR | Ada | Kamera atau galeri. Dikompres di peramban (sisi terpanjang 768 px, JPEG kualitas 70%). Batas keras 1 MB; format JPEG, PNG, WebP. Disimpan di bucket privat `photos` dengan jalur `<id_kelompok>/deposits/...` |
| FR08 | Scan AI | PGR | Ada | Urutan: login, unduh foto, cek cache (hash foto), cek kuota, panggil Gemini, validasi Zod, simpan cache. Hasil per jenis: kondisi (bersih, kotor, rusak), kelayakan, alasan singkat (maksimal 12 kata). Maksimal 10 baris per foto. Jenis di luar tabel harga menjadi "Lainnya" dan tidak layak. Barang berbahaya ditandai tidak layak. AI tidak menaksir berat maupun harga. Cache hit tidak memakai kuota |
| FR09 | Koreksi manual | PGR | Ada | Pengurus dapat mengubah jenis, kondisi, dan kelayakan, atau memilih jenis tanpa AI. Bila AI gagal atau kuota habis, API membalas `manual: true` |
| FR10 | Berat dan taksiran | PGR | Ada | Subtotal = berat kali harga per kg dari tabel harga (dibulatkan ke rupiah). Barang tidak layak = Rp0. Jenis layak tanpa harga ditolak (`HARGA_BELUM_DIATUR`). Perhitungan di database |
| FR11 | Persetujuan warga | PGR | Ada | Setoran berstatus `draft`, lalu disetujui (pilih masuk saldo atau dibayar tunai) atau dibatalkan. Setoran yang sudah diproses tidak bisa diubah |
| FR12 | Stok dan saldo bertambah | SIS | Sebagian | Dalam satu transaksi: stok naik dengan nilai rata-rata tertimbang (hanya baris layak). **Lalu salah satu:** saldo warga naik, atau bila dibayar tunai kas keluar kategori `pembelian_setoran`. Kas tidak tercatat saat hanya masuk saldo; baru tercatat saat saldo dicairkan (FR13) |
| FR13 | Pencairan saldo warga | PGR | Ada | Saldo turun, kas keluar. Tidak boleh melebihi saldo (`SALDO_TIDAK_CUKUP`) |
| FR14 | Data warga | PGR | Ada | Nama dan nomor HP (opsional). Warga baru dapat dibuat dari form setoran. Warga tidak punya akun dan tidak bisa melihat saldo sendiri |

## Modul 4: Stok

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR15 | Daftar stok | PGR, ANG | Ada | Per jenis: kg dan nilai rata-rata per kg |
| FR16 | Kurangi stok saat produksi | SIS | Ada | Stok dikunci per baris, berkurang saat batch dimulai. Batch ditolak bila kurang (`STOK_KURANG`). Pembatalan batch yang masih berjalan mengembalikan bahan |
| FR17 | Peringatan stok | SIS | Belum | Prioritas C. Belum ada |

## Modul 5: Ide dan costing

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR18 | Generator ide | PGR, ANG | Ada | Ringkasan stok pendek ("Plastik PET 12 kg; Kardus 8 kg"), hanya jenis dengan stok lebih dari 0,2 kg, kg dibulatkan. Hash ringkasan dipakai untuk cache, sehingga ide dibuat ulang hanya bila stok berubah berarti atau pengguna memaksa. Maksimal 3 ide per panggilan. Ide dengan stok cukup tampil di atas; yang kurang ditandai "Stok belum cukup" |
| FR19 | Detail ide | PGR, ANG | Ada | Bahan dari stok per unit, alat, bahan tambahan (nama dan harga), waktu kerja, tingkat kesulitan |
| FR20 | Perhitungan modal | SIS | Ada | Modal = nilai bahan dari stok (rata-rata tertimbang; bila belum ada stok, memakai tabel harga) + bahan tambahan + porsi alat (bawaan Rp500) + upah (jam x tarif). Dihitung di database; `lib/calc.ts` hanya pratinjau |
| FR21 | Harga jual dan margin | PGR | Ada | Harga jual = modal x (1 + margin), dibulatkan **ke atas** ke kelipatan Rp500. Pengurus dapat mengubah bahan tambahan, margin, atau harga jual langsung; margin dihitung ulang dari harga jual |
| FR22 | Panduan pengerjaan | PGR, ANG | Ada | Dibuat saat ide dipilih: persiapan, langkah (3 sampai 12), tips, keselamatan. Disimpan sekali dan tidak ditimpa. Cache lintas kelompok untuk kombinasi judul dan bahan yang sama. **Mode suara** (Web Speech API, bahasa Indonesia) |
| FR23 | Template ide | PGR | Sebagian | 13 template bawaan (bukan 20 sampai 30), dipakai sebagai mode manual tanpa AI. AI tidak menyesuaikan template |

## Modul 6: Produksi

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR24 | Buat batch | PGR | Ada | Input: ide, jumlah, anggota yang ditugaskan. Stok langsung dikurangi; bahan tambahan dicatat sebagai kas keluar `bahan_tambahan` |
| FR25 | Catat hasil | ANG, PGR | Ada | Input: jumlah jadi, jumlah gagal, foto. Jadi + gagal harus 1 sampai jumlah rencana. Anggota hanya bisa menyelesaikan batch yang ditugaskan kepadanya. Produk jadi bertambah; unit gagal tetap menjadi biaya |
| FR26 | Upah anggota | PGR | Ada | Pengurus mengisi jam dan jumlah per anggota (ada saran dari estimasi ide). Tersimpan di tabel upah dan kas keluar `upah`. Modal per unit produk jadi diperbarui. Anggota melihat upahnya sendiri |

## Modul 7: Penjualan langsung

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR27 | Catat penjualan | PGR | Ada | Jumlah tidak boleh melebihi stok. Harga bawaan = harga jual produk, bisa diubah. Menyimpan modal per unit saat itu (untuk laba). Kas masuk `penjualan` |
| FR28 | Stok produk jadi | PGR | Ada | Jumlah, modal per unit, harga jual. Satu tabel yang sama dipakai sebagai produk katalog (FR40) |

## Modul 8: Keuangan

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR29 | Buku kas | PGR | Ada | Kategori: modal awal, pembelian setoran, bahan tambahan, upah, penjualan, lainnya, koreksi. Hanya bisa ditambah. Entri manual hanya modal awal, bahan tambahan, dan lainnya. Koreksi lewat entri pembalik, sekali per entri |
| FR30 | Laporan laba rugi | PGR | Ada | Periode bebas (bawaan bulan ini). Pendapatan, modal terjual (dari modal per unit saat terjual), laba, jumlah unit, kas masuk dan keluar per kategori, saldo kas |
| FR31 | Ekspor | PGR | Sebagian | CSV buku kas saja (UTF-8 dengan BOM). Laba rugi tidak diekspor |

## Modul 9: Dampak

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR32 | Dashboard dampak | PGR, ANG | Ada | Total kg dan kg per jenis, rupiah ke warga, jumlah warga, produk dibuat dan terjual, pendapatan, laba, upah anggota, tren bulanan (bawaan 6 bulan). Tidak ada estimasi karbon |

## Modul 10: AI dan kuota

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR33 | Kuota AI | SIS | Sebagian | Per kelompok per hari: bawaan 30 scan dan 10 ide. Panduan dicatat sendiri dan dibatasi oleh angka kuota ide. Kuota dicek sebelum memanggil AI, dengan kunci advisory agar tidak bocor saat serentak. Pesan jelas saat habis. Pencatatan token di `ai_usage` |
| FR34 | Mode manual | SIS | Ada | Gagal, timeout, atau kuota habis: pengurus memilih jenis dari daftar dan ide dari template |
| FR35 | Cache AI | SIS | Ada | Scan per hash foto, ide per hash ringkasan stok, panduan per hash (judul + bahan). Satu tabel untuk semua kelompok |

## Modul 11: Admin platform

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR36 | Kelola mitra | ADM | Ada | Daftar kelompok, pengurus, jumlah akun, status, tombol aktifkan atau nonaktifkan |
| FR37 | Pantau AI | ADM | Sebagian | Panggilan hari ini, 30 hari, token masuk dan keluar per kelompok; admin dapat mengatur kuota. Tidak ada estimasi biaya |

## Modul 12: Profil toko posko (baru)

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR38 | Profil toko | PGR | Ada | Nama (minimal 3 huruf), alamat, kota, kode pos (5 angka), WhatsApp (dinormalisasi), titik lokasi (lintang dan bujur), tombol toko buka atau tutup. Tanpa titik lokasi, posko hanya melayani ambil di tempat |
| FR39 | Rekening posko | PGR | Ada | Nama bank, nomor rekening (5 sampai 20 digit), nama pemilik. Dipakai admin untuk pencairan |

## Modul 13: Produk dan katalog (baru)

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR40 | Kelola produk | PGR | Ada | Nama (minimal 2 huruf), kategori (kuliner, kerajinan, pupuk, kebersihan), deskripsi, bahan limbah, berat gram (bawaan 250), ukuran kemasan P x L x T cm (maksimal 300, opsional), harga jual (lebih dari 0), modal per unit, stok, foto (bucket publik `produk`), tampil di katalog |
| FR41 | Katalog publik | PMB, umum | Ada | Tanpa login. Daftar produk dari posko aktif yang tokonya buka; filter posko dan kategori, pencarian, halaman detail |

## Modul 14: Akun pembeli dan keranjang (baru)

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR42 | Akun pembeli | PMB | Ada | Daftar di `/daftar/pembeli` (nama, email, kata sandi, nomor HP, persetujuan privasi); peran `pembeli`, tanpa kelompok. Pembeli hanya mengakses toko dan pesanannya |
| FR43 | Keranjang | PMB | Ada | Disimpan di peramban (`localStorage`, cadangan memori bila diblokir). Tetap utuh saat pembeli diminta masuk |
| FR44 | Kebijakan privasi | umum | Ada | Halaman `/privasi` (UU No. 27 Tahun 2022) |

## Modul 15: Checkout, ongkir, pembayaran (baru)

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR45 | Pilihan pengiriman | PMB | Ada | Ambil di posko (gratis) atau ekspedisi. Ekspedisi mensyaratkan posko punya titik lokasi, alamat minimal 10 huruf, dan titik tujuan |
| FR46 | Ongkir | SIS | Ada | Batas 150 km garis lurus (Haversine). Mode `manual` (bawaan): jarak tagih = garis lurus x 1,3 dibulatkan ke atas; berat dikenakan = terbesar antara berat asli dan volumetrik (P x L x T / 6000), toleransi 0,3 kg, minimal 1 kg; tujuh layanan (JNE REG, YES, JTR; J&T EZ; SiCepat REG, GOKIL; Pos Kilat Khusus). Mode `biteship` memakai API Biteship. Dihitung ulang di server saat checkout |
| FR47 | Buat pesanan | SIS | Ada | Wajib akun pembeli aktif. Dalam satu transaksi: stok disisihkan, harga dan total dihitung dari database. Kode `KPK-YYMMDD-XXXXXX` |
| FR48 | Pembayaran Midtrans | PMB | Ada | Snap, QRIS dan virtual account (BCA, BNI, BRI, Permata, CIMB, Mandiri, lainnya). Batas bayar 60 menit. Total = produk + ongkir |
| FR49 | Webhook dan sinkronisasi | SIS | Ada | Tanda tangan SHA512 diverifikasi; status dicek ulang ke API Midtrans. Nominal harus sama dengan tagihan. Notifikasi ganda tidak mencatat penjualan dua kali. Saat lunas: baris penjualan per item, kas masuk `penjualan` senilai produk (tanpa ongkir). Halaman pesanan menyinkronkan status bila webhook terlambat |
| FR50 | Notifikasi WhatsApp | SIS | Ada | Satu pesan ke WhatsApp posko saat lunas (barang, pembeli, alamat, ekspedisi). Gagal kirim tidak menggagalkan pesanan. Perlu `FONNTE_API_TOKEN` |
| FR51 | Pesanan kedaluwarsa | SIS | Ada | Pesanan menunggu bayar yang ditinggal ditutup dan stok kembali. Dijalankan saat pesanan baru dan oleh cron harian (batas 90 menit); Midtrans juga mengirim status `expire` pada menit ke-60 |

## Modul 16: Pesanan (baru)

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR52 | Pesanan saya | PMB | Ada | Daftar dan detail milik pembeli sendiri (RLS), garis waktu status, tombol bayar, nomor resi, info posko. Tautan lama `/lacak/<kode>` dialihkan ke sini |
| FR53 | Pesanan online | PGR | Ada | Transisi: menunggu bayar ke batal; dibayar ke diproses, dikirim, atau siap diambil; diproses ke dikirim atau siap diambil; dikirim ke dikirim (perbaiki resi) atau selesai; siap diambil ke selesai. `dikirim` wajib nomor resi (6 sampai 40 karakter) dan hanya untuk pesanan ekspedisi; `siap_diambil` hanya untuk ambil di posko |
| FR54 | Simulasi pembayaran | PGR | Ada | Hanya bila `SIMULASI_PEMBAYARAN=true` dan Midtrans bukan mode produksi. Pesanan simulasi tidak dihitung dalam saldo posko. Wajib dimatikan sebelum transaksi sungguhan |

## Modul 17: Dana online dan pencairan (baru)

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR55 | Saldo dana online | PGR | Ada | Saldo = pesanan lunas (produk + ongkir, tanpa simulasi) dikurangi pencairan dikurangi biaya. **Tidak ada pemotongan komisi platform** |
| FR56 | Catat pencairan | ADM | Ada | Admin mentransfer ke rekening posko di luar aplikasi, lalu mencatat jumlah, biaya (bila biaya QRIS atau VA dibebankan ke posko), referensi, tanggal. Jumlah + biaya tidak boleh melebihi saldo. Dapat dihapus oleh admin |
| FR57 | Saldo semua posko | ADM | Ada | Daftar saldo, rekening tujuan, total dicairkan, tanggal pencairan terakhir |

## Modul 18: Operasional (baru)

| ID | Fungsi | Aktor | Status | Perilaku sebenarnya |
|---|---|---|---|---|
| FR58 | Keepalive dan diagnosa | SIS | Ada | Cron harian 01.00 UTC memanggil `/api/keepalive` (dilindungi `CRON_SECRET`): menjaga Supabase gratis aktif dan menutup pesanan kedaluwarsa. `/api/diagnosa` memeriksa database (fungsi katalog), mode dan kunci Midtrans, Biteship, dan Fonnte tanpa menampilkan kunci; aktif saat `npm run dev`, atau di produksi lewat parameter `?kunci=` yang sama dengan `CRON_SECRET` |

## Rencana (belum ada, tidak termasuk FR di atas)

Komisi platform 5% otomatis dan pembagian dana 95:5; pencairan otomatis (Midtrans Iris atau split); pelacakan resi lewat API kurir; pembatalan dan pengembalian dana pesanan terbayar dari aplikasi; rating dan ulasan; edit profil pembeli; hapus akun mandiri; mode luring; peringatan stok (FR17); estimasi biaya AI (FR37); kategori laporan selain buku kas untuk ekspor.

## Alur utama

- A, setoran: FR14, FR07, FR08, FR09, FR10, FR11, FR12, FR13.
- B, produksi: FR15, FR18 sampai FR22, FR24, FR25, FR26.
- C, penjualan langsung: FR28, FR27, FR29, FR30.
- D, penjualan online: FR40, FR41, FR42, FR43, FR45 sampai FR51, FR52, FR53.
- E, dana online: FR55, FR56, FR57.

## Matriks peran

| Peran | Fungsi |
|---|---|
| ADM | FR02, FR36, FR37, FR56, FR57, FR58 |
| PGR | Semua modul 1 sampai 11 dan 12 sampai 17 kecuali yang khusus ADM (FR02, FR36, FR37, FR56, FR57) dan PMB (FR42, FR43, FR52) |
| ANG | FR04, FR15, FR18 sampai FR22, FR25, melihat upah sendiri (FR26), dashboard dampak (FR32) |
| PMB | FR41 sampai FR44, FR45 sampai FR48, FR52 |
| Umum (tanpa login) | FR41, FR43, FR44 |

## Contoh skema keluaran AI

- Scan: `items[]` dengan `item_type` (salah satu jenis di tabel harga atau "Lainnya"), `condition`, `is_eligible`, `reason`; opsional `note`.
- Ide: `ideas[]` (1 sampai 3) dengan `title`, `description`, `materials[]` (jenis dari stok dan kg per unit), `tools[]`, `extras[]` (nama dan perkiraan harga), `time_hours`, `difficulty`.
- Panduan: `persiapan[]`, `langkah[]` (3 sampai 12), `tips[]`, `keselamatan[]`.

## Riwayat revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 25 Okt 2026 | Versi awal, tanpa marketplace |
| 2.0 | 9 Nov 2026 | Status per fungsi; koreksi FR03, FR07, FR12, FR23, FR31, FR33, FR37; FR38 sampai FR58 ditambahkan; bagian rencana |
| 2.1 | 10 Nov 2026 | FR01 (kolom wajib dan opsional di pendaftaran), FR58 (cakupan diagnosa dan cara akses) |
