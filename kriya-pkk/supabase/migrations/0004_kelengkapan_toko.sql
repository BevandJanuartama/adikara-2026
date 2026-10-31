-- =====================================================================
--  KriyaPKK — Kelengkapan toko online
--  Jalankan SETELAH 0003_ongkir_manual.sql. Aman dijalankan ulang.
--
--   1. Metode bayar per posko: online (Midtrans), transfer ke rekening posko,
--      tunai saat ambil di posko. Batas waktu bayar per pesanan.
--   2. Pesanan: metode bayar, batas bayar, link lacak kurir, persetujuan privasi
--   3. Pembuatan pesanan v2 (+ batas 3 pesanan menunggu bayar per nomor HP)
--   4. Lunas & konfirmasi pembayaran manual oleh pengurus
--   5. Status pesanan v2 (link lacak kurir, ubah resi saat dikirim)
--   6. Dana online di rekening platform & pencairan ke posko
--   7. Admin melihat pesanan & ringkasan toko semua posko
--   8. Pembatasan permintaan (rate limit) untuk API publik
--   9. Cari pesanan (kode + HP), hapus data pembeli, pembersihan harian (UU PDP)
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. POSKO: METODE BAYAR & REKENING
-- ---------------------------------------------------------------------
alter table public.groups
  add column if not exists pay_transfer      boolean not null default false,
  add column if not exists pay_at_posko      boolean not null default true,
  add column if not exists bank_name         text,
  add column if not exists bank_account_no   text,
  add column if not exists bank_account_name text;

do $$ begin
  alter table public.groups add constraint groups_bank_no_check check (bank_account_no ~ '^[0-9]{5,20}$');
exception when duplicate_object then null; end $$;
-- transfer hanya bisa diaktifkan bila rekening lengkap
do $$ begin
  alter table public.groups add constraint groups_transfer_bank_check check (
    not pay_transfer or (bank_name is not null and bank_account_no is not null and bank_account_name is not null));
exception when duplicate_object then null; end $$;

grant update (pay_transfer, pay_at_posko, bank_name, bank_account_no, bank_account_name)
  on public.groups to authenticated;


-- ---------------------------------------------------------------------
-- 2. PESANAN: KOLOM BARU
-- ---------------------------------------------------------------------
alter table public.orders
  add column if not exists payment_method     text not null default 'online',
  add column if not exists pay_deadline       timestamptz,
  add column if not exists tracking_url       text,
  add column if not exists privacy_consent_at timestamptz,
  add column if not exists paid_confirmed_by  uuid,
  add column if not exists data_deleted_at    timestamptz;

