\set ON_ERROR_STOP 0
\pset pager off
-- peran auth Supabase (yang meng-insert ke auth.users)
do $$ begin create role supabase_auth_admin nologin; exception when duplicate_object then null; end $$;
grant usage on schema auth to supabase_auth_admin;
grant insert, select on auth.users to supabase_auth_admin;

\echo '=== 1. Daftar akun (trigger) ==='
set role supabase_auth_admin;
insert into auth.users (id, email, raw_user_meta_data) values
 ('aaaaaaaa-0000-0000-0000-000000000001', 'ratna@melati.id', '{"full_name":"Bu Ratna","group_name":"PKK Melati RW04","group_address":"Bandung"}'),
 ('bbbbbbbb-0000-0000-0000-000000000001', 'tuti@mawar.id',  '{"full_name":"Bu Tuti","group_name":"PKK Mawar"}'),
 ('aaaaaaaa-0000-0000-0000-000000000002', 'sari@melati.id', '{"full_name":"Bu Sari","role":"admin","group_id":"x"}'),
 ('cccccccc-0000-0000-0000-000000000001', 'admin@kriyapkk.id', '{"full_name":"Admin"}'),
 ('dddddddd-0000-0000-0000-000000000001', 'demo@kriyapkk.id', '{"full_name":"Bu Demo","group_name":"PKK Demo"}');
reset role;
select p.full_name, p.role, g.name, g.status, (select count(*) from price_table pt where pt.group_id = g.id) as harga
from profiles p left join groups g on g.id = p.group_id order by p.full_name;

-- server (secret key) menghubungkan anggota & admin
set role service_role;
update profiles set group_id = (select group_id from profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'), role = 'anggota'
 where id = 'aaaaaaaa-0000-0000-0000-000000000002';
update profiles set role = 'admin' where id = 'cccccccc-0000-0000-0000-000000000001';
reset role;

\echo '=== 2. Kelompok pending: tidak bisa apa-apa ==='
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);
select name, status from groups;                  -- harus terlihat (pending)
select my_group_id() is null as group_belum_aktif;
insert into residents (name) values ('Coba');      -- HARUS GAGAL (RLS)
select count(*) as harga_terlihat from price_table; -- 0

\echo '=== 3. Admin aktivasi ==='
select set_config('request.jwt.claim.sub', 'cccccccc-0000-0000-0000-000000000001', false);
select admin_set_group_status(id, 'active') from groups where name in ('PKK Melati RW04', 'PKK Mawar');
select name, status, pengurus_email, members from admin_list_groups();
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000001', false);
select admin_set_group_status(id, 'active') from groups;  -- HARUS GAGAL (bukan admin)

\echo '=== 4. Setoran kelompok A ==='
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);
insert into residents (name, phone) values ('Pak Joko', '0812') returning name, balance;
insert into residents (name, balance) values ('Curang', 999999);   -- HARUS GAGAL (kolom balance)
select create_deposit((select id from residents where name='Pak Joko'),
  '[{"item_type":"Plastik PET","condition":"bersih","is_eligible":true,"weight_kg":2,"ai_suggested":true},
    {"item_type":"Kardus","condition":"kotor","is_eligible":true,"weight_kg":3},
    {"item_type":"Barang berbahaya","condition":"rusak","is_eligible":false,"weight_kg":1,"reason":"pecahan kaca"}]'::jsonb) as dep1 \gset
\echo :dep1
select approve_deposit((:'dep1'::jsonb ->> 'deposit_id')::uuid, false);
select approve_deposit((:'dep1'::jsonb ->> 'deposit_id')::uuid, false);   -- HARUS GAGAL (sudah diproses)
select name, balance from residents;
select item_type, qty_kg, avg_value_per_kg from stock order by item_type;
-- setoran ke-2 dibayar tunai, harga PET beda → rata-rata tertimbang
update price_table set price_per_kg = 4000 where item_type = 'Plastik PET';
select create_deposit((select id from residents where name='Pak Joko'),
  '[{"item_type":"Plastik PET","weight_kg":2},{"item_type":"Kain perca","weight_kg":1.5}]') as dep2 \gset
select approve_deposit((:'dep2'::jsonb ->> 'deposit_id')::uuid, true);
select item_type, qty_kg, avg_value_per_kg from stock order by item_type;  -- PET 4kg avg 3500
select create_deposit((select id from residents where name='Pak Joko'), '[{"item_type":"Emas","weight_kg":1}]'); -- HARUS GAGAL (harga)
select withdraw_balance((select id from residents where name='Pak Joko'), 5000);
select withdraw_balance((select id from residents where name='Pak Joko'), 999999);  -- HARUS GAGAL
update residents set balance = 1000000;                         -- HARUS GAGAL (permission)
insert into cash_ledger (group_id, entry_type, category, amount) values (my_group_id(), 'in', 'lainnya', 1); -- HARUS GAGAL
update stock set qty_kg = 999;                                  -- HARUS GAGAL
select entry_type, category, amount, note from cash_ledger order by created_at;

\echo '=== 5. Isolasi kelompok B ==='
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000001', false);
select count(*) as residents_A_terlihat from residents;
select count(*) as deposits_A_terlihat from deposits;
select count(*) as stock_A_terlihat from stock;
select count(*) as ledger_A_terlihat from cash_ledger;
select create_deposit((select id from residents limit 1), '[{"item_type":"Kardus","weight_kg":1}]');  -- GAGAL
select approve_deposit((:'dep1'::jsonb ->> 'deposit_id')::uuid, false);  -- GAGAL (tidak ditemukan)
select name from groups;  -- hanya PKK Mawar

