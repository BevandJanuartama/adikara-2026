-- Uji akun pembeli, resi, dan pencairan dana (jalankan setelah 00, 0001, 01, 0002, seed_akun_demo, 0003, 0004)
\set ON_ERROR_STOP 0
\pset pager off
select id as admin    from auth.users where email = 'kriya@kriya.com' \gset
select id as pengurus from auth.users where email = 'claudepkk@kriya.com' \gset
select id as perajin  from auth.users where email = 'claude@kriya.com' \gset
select f.id as fg_pouch from public.finished_goods f join public.groups g on g.id = f.group_id where g.slug = 'pkk-sukapura' and f.name = 'Pouch kosmetik kain perca' \gset
select f.id as fg_sabun from public.finished_goods f join public.groups g on g.id = f.group_id where g.slug = 'pkk-sukapura' and f.name like 'Sabun cuci%' \gset
update public.groups set latitude = -6.97, longitude = 107.63, whatsapp = '081277778888' where slug = 'pkk-sukapura';

\echo '== 1. daftar akun pembeli lewat metadata; metadata peran palsu diabaikan'
insert into auth.users (email, raw_user_meta_data) values
  ('ani@contoh.id',  '{"account_type":"pembeli","full_name":"Ani Wulandari","phone":"0812-3456-7890","consent":true}'),
  ('budi@contoh.id', '{"account_type":"pembeli","full_name":"Budi","phone":"081399990000","consent":true}'),
  ('nakal@contoh.id','{"account_type":"admin","role":"admin","full_name":"Nakal"}');
select u.email, p.role, p.phone, p.group_id is null as tanpa_kelompok, p.privacy_consent_at is not null as setuju_privasi
from auth.users u join public.profiles p on p.id = u.id
where u.email in ('ani@contoh.id', 'budi@contoh.id', 'nakal@contoh.id') order by u.email;
select id as ani  from auth.users where email = 'ani@contoh.id' \gset
select id as budi from auth.users where email = 'budi@contoh.id' \gset

\echo '== 2. pesanan wajib akun pembeli (diisi server dari sesi login)'
set role service_role;
select public.create_order('pkk-sukapura', jsonb_build_array(jsonb_build_object('id', :'fg_pouch', 'qty', 1)),
  '{"name":"Tanpa Akun","phone":"081211112222"}', '{"method":"ambil"}');                                  -- DITOLAK
select public.create_order('pkk-sukapura', jsonb_build_array(jsonb_build_object('id', :'fg_pouch', 'qty', 1)),
  jsonb_build_object('name', 'Pengurus', 'phone', '081211112222', 'user_id', :'pengurus'), '{"method":"ambil"}');  -- DITOLAK (bukan pembeli)
select public.create_order('pkk-sukapura', jsonb_build_array(jsonb_build_object('id', :'fg_pouch', 'qty', 2)),
  jsonb_build_object('name', 'Ani Wulandari', 'phone', '0857 1111 2222', 'email', 'ani@contoh.id', 'user_id', :'ani'),
  '{"method":"kurir","address":"Jl. Dago No. 1, Coblong","city":"Kota Bandung","postal_code":"40135","lat":-6.8915,"lng":107.6107,"courier_company":"jne","courier_type":"reg","courier_name":"JNE REG","eta":"1 - 2 hari","cost":8650}') ->> 'code' as kode_ani \gset
select public.create_order('pkk-sukapura', jsonb_build_array(jsonb_build_object('id', :'fg_sabun', 'qty', 1)),
  jsonb_build_object('name', 'Budi', 'phone', '081399990000', 'user_id', :'budi'), '{"method":"ambil"}') ->> 'code' as kode_budi \gset
select buyer_id = :'ani' as milik_ani, total, shipping_cost, courier_name from public.orders where code = :'kode_ani';
select phone as hp_profil_ani_diperbarui from public.profiles where id = :'ani';
reset role;