do $$ begin
  alter table public.orders add constraint orders_payment_method_check
    check (payment_method in ('online', 'transfer', 'tunai'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.orders add constraint orders_tracking_url_check check (tracking_url ~ '^https://');
exception when duplicate_object then null; end $$;

update public.orders set pay_deadline = created_at + interval '90 minutes' where pay_deadline is null;

create index if not exists orders_phone_pending_idx on public.orders (buyer_phone) where status = 'menunggu_bayar';
create index if not exists orders_paid_online_idx on public.orders (group_id) where paid_at is not null and payment_method = 'online';

-- Admin platform boleh melihat pesanan semua posko (pemantauan & pencairan dana)
drop policy if exists orders_select_admin on public.orders;
drop policy if exists order_items_select_admin on public.order_items;
create policy orders_select_admin on public.orders for select to authenticated
  using ((select public.is_admin()));
create policy order_items_select_admin on public.order_items for select to authenticated
  using ((select public.is_admin()));

-- Kedaluwarsa memakai batas bayar tiap pesanan (online 90 menit, transfer 24 jam, tunai 48 jam)
create or replace function public._expire_stale_orders(p_minutes int, p_group uuid default null)
returns int language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  for r in select id from public.orders
           where status = 'menunggu_bayar'
             and coalesce(pay_deadline, created_at + make_interval(mins => p_minutes)) < now()
             and (p_group is null or group_id = p_group)
           for update skip locked
  loop
    perform public._return_order_stock(r.id);
    update public.orders set status = 'kedaluwarsa', closed_at = now(), updated_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Info posko untuk checkout: kini juga metode bayar yang tersedia
create or replace function public.katalog_posko(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('name', g.name, 'slug', g.slug, 'address', g.address, 'city', g.city,
                            'postal_code', g.postal_code, 'latitude', g.latitude, 'longitude', g.longitude,
                            'bisa_kirim', g.latitude is not null and g.longitude is not null,
                            'pay_transfer', g.pay_transfer, 'pay_at_posko', g.pay_at_posko)
  from public.groups g
  where g.slug = p_slug and g.status = 'active' and g.shop_open
$$;


-- ---------------------------------------------------------------------
-- 3. BUAT PESANAN v2 (+ metode bayar, batas bayar, persetujuan privasi, anti-spam)
-- ---------------------------------------------------------------------
drop function if exists public.create_order(text, jsonb, jsonb, jsonb, text);
create or replace function public.create_order(
  p_group_slug text, p_items jsonb, p_buyer jsonb, p_shipping jsonb, p_note text default null,
  p_payment text default 'online'
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_group   public.groups%rowtype;
  v_order   uuid;
  v_code    text;
  v_method  text := coalesce(p_shipping ->> 'method', 'ambil');
  v_pay     text := coalesce(nullif(trim(p_payment), ''), 'online');
  v_phone   text := public._normalize_wa(p_buyer ->> 'phone');
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

  if v_phone is null then raise exception 'HP_TIDAK_VALID'; end if;
  if length(trim(coalesce(p_buyer ->> 'name', ''))) < 2 then raise exception 'NAMA_PEMBELI_WAJIB'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'KERANJANG_KOSONG'; end if;

  -- anti-spam: stok tidak boleh "disandera" banyak pesanan yang tidak dibayar
  if (select count(*) from public.orders
      where buyer_phone = v_phone and status = 'menunggu_bayar'
        and coalesce(pay_deadline, created_at + interval '90 minutes') > now()) >= 3 then
    raise exception 'TERLALU_BANYAK_PESANAN_MENUNGGU';
  end if;

  if v_pay not in ('online', 'transfer', 'tunai') then raise exception 'METODE_BAYAR_TIDAK_VALID'; end if;
  if v_pay = 'transfer' and not v_group.pay_transfer then raise exception 'METODE_BAYAR_TIDAK_TERSEDIA'; end if;
  if v_pay = 'tunai' and not v_group.pay_at_posko then raise exception 'METODE_BAYAR_TIDAK_TERSEDIA'; end if;
  if v_pay = 'tunai' and v_method <> 'ambil' then raise exception 'TUNAI_HANYA_AMBIL_DI_POSKO'; end if;

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
  insert into public.orders (code, group_id, buyer_name, buyer_phone, buyer_email, shipping_method,
                             address, buyer_city, buyer_postal_code, buyer_lat, buyer_lng, distance_km,
                             courier_company, courier_type, courier_name, shipping_eta, shipping_cost,
                             subtotal, total, note, payment_method, pay_deadline, privacy_consent_at)
  values (v_code, v_group.id, trim(p_buyer ->> 'name'), v_phone, nullif(trim(p_buyer ->> 'email'), ''), v_method,
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
          v_ship, 0, 0, nullif(trim(p_note), ''), v_pay,
          now() + case v_pay when 'online' then interval '90 minutes'
                             when 'transfer' then interval '24 hours'
                             else interval '48 hours' end,
          case when coalesce((p_buyer ->> 'consent')::boolean, false) then now() end)
  returning id into v_order;

  -- kunci baris produk berurutan (hindari deadlock), cek stok, potong stok (dipesan)
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

  return (
    select jsonb_build_object(
      'id', o.id, 'code', o.code, 'access_token', o.access_token, 'subtotal', o.subtotal,
      'shipping_cost', o.shipping_cost, 'total', o.total, 'weight_grams', v_weight,
      'payment_method', o.payment_method, 'pay_deadline', o.pay_deadline,
      'posko', jsonb_build_object('name', v_group.name, 'whatsapp', v_group.whatsapp,
                                  'address', v_group.address, 'city', v_group.city,
                                  'bank_name', v_group.bank_name, 'bank_account_no', v_group.bank_account_no,
                                  'bank_account_name', v_group.bank_account_name),
      'items', (select jsonb_agg(jsonb_build_object('id', i.finished_good_id, 'name', i.name, 'qty', i.qty,
                                                    'price', i.unit_price, 'subtotal', i.subtotal))
                from public.order_items i where i.order_id = o.id))
    from public.orders o where o.id = v_order);
end $$;


-- ---------------------------------------------------------------------
-- 4. LUNAS & KONFIRMASI PEMBAYARAN MANUAL
-- ---------------------------------------------------------------------
-- Lunas. Idempoten. Penjualan masuk tabel sales + buku kas posko (nilai produk saja).
-- Nama pembeli TIDAK disalin ke tabel sales (cukup kode pesanan) supaya data pribadi
-- tetap di satu tempat dan bisa dihapus.
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

  -- pembayaran datang setelah pesanan kedaluwarsa: ambil lagi stoknya (sebisanya)
  if v.stock_returned then
    update public.finished_goods f set qty = greatest(f.qty - i.qty, 0)
    from (select finished_good_id, sum(qty)::int qty from public.order_items where order_id = v.id group by 1) i
    where f.id = i.finished_good_id;
  end if;

  for it in select * from public.order_items where order_id = v.id loop
    insert into public.sales (group_id, finished_good_id, qty, unit_price, unit_cost, total, buyer_name, sold_at)
    values (v.group_id, it.finished_good_id, it.qty, it.unit_price, it.unit_cost, it.subtotal,
            'Online ' || v.code, public.today_wib());
  end loop;
  if v.subtotal > 0 then
    insert into public.cash_ledger (group_id, entry_type, category, amount, ref_table, ref_id, note)
    values (v.group_id, 'in', 'penjualan', v.subtotal, 'orders', v.id,
            'Pesanan online ' || v.code ||
            case v.payment_method when 'transfer' then ' (transfer ke rekening posko)'
                                  when 'tunai' then ' (tunai di posko)'
                                  else ' (dana di rekening platform sampai dicairkan)' end);
  end if;

  update public.orders
  set status = 'dibayar', paid_at = now(), stock_returned = false, closed_at = null,
      payment_type = coalesce(p_payment_type, payment_type),
      midtrans_transaction_id = coalesce(p_transaction_id, midtrans_transaction_id),
      midtrans_status = case when payment_method = 'online' then 'settlement' else midtrans_status end,
      updated_at = now()
  where id = v.id;

  return jsonb_build_object('already', false, 'code', v.code, 'status', 'dibayar', 'total', v.total,
                            'buyer_name', v.buyer_name, 'buyer_phone', v.buyer_phone,
                            'access_token', v.access_token, 'shipping_method', v.shipping_method,
                            'payment_method', v.payment_method,
                            'posko', jsonb_build_object('name', v_g.name, 'whatsapp', v_g.whatsapp));
end $$;

-- Pengurus menandai pesanan transfer/tunai sudah dibayar (juga untuk pesanan yang
-- terlanjur kedaluwarsa tetapi ternyata sudah ditransfer).
create or replace function public.confirm_manual_payment(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_gid uuid := public._require_pengurus();
  v public.orders%rowtype;
  r jsonb;
begin
  select * into v from public.orders where id = p_order_id and group_id = v_gid for update;
  if not found then raise exception 'PESANAN_TIDAK_DITEMUKAN'; end if;
  if v.payment_method = 'online' then raise exception 'BUKAN_PEMBAYARAN_MANUAL'; end if;
  if v.status not in ('menunggu_bayar', 'kedaluwarsa') then
    raise exception 'STATUS_TIDAK_BISA_DIUBAH: % → dibayar', v.status;
  end if;
  r := public.mark_order_paid(v.code, v.total, v.payment_method, null);
  update public.orders set paid_confirmed_by = auth.uid() where id = v.id;
  return r;
end $$;


-- ---------------------------------------------------------------------
-- 5. STATUS PESANAN v2 (link lacak kurir; resi bisa diperbaiki saat "dikirim")
-- ---------------------------------------------------------------------
drop function if exists public.set_order_status(uuid, text, text);
create or replace function public.set_order_status(
  p_order_id uuid, p_status text, p_tracking text default null, p_tracking_url text default null
) returns text language plpgsql security definer set search_path = '' as $$
declare
  v_gid uuid := public._require_pengurus();
  v public.orders%rowtype;
  v_url text := nullif(trim(p_tracking_url), '');
  ok boolean;
begin
  select * into v from public.orders where id = p_order_id and group_id = v_gid for update;
  if not found then raise exception 'PESANAN_TIDAK_DITEMUKAN'; end if;
  ok := case
    when v.status = 'menunggu_bayar' then p_status = 'batal'
    -- ambil di posko: boleh langsung "selesai" (barang diserahkan saat itu juga)
    when v.status = 'dibayar'  then p_status in ('diproses', 'dikirim', 'siap_diambil')
                                    or (p_status = 'selesai' and v.shipping_method = 'ambil')
    when v.status = 'diproses' then p_status in ('dikirim', 'siap_diambil')
                                    or (p_status = 'selesai' and v.shipping_method = 'ambil')
    when v.status = 'dikirim'  then p_status in ('dikirim', 'selesai')
    when v.status = 'siap_diambil' then p_status = 'selesai'
    else false end;
  if not ok then raise exception 'STATUS_TIDAK_BISA_DIUBAH: % → %', v.status, p_status; end if;
  if p_status = 'dikirim' and v.shipping_method <> 'kurir' then raise exception 'PESANAN_AMBIL_DI_POSKO'; end if;
  if p_status = 'siap_diambil' and v.shipping_method <> 'ambil' then raise exception 'PESANAN_DIKIRIM_KURIR'; end if;
  if v_url is not null and v_url !~ '^https://' then raise exception 'LINK_LACAK_TIDAK_VALID'; end if;

  if p_status = 'batal' then
    perform public.close_order(v.code, 'batal');
  else
    update public.orders
    set status = p_status,
        tracking_number = coalesce(nullif(trim(p_tracking), ''), tracking_number),
        tracking_url = coalesce(v_url, tracking_url),
        closed_at = case when p_status = 'selesai' then now() else closed_at end,
        updated_at = now()
    where id = v.id;
  end if;
  return p_status;
end $$;


-- ---------------------------------------------------------------------
-- 6. DANA ONLINE DI PLATFORM & PENCAIRAN KE POSKO
--    Pembayaran Midtrans masuk ke rekening pemilik akun Midtrans (platform).
--    Saldo posko = total pesanan online lunas (produk + ongkir, karena posko yang
--    membayar kurir) − dana yang sudah dicairkan − potongan biaya.
--    Pembayaran "simulasi" (mode uji) tidak dihitung.
-- ---------------------------------------------------------------------
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
  from public.orders where group_id = p_group and payment_method = 'online' and paid_at is not null;
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
-- 7. RINGKASAN TOKO SEMUA POSKO (ADMIN)
-- ---------------------------------------------------------------------
create or replace function public.admin_ringkasan_toko()
returns table (
  group_id uuid, name text, slug text, status text, shop_open boolean, whatsapp text, punya_lokasi boolean,
  pay_transfer boolean, pay_at_posko boolean, bank_name text, bank_account_no text, bank_account_name text,
  produk_tampil int, produk_tanpa_foto int, pesanan_30h int, menunggu_bayar int, perlu_diproses int,
  omzet_30h numeric, online_total numeric, simulasi_total numeric, dicairkan numeric, biaya numeric,
  saldo numeric, cair_terakhir date
) language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._require_admin();
  return query
  select g.id, g.name, g.slug, g.status, g.shop_open, g.whatsapp,
         g.latitude is not null and g.longitude is not null,
         g.pay_transfer, g.pay_at_posko, g.bank_name, g.bank_account_no, g.bank_account_name,
         (select count(*)::int from public.finished_goods f where f.group_id = g.id and f.is_listed),
         (select count(*)::int from public.finished_goods f where f.group_id = g.id and f.is_listed and f.photo_path is null),
         (select count(*)::int from public.orders o where o.group_id = g.id and o.created_at > now() - interval '30 days'),
         (select count(*)::int from public.orders o where o.group_id = g.id and o.status = 'menunggu_bayar'),
         (select count(*)::int from public.orders o where o.group_id = g.id and o.status in ('dibayar', 'diproses')),
         (select coalesce(sum(o.subtotal), 0) from public.orders o
           where o.group_id = g.id and o.paid_at > now() - interval '30 days'),
         (s ->> 'online_total')::numeric, (s ->> 'simulasi_total')::numeric, (s ->> 'dicairkan')::numeric,
         (s ->> 'biaya')::numeric, (s ->> 'saldo')::numeric, (s ->> 'cair_terakhir')::date
  from public.groups g
  cross join lateral (select public._saldo_platform(g.id) as s) x
  where g.status <> 'pending'
  order by (s ->> 'saldo')::numeric desc, g.name;
end $$;


-- ---------------------------------------------------------------------
-- 8. PEMBATASAN PERMINTAAN (rate limit, jendela tetap)
-- ---------------------------------------------------------------------
create table if not exists public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  hits         int not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;   -- tanpa policy: hanya server
revoke all on public.rate_limits from anon, authenticated;
grant select, insert, update, delete on public.rate_limits to service_role;

-- true = boleh lanjut, false = terlalu sering
create or replace function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_win int := greatest(coalesce(p_window_seconds, 60), 1);
  v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / v_win) * v_win);
  v_hits int;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (left(coalesce(p_key, '?'), 200), v_start, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;
  return v_hits <= greatest(coalesce(p_max, 1), 1);
end $$;


-- ---------------------------------------------------------------------
-- 9. CARI PESANAN, HAPUS DATA PEMBELI, PEMBERSIHAN HARIAN
-- ---------------------------------------------------------------------
-- Pembeli yang kehilangan link: kode pesanan + nomor HP → token link lacak
create or replace function public.cari_pesanan(p_code text, p_phone text)
returns text language sql stable security definer set search_path = '' as $$
  select o.access_token from public.orders o
  where o.code = upper(trim(coalesce(p_code, '')))
    and o.buyer_phone = public._normalize_wa(p_phone)
    and o.data_deleted_at is null
$$;

create or replace function public._anonymize_order(p_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.orders
  set buyer_name = 'Pembeli (data dihapus)', buyer_phone = '0', buyer_email = null,
      address = null, buyer_city = null, buyer_postal_code = null, buyer_lat = null, buyer_lng = null,
      note = null, data_deleted_at = now(), updated_at = now()
  where id = p_id and data_deleted_at is null
$$;

-- Hak hapus data (UU PDP): pembeli menghapus data pribadinya dari pesanan yang sudah selesai/ditutup
create or replace function public.hapus_data_pembeli(p_code text, p_token text)
returns text language plpgsql security definer set search_path = '' as $$
declare v public.orders%rowtype;
begin
  select * into v from public.orders where code = p_code and access_token = p_token for update;
  if not found then raise exception 'PESANAN_TIDAK_DITEMUKAN'; end if;
  if v.status not in ('selesai', 'batal', 'kedaluwarsa', 'gagal') then raise exception 'PESANAN_MASIH_BERJALAN'; end if;
  perform public._anonymize_order(v.id);
  return 'dihapus';
end $$;

-- Dipanggil cron harian: pesanan basi → kedaluwarsa, catatan rate limit lama dibuang,
-- data pembeli pesanan yang sudah ditutup > p_hari hari dianonimkan (masa simpan).
create or replace function public.maintenance_harian(p_hari int default 365)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_exp int; v_rl int; v_anon int := 0; r record;
begin
  v_exp := public._expire_stale_orders(90);
  delete from public.rate_limits where window_start < now() - interval '1 day';
  get diagnostics v_rl = row_count;
  for r in select id from public.orders
           where data_deleted_at is null
             and status in ('selesai', 'batal', 'kedaluwarsa', 'gagal')
             and coalesce(closed_at, updated_at) < now() - make_interval(days => greatest(p_hari, 30))
  loop
    perform public._anonymize_order(r.id);
    v_anon := v_anon + 1;
  end loop;
  return jsonb_build_object('kedaluwarsa', v_exp, 'rate_limit_dihapus', v_rl, 'dianonimkan', v_anon);
end $$;


-- ---------------------------------------------------------------------
-- 10. HAK AKSES
-- ---------------------------------------------------------------------
revoke execute on function
  public._expire_stale_orders(int, uuid), public.katalog_posko(text),
  public.create_order(text, jsonb, jsonb, jsonb, text, text),
  public.mark_order_paid(text, numeric, text, text), public.confirm_manual_payment(uuid),
  public.set_order_status(uuid, text, text, text),
  public._saldo_platform(uuid), public.my_platform_balance(),
  public.admin_record_payout(uuid, numeric, numeric, text, text, date), public.admin_delete_payout(uuid),
  public.admin_ringkasan_toko(), public.hit_rate_limit(text, int, int),
  public.cari_pesanan(text, text), public._anonymize_order(uuid),
  public.hapus_data_pembeli(text, text), public.maintenance_harian(int)
from public, anon, authenticated;

-- katalog: boleh tanpa login
grant execute on function public.katalog_posko(text) to anon, authenticated, service_role;

-- hanya server (secret key)
grant execute on function
  public.create_order(text, jsonb, jsonb, jsonb, text, text), public.mark_order_paid(text, numeric, text, text),
  public.hit_rate_limit(text, int, int), public.cari_pesanan(text, text),
  public.hapus_data_pembeli(text, text), public.maintenance_harian(int)
to service_role;

-- pengurus & admin (peran dicek di dalam fungsi)
grant execute on function
  public.confirm_manual_payment(uuid), public.set_order_status(uuid, text, text, text),
  public.my_platform_balance(), public.admin_record_payout(uuid, numeric, numeric, text, text, date),
  public.admin_delete_payout(uuid), public.admin_ringkasan_toko()
to authenticated;
