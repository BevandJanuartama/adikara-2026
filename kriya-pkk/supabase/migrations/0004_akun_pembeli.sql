-- =====================================================================
--  KriyaPKK — Akun pembeli, resi ekspedisi, dan catatan dana ke posko
--  Jalankan SETELAH 0003_ongkir_manual.sql. Aman dijalankan ulang.
--
--   0. Bersihkan sisa "0004_kelengkapan_toko.sql" (bila sempat dijalankan)
--   1. Peran baru "pembeli" + daftar akun pembeli
--   2. Pesanan terhubung ke akun pembeli (pembeli hanya melihat pesanannya sendiri)
--   3. Status "dikirim" wajib nomor resi ekspedisi (resi bisa diperbaiki)
--   4. Dana pembayaran online di rekening platform & pencairan ke posko
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. BERSIHKAN SISA PEMBARUAN YANG DIBATALKAN (aman bila tidak pernah ada)
-- ---------------------------------------------------------------------
drop function if exists public.create_order(text, jsonb, jsonb, jsonb, text, text);
drop function if exists public.set_order_status(uuid, text, text, text);
drop function if exists public.confirm_manual_payment(uuid);
drop function if exists public.admin_ringkasan_toko();
drop function if exists public.hit_rate_limit(text, int, int);
drop function if exists public.cari_pesanan(text, text);
drop function if exists public.hapus_data_pembeli(text, text);
drop function if exists public.maintenance_harian(int);
drop function if exists public._anonymize_order(uuid);
drop table if exists public.rate_limits;
drop policy if exists orders_select_admin on public.orders;
drop policy if exists order_items_select_admin on public.order_items;
alter table public.orders
  drop column if exists payment_method,
  drop column if exists pay_deadline,
  drop column if exists tracking_url,
  drop column if exists privacy_consent_at,
  drop column if exists paid_confirmed_by,
  drop column if exists data_deleted_at;
alter table public.groups drop constraint if exists groups_transfer_bank_check;
alter table public.groups
  drop column if exists pay_transfer,
  drop column if exists pay_at_posko;

-- fungsi yang sempat diubah pembaruan itu: kembalikan ke versi 0002
create or replace function public._expire_stale_orders(p_minutes int, p_group uuid default null)
returns int language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  for r in select id from public.orders
           where status = 'menunggu_bayar'
             and created_at < now() - make_interval(mins => p_minutes)
             and (p_group is null or group_id = p_group)
           for update skip locked
  loop
    perform public._return_order_stock(r.id);
    update public.orders set status = 'kedaluwarsa', closed_at = now(), updated_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.katalog_posko(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('name', g.name, 'slug', g.slug, 'address', g.address, 'city', g.city,
                            'postal_code', g.postal_code, 'latitude', g.latitude, 'longitude', g.longitude,
                            'bisa_kirim', g.latitude is not null and g.longitude is not null)
  from public.groups g
  where g.slug = p_slug and g.status = 'active' and g.shop_open
$$;

create or replace function public.mark_order_paid(
  p_code text, p_gross numeric, p_payment_type text default null, p_transaction_id text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v public.orders%rowtype;
  it record;
  v_g public.groups%rowtype;
begin
  select * into v from public.orders where code = p_code for update;
  if not found then raise exception 'PESANAN_TIDAK_DITEMUKAN'; end if;
  select * into v_g from public.groups where id = v.group_id;
  if v.paid_at is not null then
    return jsonb_build_object('already', true, 'code', v.code, 'status', v.status);
  end if;
  if round(coalesce(p_gross, -1), 0) <> round(v.total, 0) then
    raise exception 'NOMINAL_TIDAK_SESUAI: dibayar %, tagihan %', p_gross, v.total;
  end if;
  if v.stock_returned then
    update public.finished_goods f set qty = greatest(f.qty - i.qty, 0)
    from (select finished_good_id, sum(qty)::int qty from public.order_items where order_id = v.id group by 1) i
    where f.id = i.finished_good_id;
  end if;
  for it in select * from public.order_items where order_id = v.id loop
    insert into public.sales (group_id, finished_good_id, qty, unit_price, unit_cost, total, buyer_name, sold_at)
    values (v.group_id, it.finished_good_id, it.qty, it.unit_price, it.unit_cost, it.subtotal,
            v.buyer_name || ' (online)', public.today_wib());
  end loop;
  if v.subtotal > 0 then
    insert into public.cash_ledger (group_id, entry_type, category, amount, ref_table, ref_id, note)
    values (v.group_id, 'in', 'penjualan', v.subtotal, 'orders', v.id, 'Pesanan online ' || v.code);
  end if;
  update public.orders
  set status = 'dibayar', paid_at = now(), stock_returned = false, closed_at = null,
      payment_type = coalesce(p_payment_type, payment_type),
      midtrans_transaction_id = coalesce(p_transaction_id, midtrans_transaction_id),
      midtrans_status = 'settlement', updated_at = now()
  where id = v.id;
  return jsonb_build_object('already', false, 'code', v.code, 'status', 'dibayar', 'total', v.total,
                            'buyer_name', v.buyer_name, 'shipping_method', v.shipping_method,
                            'posko', jsonb_build_object('name', v_g.name, 'whatsapp', v_g.whatsapp));
end $$;


-- ---------------------------------------------------------------------
-- 1. PERAN PEMBELI
-- ---------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'pengurus', 'anggota', 'pembeli'));
alter table public.profiles
  add column if not exists phone text,
  add column if not exists privacy_consent_at timestamptz;