\echo '== 3. pembeli hanya melihat pesanannya sendiri'
set role authenticated;
select set_config('request.jwt.claim.sub', :'ani', false);
select code = :'kode_ani' as pesanan_sendiri from public.orders;
select count(*) as item_terlihat from public.order_items;
select name, whatsapp from public.posko_pesanan_saya();
select count(*) as kelompok_terlihat from public.groups;
select count(*) as kas_terlihat from public.cash_ledger;
select public.set_order_status(id, 'batal') from public.orders where code = :'kode_ani';      -- DITOLAK (bukan pengurus)
select public.my_platform_balance();                                                         -- DITOLAK
update public.profiles set role = 'admin' where id = :'ani';                                  -- 0 baris (tidak berubah)
select role from public.profiles where id = :'ani';
select set_config('request.jwt.claim.sub', :'budi', false);
select count(*) as pesanan_ani_terlihat_budi from public.orders where code = :'kode_ani';
reset role;

\echo '== 4. lunas lalu dikirim: resi ekspedisi wajib, bisa diperbaiki'
set role service_role;
select total as total_ani from public.orders where code = :'kode_ani' \gset
select public.mark_order_paid(:'kode_ani', :'total_ani', 'qris', 'trx-1') ->> 'status' as status_lunas;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'pengurus', false);
select public.set_order_status(id, 'dikirim') from public.orders where code = :'kode_ani';                -- DITOLAK (resi kosong)
select public.set_order_status(id, 'dikirim', '123') from public.orders where code = :'kode_ani';         -- DITOLAK (resi terlalu pendek)
select public.set_order_status(id, 'dikirim', 'jne 0123 4567 89') from public.orders where code = :'kode_ani';
select public.set_order_status(id, 'dikirim', 'JNE0123456780') from public.orders where code = :'kode_ani';
select tracking_number as resi_terakhir from public.orders where code = :'kode_ani';
select set_config('request.jwt.claim.sub', :'ani', false);
select status, tracking_number as resi_dilihat_pembeli from public.orders where code = :'kode_ani';
select set_config('request.jwt.claim.sub', :'pengurus', false);
select public.set_order_status(id, 'selesai') from public.orders where code = :'kode_ani';
reset role;

\echo '== 5. dana online di platform & pencairan ke posko'
set role service_role;
select total as total_budi from public.orders where code = :'kode_budi' \gset
select public.mark_order_paid(:'kode_budi', :'total_budi', 'simulasi') ->> 'status' as budi_simulasi;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'pengurus', false);
select public.my_platform_balance() ->> 'saldo' as saldo_posko, public.my_platform_balance() ->> 'simulasi_total' as simulasi_tidak_dihitung;
update public.groups set bank_name = 'BRI', bank_account_no = '0123-456' where slug = 'pkk-sukapura';     -- DITOLAK (format)
update public.groups set bank_name = 'BRI', bank_account_no = '012301000123567', bank_account_name = 'PKK Sukapura' where slug = 'pkk-sukapura';
select public.admin_record_payout(id, 1000) from public.groups where slug = 'pkk-sukapura';              -- DITOLAK (bukan admin)
select set_config('request.jwt.claim.sub', :'admin', false);
select name, bank_account_no, online_total, saldo from public.admin_saldo_posko();
select public.admin_record_payout(id, 999999) from public.groups where slug = 'pkk-sukapura';            -- DITOLAK (melebihi saldo)
select public.admin_record_payout(id, :'total_ani'::numeric - 2000, 2000, 'TRF-001') is not null as cair_ok from public.groups where slug = 'pkk-sukapura';
select saldo as saldo_setelah_cair from public.admin_saldo_posko() where name = 'PKK Sukapura';
select set_config('request.jwt.claim.sub', :'pengurus', false);
select amount, fee, reference from public.platform_payouts;
select set_config('request.jwt.claim.sub', :'perajin', false);
select count(*) as pencairan_terlihat_perajin from public.platform_payouts;
select set_config('request.jwt.claim.sub', :'ani', false);
select count(*) as pencairan_terlihat_pembeli from public.platform_payouts;
reset role;
