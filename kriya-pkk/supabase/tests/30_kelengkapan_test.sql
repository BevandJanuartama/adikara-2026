-- Uji kelengkapan toko (jalankan setelah 00, 0001, 01, 0002, seed_akun_demo, 0003, 0004)
\set ON_ERROR_STOP 0
\pset pager off
select id as admin    from auth.users where email = 'kriya@kriya.com' \gset
select id as pengurus from auth.users where email = 'claudepkk@kriya.com' \gset
select id as perajin  from auth.users where email = 'claude@kriya.com' \gset
select f.id as fg_pouch from public.finished_goods f join public.groups g on g.id = f.group_id where g.slug = 'pkk-sukapura' and f.name = 'Pouch kosmetik kain perca' \gset
select f.id as fg_sabun from public.finished_goods f join public.groups g on g.id = f.group_id where g.slug = 'pkk-sukapura' and f.name like 'Sabun cuci%' \gset
update public.groups set latitude = -6.97, longitude = 107.63, whatsapp = '081277778888' where slug = 'pkk-sukapura';

\echo '== 1. anon: info metode bayar terbaca; fungsi server DITOLAK'
set role anon;
select public.katalog_posko('pkk-sukapura') ->> 'pay_transfer' as pay_transfer,
       public.katalog_posko('pkk-sukapura') ->> 'pay_at_posko' as pay_at_posko;
select public.hit_rate_limit('x', 1, 60);                                       -- DITOLAK
select public.cari_pesanan('KPK', '0812');                                      -- DITOLAK
select public.create_order('pkk-sukapura', '[]', '{}', '{}', null, 'tunai');    -- DITOLAK
reset role;

\echo '== 2. metode bayar: transfer butuh rekening; tunai hanya ambil di posko'
set role service_role;
select public.create_order('pkk-sukapura', jsonb_build_array(jsonb_build_object('id', :'fg_pouch', 'qty', 1)),
  '{"name":"Bu Tari","phone":"081311112222","consent":true}', '{"method":"ambil"}', null, 'transfer');   -- DITOLAK (belum aktif)
reset role;
update public.groups set pay_transfer = true where slug = 'pkk-sukapura';                             -- DITOLAK (rekening kosong)
update public.groups set bank_name = 'BRI', bank_account_no = '0123-4567-890', bank_account_name = 'PKK Sukapura' where slug = 'pkk-sukapura'; -- DITOLAK (format)
update public.groups set bank_name = 'BRI', bank_account_no = '01234567890', bank_account_name = 'PKK Sukapura', pay_transfer = true where slug = 'pkk-sukapura';
set role service_role;
select public.create_order('pkk-sukapura', jsonb_build_array(jsonb_build_object('id', :'fg_pouch', 'qty', 1)),
  '{"name":"Bu Tari","phone":"081311112222","consent":true}', '{"method":"ambil"}', null, 'transfer') as t1 \gset
select :'t1'::jsonb ->> 'code' as kode_tf \gset
select payment_method, round(extract(epoch from pay_deadline - created_at) / 3600) as jam_batas_bayar,
       privacy_consent_at is not null as setuju_privasi
from public.orders where code = :'kode_tf';
select :'t1'::jsonb -> 'posko' ->> 'bank_account_no' as rekening_di_respon;
select public.create_order('pkk-sukapura', jsonb_build_array(jsonb_build_object('id', :'fg_sabun', 'qty', 1)),
  '{"name":"Bu Tari","phone":"081311112222"}',
  '{"method":"kurir","address":"Jl. Dago 1","lat":-6.8915,"lng":107.6107,"cost":15000}', null, 'tunai');     -- DITOLAK (tunai + kurir)
select public.create_order('pkk-sukapura', jsonb_build_array(jsonb_build_object('id', :'fg_sabun', 'qty', 1)),
  '{"name":"Bu Tari","phone":"081311112222"}', '{"method":"ambil"}', null, 'tunai') ->> 'payment_method' as tunai_ok;
select public.create_order('pkk-sukapura', jsonb_build_array(jsonb_build_object('id', :'fg_sabun', 'qty', 1)),
  '{"name":"Bu Tari","phone":"081311112222"}', '{"method":"ambil"}') ->> 'payment_method' as online_ok;