-- Pendaftaran:
--   metadata group_name ada       → kelompok baru + pengurus (seperti sebelumnya)
--   metadata account_type=pembeli → akun pembeli (tanpa kelompok)
--   selain itu                    → anggota tanpa kelompok (ditambahkan pengurus)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_group_name text := nullif(trim(m ->> 'group_name'), '');
  v_gid uuid;
  v_lat double precision;
  v_lng double precision;
begin
  if v_group_name is not null then
    begin
      v_lat := nullif(m ->> 'latitude', '')::double precision;
      v_lng := nullif(m ->> 'longitude', '')::double precision;
    exception when others then v_lat := null; v_lng := null;
    end;
    if v_lat is not null and (v_lat not between -90 and 90 or v_lng is null or v_lng not between -180 and 180) then
      v_lat := null; v_lng := null;
    end if;
    insert into public.groups (name, address, whatsapp, city, postal_code, latitude, longitude)
    values (
      v_group_name,
      nullif(trim(m ->> 'group_address'), ''),
      public._normalize_wa(m ->> 'whatsapp'),
      nullif(trim(m ->> 'city'), ''),
      case when (m ->> 'postal_code') ~ '^[0-9]{5}$' then m ->> 'postal_code' end,
      v_lat, v_lng)
    returning id into v_gid;
    insert into public.profiles (id, group_id, full_name, role, privacy_consent_at)
    values (new.id, v_gid, coalesce(m ->> 'full_name', ''), 'pengurus',
            case when m ->> 'consent' = 'true' then now() end);
  elsif m ->> 'account_type' = 'pembeli' then
    insert into public.profiles (id, full_name, role, phone, privacy_consent_at)
    values (new.id, coalesce(m ->> 'full_name', ''), 'pembeli', public._normalize_wa(m ->> 'phone'),
            case when m ->> 'consent' = 'true' then now() end);
  else
    insert into public.profiles (id, full_name, role)
    values (new.id, coalesce(m ->> 'full_name', ''), 'anggota');
  end if;
  return new;
end $$;


-- ---------------------------------------------------------------------
-- 2. PESANAN MILIK AKUN PEMBELI
-- ---------------------------------------------------------------------
alter table public.orders add column if not exists buyer_id uuid references auth.users (id) on delete set null;
create index if not exists orders_buyer_idx on public.orders (buyer_id, created_at desc);

