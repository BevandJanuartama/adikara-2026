# KriyaPKK

Sistem manajemen usaha kerajinan dan olahan limbah kampung untuk ibu ibu PKK, ditenagai AI.

## Problem

1. Sampah rumah tangga di kampung masih dibuang, dibakar, atau ditumpuk karena warga tidak tahu bahwa barang sisa punya nilai ekonomi.
2. Barang sisa seperti botol, kardus, kain perca, kayu, dan sisa bahan pangan tidak terhubung ke pihak yang bisa mengolahnya.
3. Ibu ibu PKK punya waktu dan semangat, tetapi kesulitan menentukan ide kerajinan atau olahan yang sesuai dengan stok bahan yang tersedia.
4. Kelompok PKK umumnya tidak punya pencatatan modal, stok, dan harga jual. Akibatnya, usaha sulit dihitung untung ruginya dan sulit berkembang.
5. Tidak ada penilaian yang adil atas barang yang disetor warga, sehingga warga kurang termotivasi untuk ikut mengumpulkan.
6. Teknologi digital yang ada, seperti aplikasi bank sampah, hanya mencatat setoran dan belum membantu proses produksi dan penjualan.

## Keterkaitan dengan SDG dan Asta Cita

SDG yang disasar:

1. SDG 8 (utama): pekerjaan layak dan pertumbuhan ekonomi. Ibu PKK memperoleh penghasilan dari limbah, ada perhitungan modal dan taksiran harga jual, serta usaha kecil kampung bisa tumbuh.
2. SDG 11: kota dan permukiman berkelanjutan. Volume sampah kampung berkurang karena dikelola dari sumbernya.
3. SDG 9: industri, inovasi, dan infrastruktur. Teknologi AI untuk valuasi barang dan perhitungan biaya produksi menjangkau desa.
4. SDG 4: pendidikan berkualitas. AI memberi petunjuk detail langkah demi langkah sehingga berfungsi sebagai pelatihan keterampilan bagi ibu ibu.
5. SDG 3 (pendukung): kesehatan dan kesejahteraan, melalui jalur olahan makanan dari sisa bahan pangan dan berkurangnya pembakaran sampah.

Asta Cita yang disasar:

1. Asta Cita 6: pembangunan dari desa dan pemberdayaan ekonomi (paling kuat).
2. Asta Cita 2: kemandirian dan ekonomi hijau atau sirkular.
3. Asta Cita 4: penguatan sumber daya manusia melalui peningkatan keterampilan.

## Solusi

KriyaPKK adalah aplikasi web yang bekerja seperti sistem kasir (POS) sekaligus ERP mini untuk usaha kerajinan limbah kampung.

Alur kerja:

1. Warga datang ke titik PKK membawa barang sisa.
2. Pengurus memotret barang. AI memeriksa kelayakan barang (bersih, utuh, layak olah) dan menaksir harganya.
3. Warga menerima imbalan sesuai taksiran AI, bisa berupa uang, saldo, atau barang kebutuhan.
4. Jika warga setuju dan transaksi dilanjutkan, barang dan harganya tercatat di database sebagai stok.
5. AI membaca seluruh stok di database, lalu otomatis menghasilkan ide kerajinan atau olahan makanan yang bisa dikerjakan ibu ibu PKK.
6. Untuk setiap ide, AI menampilkan daftar bahan dan alat yang diperlukan, mana yang sudah ada di stok, dan mana yang harus dibeli di warung.
7. AI menghitung total modal, yaitu nilai barang dari transaksi warga ditambah biaya pembelian bahan dan alat tambahan.
8. AI menaksir harga jual serta margin keuntungan.
9. AI memberi petunjuk pengerjaan yang detail, mulai dari persiapan, langkah kerja, waktu, hingga tips agar hasil rapi.

Fitur utama:

1. Scan barang dengan AI Vision untuk kelayakan dan taksiran harga.
2. Pencatatan transaksi warga dan stok bahan.
3. Generator ide kerajinan dan olahan berdasarkan stok yang tersedia.
4. Kalkulator modal dan harga jual otomatis.
5. Panduan pengerjaan detail dari AI.
6. Dashboard dampak dan keuangan: jumlah sampah yang dialihkan, pendapatan warga, dan keuntungan kelompok.

Teknologi: Next.js, Supabase (autentikasi, database, penyimpanan foto), dan AI API dengan keluaran JSON terstruktur.

Model bisnis (untuk divisi Entrepreneur):

1. Langganan bulanan per kelompok PKK, bank sampah, atau desa.
2. Pendanaan melalui Dana Desa, CSR, atau pemerintah daerah.
3. Fitur premium seperti laporan keuangan dan ekspor pembukuan.
4. Komisi marketplace hasil kerajinan pada tahap lanjutan.

## Alasan

1. Menjawab masalah nyata di dua sisi sekaligus, yaitu lingkungan (sampah) dan ekonomi (penghasilan warga).
2. Berbeda dari aplikasi bank sampah biasa. KriyaPKK tidak berhenti di pencatatan setoran, tetapi membantu seluruh rantai: valuasi barang, ide produksi, perhitungan modal, harga jual, dan pelatihan.
3. Ibu PKK adalah kelompok yang sudah ada di hampir setiap kampung, sehingga adopsinya realistis dan bisa direplikasi ke banyak daerah.
4. AI benar benar menyelesaikan hambatan utama pengguna, yaitu tidak tahu harus membuat apa, berapa modalnya, dan berapa harga jualnya.
5. Punya model pendapatan yang jelas karena dijual sebagai sistem, mirip sistem kasir, sehingga layak masuk divisi Entrepreneur dan juga Inovasi.
6. Sesuai ketentuan lomba: menyasar SDG 3, 4, 8, 9, 11 dan Asta Cita 2, 4, 6, serta masuk subdivisi Software.
7. Dapat dibangun sebagai MVP dalam waktu 3 sampai 4 hari dengan stack yang sudah umum, dan mudah didemokan lewat alur foto, taksiran, stok, ide, lalu modal dan harga jual.
8. Dampaknya terukur, misalnya kilogram sampah yang dialihkan, rupiah yang diterima warga, dan jumlah produk yang dihasilkan.