select public.create_order('pkk-sukapura', jsonb_build_array(jsonb_build_object('id', :'fg_sabun', 'qty', 1)),
  '{"name":"Bu Tari","phone":"0813-1111-2222"}', '{"method":"ambil"}');            -- DITOLAK (3 pesanan menunggu)
select privacy_consent_at is null as tanpa_persetujuan_tercatat_null from public.orders where payment_method = 'tunai' limit 1;

\echo '== 3. rate limit: maksimal 2 per jendela'
select public.hit_rate_limit('uji:1.2.3.4', 2, 600) as ke1, public.hit_rate_limit('uji:1.2.3.4', 2, 600) as ke2,
       public.hit_rate_limit('uji:1.2.3.4', 2, 600) as ke3, public.hit_rate_limit('uji:5.6.7.8', 2, 600) as ip_lain;
reset role;

\echo '== 4. pengurus: konfirmasi pembayaran manual'
set role authenticated;
select set_config('request.jwt.claim.sub', :'pengurus', false);
select public.confirm_manual_payment(id) ->> 'status' as status_tf from public.orders where code = :'kode_tf';
select public.confirm_manual_payment(id) from public.orders where code = :'kode_tf';                -- DITOLAK (sudah dibayar)
select public.confirm_manual_payment(id) from public.orders where payment_method = 'online' and status = 'menunggu_bayar' limit 1;  -- DITOLAK
select status, payment_type, paid_confirmed_by = :'pengurus' as dikonfirmasi_pengurus from public.orders where code = :'kode_tf';
select buyer_name as nama_di_sales from public.sales where buyer_name like 'Online%' limit 1;
select amount, note from public.cash_ledger where ref_table = 'orders';
reset role;

\echo '== 5. kurir: link lacak, resi bisa diperbaiki saat dikirim'
set role service_role;
select public.create_order('pkk-sukapura', jsonb_build_array(jsonb_build_object('id', :'fg_pouch', 'qty', 1)),
  '{"name":"Pak Dedi","phone":"082199998888","consent":true}',
  '{"method":"kurir","address":"Jl. Dago 1","lat":-6.8915,"lng":107.6107,"courier_company":"jne","courier_type":"reg","courier_name":"JNE REG","cost":15000}',
  null, 'transfer') ->> 'code' as kode_kurir \gset
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'pengurus', false);
select public.confirm_manual_payment(id) ->> 'status' from public.orders where code = :'kode_kurir';
select public.set_order_status(id, 'dikirim', 'JNE123', 'http://bukan-https.example') from public.orders where code = :'kode_kurir';  -- DITOLAK
select public.set_order_status(id, 'dikirim', 'JNE123', 'https://contoh.kurir/lacak/abc') from public.orders where code = :'kode_kurir';
select public.set_order_status(id, 'dikirim', 'JNE999', null) from public.orders where code = :'kode_kurir';
select tracking_number, tracking_url from public.orders where code = :'kode_kurir';
select public.set_order_status(id, 'selesai') from public.orders where code = :'kode_kurir';
reset role;

\echo '== 6. dana online di platform & pencairan'
set role service_role;
select code as kode_online from public.orders where payment_method = 'online' and status = 'menunggu_bayar' limit 1 \gset
select total as total_online from public.orders where code = :'kode_online' \gset
select public.mark_order_paid(:'kode_online', :'total_online', 'qris', 'trx-9') ->> 'buyer_phone' as hp_untuk_wa;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'pengurus', false);
select public.my_platform_balance() as saldo_posko;
select public.admin_record_payout(group_id, 1000) from public.orders limit 1;                    -- DITOLAK (bukan admin)
select set_config('request.jwt.claim.sub', :'admin', false);
select name, online_total, dicairkan, saldo, produk_tampil, produk_tanpa_foto, menunggu_bayar from public.admin_ringkasan_toko();
select count(*) as pesanan_terlihat_admin from public.orders;
select public.admin_record_payout(g.id, 999999) from public.groups g where slug = 'pkk-sukapura';   -- DITOLAK (melebihi saldo)
select public.admin_record_payout(g.id, :'total_online'::numeric - 4000, 4000, 'TRF-001', 'Pencairan pertama') is not null as cair_ok
from public.groups g where slug = 'pkk-sukapura';
select saldo from public.admin_ringkasan_toko() where slug = 'pkk-sukapura';
select set_config('request.jwt.claim.sub', :'pengurus', false);
select amount, fee, reference from public.platform_payouts;
select set_config('request.jwt.claim.sub', :'perajin', false);
select count(*) as pencairan_terlihat_perajin from public.platform_payouts;
select count(*) as pesanan_terlihat_perajin from public.orders;
select public.my_platform_balance();                                                            -- DITOLAK
reset role;