drop policy if exists orders_select_buyer on public.orders;
drop policy if exists order_items_select_buyer on public.order_items;
create policy orders_select_buyer on public.orders for select to authenticated
  using (buyer_id = (select auth.uid()));
create policy order_items_select_buyer on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = (select auth.uid())));

-- Info posko untuk halaman pesanan pembeli (hanya posko dari pesanannya sendiri)
create or replace function public.posko_pesanan_saya()
returns table (group_id uuid, name text, slug text, address text, city text,
               latitude double precision, longitude double precision, whatsapp text)
language sql stable security definer set search_path = '' as $$
  select distinct g.id, g.name, g.slug, g.address, g.city, g.latitude, g.longitude, g.whatsapp
  from public.groups g
  join public.orders o on o.group_id = g.id
  where o.buyer_id = (select auth.uid())
$$;

-- create_order: sama seperti 0002 + menyimpan akun pembeli (p_buyer.user_id, diisi server dari sesi login)
create or replace function public.create_order(
  p_group_slug text, p_items jsonb, p_buyer jsonb, p_shipping jsonb, p_note text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_group   public.groups%rowtype;
  v_order   uuid;
  v_code    text;
  v_method  text := coalesce(p_shipping ->> 'method', 'ambil');
  v_phone   text := public._normalize_wa(p_buyer ->> 'phone');
  v_buyer   uuid := nullif(p_buyer ->> 'user_id', '')::uuid;
  v_sub     numeric := 0;
  v_ship    numeric := 0;
  v_dist    double precision;
  v_weight  int := 0;
  r         record;
  v_fg      public.finished_goods%rowtype;
begin
  select * into v_group from public.groups where slug = p_group_slug and status = 'active' and shop_open for update;
  if not found then raise exception 'POSKO_TIDAK_DITEMUKAN'; end if;
  perform public._expire_stale_orders(90, v_group.id);

  if v_buyer is null or not exists (select 1 from public.profiles where id = v_buyer and role = 'pembeli' and is_active) then
    raise exception 'AKUN_PEMBELI_WAJIB';
  end if;
  if v_phone is null then raise exception 'HP_TIDAK_VALID'; end if;
  if length(trim(coalesce(p_buyer ->> 'name', ''))) < 2 then raise exception 'NAMA_PEMBELI_WAJIB'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'KERANJANG_KOSONG'; end if;

  if v_method = 'kurir' then
    if v_group.latitude is null then raise exception 'POSKO_BELUM_BISA_KIRIM'; end if;
    if nullif(trim(p_shipping ->> 'address'), '') is null then raise exception 'ALAMAT_WAJIB'; end if;
    v_dist := public.distance_km(v_group.latitude, v_group.longitude,
                                 (p_shipping ->> 'lat')::double precision, (p_shipping ->> 'lng')::double precision);
    if v_dist is null then raise exception 'LOKASI_WAJIB'; end if;
    if v_dist > 150 then raise exception 'DI_LUAR_JANGKAUAN: jarak % km, maksimal 150 km', round(v_dist::numeric, 1); end if;
    v_ship := coalesce((p_shipping ->> 'cost')::numeric, -1);
    if v_ship < 0 then raise exception 'ONGKIR_TIDAK_VALID'; end if;
  elsif v_method <> 'ambil' then
    raise exception 'METODE_KIRIM_TIDAK_VALID';
  end if;

  v_code := 'KPK-' || to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD') || '-' ||
            upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.orders (code, group_id, buyer_id, buyer_name, buyer_phone, buyer_email, shipping_method,
                             address, buyer_city, buyer_postal_code, buyer_lat, buyer_lng, distance_km,
                             courier_company, courier_type, courier_name, shipping_eta, shipping_cost,
                             subtotal, total, note)
  values (v_code, v_group.id, v_buyer, trim(p_buyer ->> 'name'), v_phone, nullif(trim(p_buyer ->> 'email'), ''), v_method,
          case when v_method = 'kurir' then trim(p_shipping ->> 'address') end,
          case when v_method = 'kurir' then nullif(trim(p_shipping ->> 'city'), '') end,
          case when v_method = 'kurir' then nullif(trim(p_shipping ->> 'postal_code'), '') end,
          case when v_method = 'kurir' then (p_shipping ->> 'lat')::double precision end,
          case when v_method = 'kurir' then (p_shipping ->> 'lng')::double precision end,
          round(v_dist::numeric, 2),
          case when v_method = 'kurir' then p_shipping ->> 'courier_company' end,
          case when v_method = 'kurir' then p_shipping ->> 'courier_type' end,
          case when v_method = 'kurir' then p_shipping ->> 'courier_name' end,
          case when v_method = 'kurir' then p_shipping ->> 'eta' end,
          v_ship, 0, 0, nullif(trim(p_note), ''))
  returning id into v_order;

  for r in
    select (e ->> 'id')::uuid as fg_id, sum((e ->> 'qty')::int)::int as qty
    from jsonb_array_elements(p_items) e
    group by 1 order by 1
  loop
    if r.qty is null or r.qty <= 0 then raise exception 'JUMLAH_TIDAK_VALID'; end if;
    select * into v_fg from public.finished_goods
    where id = r.fg_id and group_id = v_group.id and is_listed for update;
    if not found then raise exception 'PRODUK_TIDAK_DITEMUKAN'; end if;
    if v_fg.qty < r.qty then raise exception 'STOK_PRODUK_KURANG: % tersisa % unit', v_fg.name, v_fg.qty; end if;
    update public.finished_goods set qty = qty - r.qty where id = v_fg.id;
    insert into public.order_items (order_id, group_id, finished_good_id, name, qty, unit_price, unit_cost, weight_grams, subtotal)
    values (v_order, v_group.id, v_fg.id, v_fg.name, r.qty, v_fg.sell_price, v_fg.unit_cost, v_fg.weight_grams,
            round(v_fg.sell_price * r.qty, 0));
    v_sub := v_sub + round(v_fg.sell_price * r.qty, 0);
    v_weight := v_weight + v_fg.weight_grams * r.qty;
  end loop;

  update public.orders set subtotal = v_sub, total = v_sub + v_ship where id = v_order;

  -- nomor HP terakhir disimpan di profil pembeli (untuk checkout berikutnya)
  update public.profiles set phone = v_phone where id = v_buyer and phone is distinct from v_phone;

  return (
    select jsonb_build_object(
      'id', o.id, 'code', o.code, 'subtotal', o.subtotal,
      'shipping_cost', o.shipping_cost, 'total', o.total, 'weight_grams', v_weight,
      'posko', jsonb_build_object('name', v_group.name, 'whatsapp', v_group.whatsapp),
      'items', (select jsonb_agg(jsonb_build_object('id', i.finished_good_id, 'name', i.name, 'qty', i.qty,
                                                    'price', i.unit_price, 'subtotal', i.subtotal))
                from public.order_items i where i.order_id = o.id))
    from public.orders o where o.id = v_order);
end $$;


-- ---------------------------------------------------------------------
-- 3. STATUS PESANAN: "dikirim" wajib nomor resi ekspedisi
-- ---------------------------------------------------------------------
--   dibayar → diproses → dikirim (ekspedisi, isi resi) / siap_diambil (ambil di posko) → selesai
--   dikirim → dikirim  : memperbaiki nomor resi yang salah ketik
--   menunggu_bayar → batal (stok kembali)
create or replace function public.set_order_status(p_order_id uuid, p_status text, p_tracking text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_gid uuid := public._require_pengurus();
  v public.orders%rowtype;
  v_resi text := nullif(upper(regexp_replace(coalesce(p_tracking, ''), '\s', '', 'g')), '');
  ok boolean;
begin
  select * into v from public.orders where id = p_order_id and group_id = v_gid for update;
  if not found then raise exception 'PESANAN_TIDAK_DITEMUKAN'; end if;
  ok := case
    when v.status = 'menunggu_bayar' then p_status = 'batal'
    when v.status = 'dibayar'  then p_status in ('diproses', 'dikirim', 'siap_diambil')
    when v.status = 'diproses' then p_status in ('dikirim', 'siap_diambil')
    when v.status = 'dikirim'  then p_status in ('dikirim', 'selesai')
    when v.status = 'siap_diambil' then p_status = 'selesai'
    else false end;
  if not ok then raise exception 'STATUS_TIDAK_BISA_DIUBAH: % → %', v.status, p_status; end if;
  if p_status = 'dikirim' and v.shipping_method <> 'kurir' then raise exception 'PESANAN_AMBIL_DI_POSKO'; end if;
  if p_status = 'siap_diambil' and v.shipping_method <> 'ambil' then raise exception 'PESANAN_DIKIRIM_KURIR'; end if;
  if p_status = 'dikirim' and coalesce(v_resi, v.tracking_number) is null then raise exception 'RESI_WAJIB'; end if;
  if v_resi is not null and length(v_resi) not between 6 and 40 then raise exception 'RESI_TIDAK_VALID'; end if;

  if p_status = 'batal' then
    perform public.close_order(v.code, 'batal');
  else
    update public.orders
    set status = p_status,
        tracking_number = coalesce(v_resi, tracking_number),
        closed_at = case when p_status = 'selesai' then now() else closed_at end,
        updated_at = now()
    where id = v.id;
  end if;
  return p_status;
end $$;


-- ---------------------------------------------------------------------
-- 4. DANA ONLINE DI PLATFORM & PENCAIRAN KE POSKO
--    Pembayaran Midtrans masuk ke rekening pemilik akun Midtrans (pengelola KriyaPKK).
--    Saldo posko = pesanan lunas (produk + ongkir, karena posko yang membayar ekspedisi)
--                  − sudah dicairkan − potongan biaya. Pembayaran "simulasi" tidak dihitung.
-- ---------------------------------------------------------------------
alter table public.groups
  add column if not exists bank_name         text,
  add column if not exists bank_account_no   text,
  add column if not exists bank_account_name text;
do $$ begin
  alter table public.groups add constraint groups_bank_no_check check (bank_account_no ~ '^[0-9]{5,20}$');
exception when duplicate_object then null; end $$;
grant update (bank_name, bank_account_no, bank_account_name) on public.groups to authenticated;

create table if not exists public.platform_payouts (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  amount     numeric(14,2) not null check (amount > 0),
  fee        numeric(14,2) not null default 0 check (fee >= 0),
  reference  text,
  note       text,
  paid_on    date not null default public.today_wib(),
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists platform_payouts_group_idx on public.platform_payouts (group_id, paid_on desc);
alter table public.platform_payouts enable row level security;
drop policy if exists payouts_select on public.platform_payouts;
create policy payouts_select on public.platform_payouts for select to authenticated
  using ((group_id = (select public.my_group_id()) and (select public.is_pengurus())) or (select public.is_admin()));
revoke all on public.platform_payouts from anon, authenticated;
grant select on public.platform_payouts to authenticated;
grant select, insert, update, delete on public.platform_payouts to service_role;

create or replace function public._saldo_platform(p_group uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_online numeric; v_sim numeric; v_cair numeric; v_fee numeric; v_last date;
begin
  select coalesce(sum(total) filter (where coalesce(payment_type, '') <> 'simulasi'), 0),
         coalesce(sum(total) filter (where payment_type = 'simulasi'), 0)
    into v_online, v_sim
  from public.orders where group_id = p_group and paid_at is not null;
  select coalesce(sum(amount), 0), coalesce(sum(fee), 0), max(paid_on)
    into v_cair, v_fee, v_last
  from public.platform_payouts where group_id = p_group;
  return jsonb_build_object('online_total', v_online, 'simulasi_total', v_sim, 'dicairkan', v_cair,
                            'biaya', v_fee, 'saldo', v_online - v_cair - v_fee, 'cair_terakhir', v_last);
end $$;

create or replace function public.my_platform_balance()
returns jsonb language sql stable security definer set search_path = '' as $$
  select public._saldo_platform(public._require_pengurus())
$$;

-- Admin: saldo semua posko + rekening tujuan pencairan
create or replace function public.admin_saldo_posko()
returns table (group_id uuid, name text, status text, whatsapp text,
               bank_name text, bank_account_no text, bank_account_name text,
               online_total numeric, simulasi_total numeric, dicairkan numeric, biaya numeric,
               saldo numeric, cair_terakhir date)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._require_admin();
  return query
  select g.id, g.name, g.status, g.whatsapp, g.bank_name, g.bank_account_no, g.bank_account_name,
         (x.s ->> 'online_total')::numeric, (x.s ->> 'simulasi_total')::numeric, (x.s ->> 'dicairkan')::numeric,
         (x.s ->> 'biaya')::numeric, (x.s ->> 'saldo')::numeric, (x.s ->> 'cair_terakhir')::date
  from public.groups g
  cross join lateral (select public._saldo_platform(g.id) as s) x
  where g.status <> 'pending'
  order by (x.s ->> 'saldo')::numeric desc, g.name;
end $$;

create or replace function public.admin_record_payout(
  p_group_id uuid, p_amount numeric, p_fee numeric default 0, p_reference text default null,
  p_note text default null, p_paid_on date default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_saldo numeric;
begin
  perform public._require_admin();
  if not exists (select 1 from public.groups where id = p_group_id) then raise exception 'POSKO_TIDAK_DITEMUKAN'; end if;
  if coalesce(p_amount, 0) <= 0 or coalesce(p_fee, 0) < 0 then raise exception 'ANGKA_TIDAK_VALID'; end if;
  perform 1 from public.groups where id = p_group_id for update;  -- cegah pencairan ganda bersamaan
  v_saldo := (public._saldo_platform(p_group_id) ->> 'saldo')::numeric;
  if p_amount + coalesce(p_fee, 0) > v_saldo + 0.5 then
    raise exception 'MELEBIHI_SALDO: saldo posko %', v_saldo;
  end if;
  insert into public.platform_payouts (group_id, amount, fee, reference, note, paid_on, created_by)
  values (p_group_id, round(p_amount, 0), round(coalesce(p_fee, 0), 0), nullif(trim(p_reference), ''),
          nullif(trim(p_note), ''), coalesce(p_paid_on, public.today_wib()), auth.uid())
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.admin_delete_payout(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_admin();
  delete from public.platform_payouts where id = p_id;
  if not found then raise exception 'DATA_TIDAK_DITEMUKAN'; end if;
end $$;


-- ---------------------------------------------------------------------
-- 5. HAK AKSES
-- ---------------------------------------------------------------------
revoke execute on function
  public._expire_stale_orders(int, uuid), public.katalog_posko(text),
  public.mark_order_paid(text, numeric, text, text),
  public.posko_pesanan_saya(), public.create_order(text, jsonb, jsonb, jsonb, text),
  public.set_order_status(uuid, text, text), public._saldo_platform(uuid), public.my_platform_balance(),
  public.admin_saldo_posko(), public.admin_record_payout(uuid, numeric, numeric, text, text, date),
  public.admin_delete_payout(uuid)
from public, anon, authenticated;

grant execute on function public.katalog_posko(text) to anon, authenticated, service_role;
grant execute on function
  public.create_order(text, jsonb, jsonb, jsonb, text), public.mark_order_paid(text, numeric, text, text)
to service_role;
grant execute on function
  public.posko_pesanan_saya(), public.set_order_status(uuid, text, text), public.my_platform_balance(),
  public.admin_saldo_posko(), public.admin_record_payout(uuid, numeric, numeric, text, text, date),
  public.admin_delete_payout(uuid)
to authenticated;
