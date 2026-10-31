# Uji database (Postgres lokal)

File di folder ini TIDAK dijalankan di Supabase. Ini uji otomatis di PostgreSQL lokal yang
meniru lingkungan Supabase (peran anon/authenticated/service_role, auth.uid(), storage.objects).

Yang diuji (lihat `hasil_uji.txt`):
- Trigger pendaftaran: kelompok baru berstatus pending + 7 jenis harga awal; metadata role palsu diabaikan.
- Kelompok pending tidak bisa membaca/menulis data; admin mengaktivasi.
- Setoran: total dari tabel harga, barang tidak layak Rp0, stok rata-rata tertimbang, saldo/kas.
- Isolasi kelompok: kelompok B tidak melihat warga, setoran, stok, kas, dan foto kelompok A.
- Klien tidak bisa mengubah saldo, stok, kas, status kelompok secara langsung.
- Produksi: stok kurang ditolak, stok berkurang, unit gagal tetap jadi biaya, upah, penjualan, laba.
- Koreksi kas lewat entri pembalik (sekali saja), kuota AI harian, cache, panduan tidak ditimpa.
- 23 percobaan akses ilegal semuanya DITOLAK (baris ERROR di hasil_uji.txt memang diharapkan).

Cara menjalankan (perlu PostgreSQL 15+):
```bash
createdb kriyapkk_test
psql -d kriyapkk_test -f supabase/tests/00_supabase_stub.sql
psql -d kriyapkk_test -f supabase/migrations/0001_kriyapkk_schema.sql
psql -d kriyapkk_test -f supabase/tests/10_rls_dan_transaksi_test.sql
```

## Uji marketplace (0002)

Yang diuji (lihat `hasil_uji_marketplace.txt`, 9 baris ERROR memang diharapkan):
- Tanpa login: katalog, filter kategori, pencarian, detail, info posko bisa dibaca; `create_order` dan tabel `orders` DITOLAK.
- Server (secret key): pesanan ambil di posko, total dihitung dari harga database, stok langsung disisihkan.
- Kurir: alamat 315 km DITOLAK (maks. 150 km), stok kurang DITOLAK, ongkir tercatat.
- Webhook lunas: nominal salah DITOLAK, notifikasi ganda tidak dicatat dua kali, masuk `sales` + buku kas.
- Kedaluwarsa: stok kembali, dan pesanan yang sudah dibayar tidak bisa ditutup.
- Pengurus: alur status (diproses → siap diambil → selesai), tambah produk, foto harus di folder kelompoknya, kolom `status` kelompok tetap terkunci.
- Perajin (anggota) tidak melihat data pembeli.
- Produk hasil produksi otomatis membawa daftar bahan limbah dari idenya.

```bash
psql -d kriyapkk_test -f supabase/tests/01_stub_auth_tambahan.sql
psql -d kriyapkk_test -f supabase/migrations/0002_marketplace.sql
psql -d kriyapkk_test -f supabase/seed_akun_demo.sql
psql -d kriyapkk_test -f supabase/tests/20_marketplace_test.sql
```

## Uji akun pembeli (0004)

Yang diuji (lihat `hasil_uji_akun_pembeli.txt`, 9 baris ERROR memang diharapkan):
- Daftar akun pembeli lewat metadata `account_type=pembeli`: peran pembeli, tanpa kelompok, HP dinormalkan, persetujuan privasi tercatat. Metadata peran palsu (`admin`) tetap jadi anggota biasa.
- `create_order` DITOLAK tanpa akun pembeli atau dengan akun pengurus; pesanan pembeli tersimpan dengan `buyer_id` dan ongkir ekspedisi.
- Pembeli hanya melihat pesanannya sendiri (pembeli lain tidak), tidak bisa membaca tabel kelompok/kas, tidak bisa mengubah status, tidak bisa mengubah perannya.
- Status "dikirim" DITOLAK tanpa nomor resi atau resi terlalu pendek; resi dirapikan (huruf besar, tanpa spasi) dan bisa diperbaiki; pembeli melihat resi.
- Dana online: saldo posko = pesanan lunas − dicairkan − biaya; simulasi tidak dihitung; pencairan melebihi saldo DITOLAK; hanya admin yang mencatat; pengurus melihat riwayatnya, perajin dan pembeli tidak.
- Bila `0004_kelengkapan_toko.sql` (pembaruan yang dibatalkan) sempat dijalankan, 0004 ini membersihkannya: hasil uji tetap sama.

```bash
psql -d kriyapkk_test -f supabase/migrations/0003_ongkir_manual.sql
psql -d kriyapkk_test -f supabase/migrations/0004_akun_pembeli.sql
psql -d kriyapkk_test -f supabase/tests/30_akun_pembeli_test.sql
```