\echo '=== 6. Ide, produksi, penjualan ==='
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);
select create_idea_from_template((select id from idea_templates where title='Pouch kosmetik kain perca')) as idea \gset
select title, material_cost, extra_cost, tool_cost, labor_cost, unit_cost, margin, sell_price from ideas;
select max_units, materials_status from v_idea_capacity;
select start_batch(:'idea'::uuid, 10, array['aaaaaaaa-0000-0000-0000-000000000002'::uuid]);  -- GAGAL STOK_KURANG
select start_batch(:'idea'::uuid, 4, array['aaaaaaaa-0000-0000-0000-000000000002'::uuid]) as batch \gset
select item_type, qty_kg from stock where item_type = 'Kain perca';   -- 0.5
select status, material_value, extra_cost_total, tool_cost_total from production_batches;
-- anggota yang ditugaskan mencatat hasil
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000002', false);
select count(*) as anggota_lihat_warga from residents;  -- 0
select count(*) as anggota_lihat_stok from stock;       -- >0
select finish_batch(:'batch'::uuid, 3, 1);
select record_sale((select id from finished_goods limit 1), 1);  -- GAGAL (khusus pengurus)
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);
select pay_wages(:'batch'::uuid, '[{"member_id":"aaaaaaaa-0000-0000-0000-000000000002","hours":2.5,"amount":30000}]');
select name, qty, unit_cost, sell_price from finished_goods;
select record_sale((select id from finished_goods limit 1), 2, null, 'Bu Lurah');
select record_sale((select id from finished_goods limit 1), 5);  -- GAGAL stok produk
select update_idea_pricing(:'idea'::uuid, null, 0.6, null);
select update_idea_pricing(:'idea'::uuid, null, null, 25000);
select margin, sell_price from ideas;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000002', false);
select amount from wages;   -- anggota lihat upah sendiri
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);

\echo '=== 7. Laporan ==='
select report_profit_loss(today_wib() - 30, today_wib());
select report_impact(3);

\echo '=== 8. Koreksi kas ==='
select id as led from cash_ledger where category = 'penjualan' limit 1 \gset
select reverse_cash_entry(:'led'::uuid, 'salah input');
select reverse_cash_entry(:'led'::uuid, 'lagi');   -- GAGAL
select add_cash_entry('in', 'modal_awal', 200000, 'Kas awal');
select add_cash_entry('in', 'penjualan', 1000, 'curang');  -- GAGAL
select (report_profit_loss(today_wib() - 30, today_wib()) ->> 'saldo_kas') as saldo_kas;

\echo '=== 9. Kuota AI ==='
select set_config('request.jwt.claim.sub', 'cccccccc-0000-0000-0000-000000000001', false);
select admin_set_quota((select id from groups where name='PKK Melati RW04'), 2, 1);
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);
select consume_ai_quota('scan', 'gemini-3.5-flash-lite') as u1 \gset
select finish_ai_usage(:u1, 800, 120, true);
select consume_ai_quota('scan');
select consume_ai_quota('scan');   -- GAGAL KUOTA_HABIS
select ai_quota_status();
insert into ai_cache (hash, fn, result) values ('scan:abc', 'scan', '{"items":[]}');
select hash from ai_cache;
select save_idea_guide(:'idea'::uuid, '{"langkah":["a"]}');
select save_idea_guide(:'idea'::uuid, '{"langkah":["b"]}');   -- false (tidak menimpa)

\echo '=== 10. Storage ==='
select my_group_id() as gid_a \gset
insert into storage.objects (bucket_id, name) values ('photos', :'gid_a' || '/deposits/1.jpg');
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000001', false);
insert into storage.objects (bucket_id, name) values ('photos', :'gid_a' || '/deposits/2.jpg');  -- GAGAL
select count(*) as foto_A_terlihat_oleh_B from storage.objects;

\echo '=== 11. Profil: pengurus tidak bisa ubah dirinya / jadikan admin ==='
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);
update profiles set is_active = false where id = 'aaaaaaaa-0000-0000-0000-000000000001';  -- 0 baris
update profiles set role = 'admin' where id = 'aaaaaaaa-0000-0000-0000-000000000002';      -- GAGAL check
update profiles set full_name = 'Bu Sari W' where id = 'aaaaaaaa-0000-0000-0000-000000000002';
update groups set status = 'active';     -- GAGAL (kolom status)
update groups set default_margin = 0.5;  -- boleh
reset role;

\echo '=== 12. anon ==='
set role anon;
select count(*) from residents;  -- GAGAL permission
select approve_deposit(gen_random_uuid());  -- GAGAL permission
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);
select demo_seed(my_group_id());  -- GAGAL (khusus SQL editor)
reset role;

\echo '=== 13. Demo seed (sebagai postgres / SQL Editor) ==='
select demo_seed((select group_id from profiles where id = 'dddddddd-0000-0000-0000-000000000001'));
set role authenticated;
select set_config('request.jwt.claim.sub', 'dddddddd-0000-0000-0000-000000000001', false);
select report_impact(6);
select report_profit_loss(today_wib() - 120, today_wib());
select item_type, qty_kg, avg_value_per_kg from stock order by item_type;
reset role;