\echo '== 7. simulasi tidak dihitung sebagai dana'
set role service_role;
select public.create_order('pkk-sukapura', jsonb_build_array(jsonb_build_object('id', :'fg_sabun', 'qty', 1)),
  '{"name":"Uji Simulasi","phone":"085700001111"}', '{"method":"ambil"}') ->> 'code' as kode_sim \gset
select total as total_sim from public.orders where code = :'kode_sim' \gset
select public.mark_order_paid(:'kode_sim', :'total_sim', 'simulasi') ->> 'status';
select public._saldo_platform(id) ->> 'simulasi_total' as simulasi_total, public._saldo_platform(id) ->> 'saldo' as saldo
from public.groups where slug = 'pkk-sukapura';

\echo '== 8. cari pesanan & hapus data pembeli (UU PDP)'
select public.cari_pesanan(lower(:'kode_kurir'), '0821-9999-8888') is not null as ketemu;
select public.cari_pesanan(:'kode_kurir', '081200000000') is null as hp_salah_tidak_ketemu;
select access_token as tok_tf from public.orders where code = :'kode_tf' \gset
select access_token as tok_kurir from public.orders where code = :'kode_kurir' \gset
select public.hapus_data_pembeli(:'kode_tf', :'tok_tf');                     -- DITOLAK (masih berjalan)
select public.hapus_data_pembeli(:'kode_kurir', 'token-salah');              -- DITOLAK
select public.hapus_data_pembeli(:'kode_kurir', :'tok_kurir');
select buyer_name, buyer_phone, address, buyer_lat, data_deleted_at is not null as terhapus from public.orders where code = :'kode_kurir';
select public.cari_pesanan(:'kode_kurir', '082199998888') is null as tidak_bisa_dicari_lagi;

\echo '== 9. pembersihan harian: transfer lewat 24 jam kedaluwarsa, data lama dianonimkan'
update public.orders set pay_deadline = now() - interval '1 minute' where payment_method = 'tunai' and status = 'menunggu_bayar';
update public.orders set closed_at = now() - interval '400 days' where code = :'kode_kurir';
insert into public.rate_limits values ('lama', now() - interval '2 days', 5);
select public.maintenance_harian() as hasil;
select status from public.orders where payment_method = 'tunai';
update public.orders set closed_at = now() - interval '400 days' where payment_method = 'tunai';
select public.maintenance_harian() ->> 'dianonimkan' as dianonimkan_setelah_365_hari;
select buyer_name from public.orders where payment_method = 'tunai';
reset role;

\echo '== 10. tunai: terima uang & serahkan barang langsung (dibayar → selesai)'
set role service_role;
select public.create_order('pkk-sukapura', jsonb_build_array(jsonb_build_object('id', :'fg_sabun', 'qty', 1)),
  '{"name":"Bu Wati","phone":"087788889999","consent":true}', '{"method":"ambil"}', null, 'tunai') ->> 'code' as kode_tunai \gset
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'pengurus', false);
select public.confirm_manual_payment(id) ->> 'status' as status_bayar from public.orders where code = :'kode_tunai';
select public.set_order_status(id, 'selesai') as langsung_selesai from public.orders where code = :'kode_tunai';
select public.set_order_status(id, 'selesai') from public.orders where code = :'kode_kurir';    -- DITOLAK (sudah selesai)
reset role;
