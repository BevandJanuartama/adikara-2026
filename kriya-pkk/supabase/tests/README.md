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
