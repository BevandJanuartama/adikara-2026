-- =====================================================================
--  KriyaPKK — Skema Database Supabase (MVP v1.0, tanpa marketplace)
--  Sesuai SRS bagian 6 & FRD FR01–FR37.
--
--  CARA PAKAI: Supabase Dashboard → SQL Editor → New query →
--  tempel SELURUH isi file ini → Run. Jalankan SEKALI di proyek baru.
--
--  Prinsip:
--   * Semua tabel ber-tenant punya group_id + Row Level Security (RLS).
--   * Perubahan saldo, stok, dan kas HANYA lewat fungsi (RPC) di bawah,
--     sehingga selalu atomik (satu transaksi) dan tidak bisa diakali dari klien.
--   * Grant ditulis eksplisit → aman dengan aturan baru Supabase
--     (mulai 30 Okt 2026 tabel baru tidak otomatis bisa diakses Data API).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. UTILITAS
-- ---------------------------------------------------------------------
create or replace function public.today_wib()
returns date language sql stable set search_path = '' as $$
  select (now() at time zone 'Asia/Jakarta')::date
$$;


-- ---------------------------------------------------------------------
-- 1. TABEL
-- ---------------------------------------------------------------------

-- Kelompok PKK (mitra)
create table public.groups (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (length(trim(name)) > 0),
  address          text,
  status           text not null default 'pending'
                   check (status in ('pending', 'active', 'inactive')),
  activated_at     timestamptz,
  wage_per_hour    numeric(14,2) not null default 12500 check (wage_per_hour >= 0),
  default_margin   numeric(5,2)  not null default 0.40 check (default_margin between 0 and 3), -- 0,40 = 40%
  quota_scan_daily int not null default 30 check (quota_scan_daily >= 0),
  quota_idea_daily int not null default 10 check (quota_idea_daily >= 0),
  created_at       timestamptz not null default now()
);

-- Profil akun (1:1 dengan auth.users)
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  group_id   uuid references public.groups (id) on delete set null,
  full_name  text not null default '',
  role       text not null default 'anggota' check (role in ('admin', 'pengurus', 'anggota')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.profiles (group_id);

-- Fungsi bantu RLS (dibuat setelah profiles/groups ada)
create or replace function public.my_group_id()
returns uuid language sql stable security definer set search_path = '' as $$
  -- group_id milik user yang login, HANYA jika akun aktif & kelompok sudah diaktivasi
  select p.group_id
  from public.profiles p
  join public.groups g on g.id = p.group_id
  where p.id = (select auth.uid()) and p.is_active and g.status = 'active'
$$;

create or replace function public.my_any_group_id()
returns uuid language sql stable security definer set search_path = '' as $$
  -- termasuk kelompok yang masih 'pending' (untuk halaman status aktivasi)
  select p.group_id from public.profiles p where p.id = (select auth.uid())
$$;

create or replace function public.my_role()
returns text language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) and p.is_active
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = (select auth.uid()) and p.is_active),
    false)
$$;

create or replace function public.is_pengurus()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.my_group_id() is not null and public.my_role() = 'pengurus'
$$;

-- Warga penyetor
create table public.residents (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null default public.my_group_id() references public.groups (id) on delete cascade,
  name       text not null check (length(trim(name)) > 0),
  phone      text,
  balance    numeric(14,2) not null default 0 check (balance >= 0),
  created_at timestamptz not null default now()
);
create index on public.residents (group_id);

-- Tabel harga per kg
create table public.price_table (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null default public.my_group_id() references public.groups (id) on delete cascade,
  item_type    text not null check (length(trim(item_type)) > 0),
  price_per_kg numeric(14,2) not null check (price_per_kg > 0),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (group_id, item_type)
);

-- Setoran (header) — satu foto bisa berisi beberapa jenis barang
create table public.deposits (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  resident_id uuid not null references public.residents (id),
  photo_path  text,
  photo_hash  text,
  ai_result   jsonb,
  status      text not null default 'draft' check (status in ('draft', 'approved', 'cancelled')),
  total       numeric(14,2) not null default 0,
  paid_cash   boolean not null default false,
  created_by  uuid references public.profiles (id),
  decided_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  decided_at  timestamptz
);
create index on public.deposits (group_id, created_at desc);

-- Rincian setoran per jenis barang
create table public.deposit_items (
  id           uuid primary key default gen_random_uuid(),
  deposit_id   uuid not null references public.deposits (id) on delete cascade,
  group_id     uuid not null references public.groups (id) on delete cascade,
  item_type    text not null,
  condition    text not null default 'bersih' check (condition in ('bersih', 'kotor', 'rusak')),
  is_eligible  boolean not null default true,
  ai_suggested boolean not null default false,
  weight_kg    numeric(12,3) not null check (weight_kg > 0),
  price_per_kg numeric(14,2) not null default 0,
  subtotal     numeric(14,2) not null default 0,
  reason       text
);
create index on public.deposit_items (deposit_id);

-- Stok bahan baku (nilai rata-rata tertimbang per kg)
create table public.stock (
  id               uuid primary key default gen_random_uuid(),
  group_id         uuid not null references public.groups (id) on delete cascade,
  item_type        text not null,
  qty_kg           numeric(12,3) not null default 0 check (qty_kg >= 0),
  avg_value_per_kg numeric(14,2) not null default 0,
  updated_at       timestamptz not null default now(),
  unique (group_id, item_type)
);

-- Template ide kerajinan (global, dipakai mode manual / hemat token)
create table public.idea_templates (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  materials   jsonb not null,                 -- [{"item_type":"Kain perca","kg":0.25}]  per 1 unit
  tools       jsonb not null default '[]',    -- ["Gunting","Jarum jahit"]
  extras      jsonb not null default '[]',    -- [{"name":"Ritsleting 20 cm","price":2000}] per 1 unit
  tool_cost   numeric(14,2) not null default 500,  -- porsi penyusutan alat per unit
  time_hours  numeric(5,2) not null,
  difficulty  text not null default 'mudah' check (difficulty in ('mudah', 'sedang', 'sulit'))
);

-- Ide produk milik kelompok (hasil AI / template / manual) + costing per unit
create table public.ideas (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  template_id   uuid references public.idea_templates (id),
  title         text not null,
  description   text,
  materials     jsonb not null,
  tools         jsonb not null default '[]',
  extras        jsonb not null default '[]',
  time_hours    numeric(5,2) not null default 1,
  difficulty    text not null default 'sedang' check (difficulty in ('mudah', 'sedang', 'sulit')),
  material_cost numeric(14,2) not null default 0,
  extra_cost    numeric(14,2) not null default 0,
  tool_cost     numeric(14,2) not null default 0,
  labor_cost    numeric(14,2) not null default 0,
  unit_cost     numeric(14,2) not null default 0,   -- modal per unit
  margin        numeric(5,2)  not null default 0.40,
  sell_price    numeric(14,2) not null default 0,
  guide         jsonb,                                -- panduan (dibuat saat ide dipilih, lalu dipakai ulang)
  source        text not null default 'manual' check (source in ('ai', 'template', 'manual')),
  stock_hash    text,
  is_archived   boolean not null default false,
  created_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now()
);
create index on public.ideas (group_id);

-- Batch produksi
create table public.production_batches (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null references public.groups (id) on delete cascade,
  idea_id           uuid not null references public.ideas (id),
  qty_planned       int not null check (qty_planned > 0),
  qty_done          int check (qty_done >= 0),
  qty_failed        int check (qty_failed >= 0),
  status            text not null default 'running' check (status in ('running', 'done', 'cancelled')),
  materials_used    jsonb not null default '[]',  -- [{"item_type","kg","value"}]
  material_value    numeric(14,2) not null default 0,
  extra_cost_total  numeric(14,2) not null default 0,
  tool_cost_total   numeric(14,2) not null default 0,
  wage_total        numeric(14,2) not null default 0,
  assigned_members  uuid[] not null default '{}',
  result_photo_path text,
  created_by        uuid references public.profiles (id),
  started_at        timestamptz not null default now(),
  finished_at       timestamptz
);
create index on public.production_batches (group_id);

-- Upah anggota
create table public.wages (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  batch_id   uuid not null references public.production_batches (id),
  member_id  uuid not null references public.profiles (id),
  hours      numeric(6,2),
  amount     numeric(14,2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);
create index on public.wages (group_id, member_id);

-- Stok produk jadi
create table public.finished_goods (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  batch_id   uuid references public.production_batches (id),
  idea_id    uuid references public.ideas (id),
  name       text not null,
  qty        int not null default 0 check (qty >= 0),
  unit_cost  numeric(14,2) not null default 0,
  sell_price numeric(14,2) not null default 0 check (sell_price >= 0),
  photo_path text,
  created_at timestamptz not null default now()
);
create index on public.finished_goods (group_id);

-- Penjualan manual
create table public.sales (
  id               uuid primary key default gen_random_uuid(),
  group_id         uuid not null references public.groups (id) on delete cascade,
  finished_good_id uuid not null references public.finished_goods (id),
  qty              int not null check (qty > 0),
  unit_price       numeric(14,2) not null check (unit_price >= 0),
  unit_cost        numeric(14,2) not null default 0,  -- snapshot modal/unit saat terjual (untuk laba)
  total            numeric(14,2) not null,
  buyer_name       text,
  sold_at          date not null default public.today_wib(),
  created_by       uuid references public.profiles (id),
  created_at       timestamptz not null default now()
);
create index on public.sales (group_id, sold_at);

-- Buku kas (append-only; koreksi = entri pembalik)
create table public.cash_ledger (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  entry_type  text not null check (entry_type in ('in', 'out')),
  category    text not null check (category in
                ('modal_awal', 'pembelian_setoran', 'bahan_tambahan', 'upah', 'penjualan', 'lainnya', 'koreksi')),
  amount      numeric(14,2) not null check (amount > 0),
  ref_table   text,
  ref_id      uuid,
  reverses_id uuid references public.cash_ledger (id),
  note        text,
  entry_date  date not null default public.today_wib(),
  created_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now()
);
create index on public.cash_ledger (group_id, entry_date);
create unique index cash_ledger_reverse_once on public.cash_ledger (reverses_id) where reverses_id is not null;

-- Pencatatan pemakaian AI (kuota)
create table public.ai_usage (
  id         bigint generated always as identity primary key,
  group_id   uuid not null references public.groups (id) on delete cascade,
  fn         text not null check (fn in ('scan', 'idea', 'guide')),
  model      text,
  tokens_in  int not null default 0,
  tokens_out int not null default 0,
  ok         boolean,
  usage_date date not null default public.today_wib(),
  created_at timestamptz not null default now()
);
create index on public.ai_usage (group_id, fn, usage_date);

-- Cache hasil AI (scan per hash foto, ide per hash ringkasan stok, panduan per ide+bahan)
create table public.ai_cache (
  hash       text primary key,
  fn         text not null check (fn in ('scan', 'idea', 'guide')),
  result     jsonb not null,
  created_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.groups             enable row level security;
alter table public.profiles           enable row level security;
alter table public.residents          enable row level security;
alter table public.price_table        enable row level security;
alter table public.deposits           enable row level security;
alter table public.deposit_items      enable row level security;
alter table public.stock              enable row level security;
alter table public.idea_templates     enable row level security;
alter table public.ideas              enable row level security;
alter table public.production_batches enable row level security;
alter table public.wages              enable row level security;
alter table public.finished_goods     enable row level security;
alter table public.sales              enable row level security;
alter table public.cash_ledger        enable row level security;
alter table public.ai_usage           enable row level security;
alter table public.ai_cache           enable row level security;

-- groups
create policy groups_select on public.groups for select to authenticated
  using (id = (select public.my_any_group_id()) or (select public.is_admin()));
create policy groups_update on public.groups for update to authenticated
  using (id = (select public.my_group_id()) and (select public.is_pengurus()))
  with check (id = (select public.my_group_id()));

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid())
         or group_id = (select public.my_group_id())
         or (select public.is_admin()));
create policy profiles_update on public.profiles for update to authenticated
  using (group_id = (select public.my_group_id())
         and (select public.is_pengurus())
         and id <> (select auth.uid()))              -- FR03: pengurus tidak bisa menonaktifkan dirinya
  with check (group_id = (select public.my_group_id()) and role in ('pengurus', 'anggota'));

-- residents (hanya pengurus)
create policy residents_select on public.residents for select to authenticated
  using (group_id = (select public.my_group_id()) and (select public.is_pengurus()));
create policy residents_insert on public.residents for insert to authenticated
  with check (group_id = (select public.my_group_id()) and (select public.is_pengurus()));
create policy residents_update on public.residents for update to authenticated
  using (group_id = (select public.my_group_id()) and (select public.is_pengurus()))
  with check (group_id = (select public.my_group_id()));

-- price_table (semua anggota baca, pengurus ubah)
create policy price_select on public.price_table for select to authenticated
  using (group_id = (select public.my_group_id()));
create policy price_insert on public.price_table for insert to authenticated
  with check (group_id = (select public.my_group_id()) and (select public.is_pengurus()));
create policy price_update on public.price_table for update to authenticated
  using (group_id = (select public.my_group_id()) and (select public.is_pengurus()))
  with check (group_id = (select public.my_group_id()));

-- deposits & items (baca: pengurus; tulis: lewat fungsi)
create policy deposits_select on public.deposits for select to authenticated
  using (group_id = (select public.my_group_id()) and (select public.is_pengurus()));
create policy deposit_items_select on public.deposit_items for select to authenticated
  using (group_id = (select public.my_group_id()) and (select public.is_pengurus()));

-- stock (semua anggota baca)
create policy stock_select on public.stock for select to authenticated
  using (group_id = (select public.my_group_id()));

-- idea_templates (semua user login baca)
create policy templates_select on public.idea_templates for select to authenticated
  using (true);

-- ideas
create policy ideas_select on public.ideas for select to authenticated
  using (group_id = (select public.my_group_id()));
create policy ideas_update on public.ideas for update to authenticated
  using (group_id = (select public.my_group_id()) and (select public.is_pengurus()))
  with check (group_id = (select public.my_group_id()));

-- production & finished goods (semua anggota baca)
create policy batches_select on public.production_batches for select to authenticated
  using (group_id = (select public.my_group_id()));
create policy fg_select on public.finished_goods for select to authenticated
  using (group_id = (select public.my_group_id()));
create policy fg_update on public.finished_goods for update to authenticated
  using (group_id = (select public.my_group_id()) and (select public.is_pengurus()))
  with check (group_id = (select public.my_group_id()));

-- wages (pengurus lihat semua; anggota lihat miliknya sendiri)
create policy wages_select on public.wages for select to authenticated
  using (group_id = (select public.my_group_id())
         and ((select public.is_pengurus()) or member_id = (select auth.uid())));

-- sales & cash (hanya pengurus)
create policy sales_select on public.sales for select to authenticated
  using (group_id = (select public.my_group_id()) and (select public.is_pengurus()));
create policy ledger_select on public.cash_ledger for select to authenticated
  using (group_id = (select public.my_group_id()) and (select public.is_pengurus()));

-- ai_usage (pengurus kelompoknya, admin semua)
create policy ai_usage_select on public.ai_usage for select to authenticated
  using ((group_id = (select public.my_group_id()) and (select public.is_pengurus()))
         or (select public.is_admin()));

-- ai_cache (anggota aktif mana pun; isinya bukan data pribadi)
create policy ai_cache_select on public.ai_cache for select to authenticated
  using ((select public.my_group_id()) is not null);
create policy ai_cache_insert on public.ai_cache for insert to authenticated
  with check ((select public.my_group_id()) is not null);


-- ---------------------------------------------------------------------
-- 3. VIEW: kapasitas ide (berapa unit bisa dibuat dari stok sekarang)
-- ---------------------------------------------------------------------
create view public.v_idea_capacity with (security_invoker = true) as
select
  i.id as idea_id,
  i.group_id,
  coalesce(min(floor(coalesce(s.qty_kg, 0) / nullif((m ->> 'kg')::numeric, 0)))::int, 0) as max_units,
  jsonb_agg(jsonb_build_object(
    'item_type', m ->> 'item_type',
    'need_kg',   (m ->> 'kg')::numeric,
    'stock_kg',  coalesce(s.qty_kg, 0))) as materials_status
from public.ideas i
cross join lateral jsonb_array_elements(i.materials) m
left join public.stock s on s.group_id = i.group_id and s.item_type = m ->> 'item_type'
where not i.is_archived
group by i.id, i.group_id;


-- ---------------------------------------------------------------------
-- 4. TRIGGER: pendaftaran akun & template harga
-- ---------------------------------------------------------------------

-- Saat user baru dibuat:
--  * Daftar lewat form "Daftar Kelompok" (metadata group_name) → buat kelompok
--    baru berstatus 'pending' + profil pengurus.  (FR01)
--  * Dibuat pengurus via server (tanpa group_name) → profil anggota tanpa
--    kelompok; server lalu mengisi group_id & role pakai secret key.  (FR03)
--  Catatan keamanan: role/group_id dari metadata TIDAK pernah dipercaya.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_group_name text := nullif(trim(new.raw_user_meta_data ->> 'group_name'), '');
  v_gid uuid;
begin
  if v_group_name is not null then
    insert into public.groups (name, address)
    values (v_group_name, nullif(trim(new.raw_user_meta_data ->> 'group_address'), ''))
    returning id into v_gid;
    insert into public.profiles (id, group_id, full_name, role)
    values (new.id, v_gid, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'pengurus');
  else
    insert into public.profiles (id, full_name, role)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'anggota');
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Template harga awal untuk setiap kelompok baru (FR05). Sesuaikan harga pengepul setempat.
create or replace function public.seed_default_prices()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.price_table (group_id, item_type, price_per_kg) values
    (new.id, 'Plastik PET',  3000),
    (new.id, 'Plastik HDPE', 2500),
    (new.id, 'Kardus',       1500),
    (new.id, 'Kertas',       1200),
    (new.id, 'Kain perca',   3000),
    (new.id, 'Kaca',          500),
    (new.id, 'Logam',        4000)
  on conflict do nothing;
  return new;
end $$;

create trigger on_group_created
  after insert on public.groups
  for each row execute function public.seed_default_prices();


-- ---------------------------------------------------------------------
-- 5. FUNGSI BISNIS (RPC) — dipanggil dari Next.js: supabase.rpc('nama', {...})
--    Fungsi berawalan "_" = internal (tidak bisa dipanggil klien).
-- ---------------------------------------------------------------------

create or replace function public._require_member()
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v_gid uuid := public.my_group_id();
begin
  if v_gid is null then
    raise exception 'AKSES_DITOLAK: akun nonaktif atau kelompok belum diaktivasi' using errcode = '42501';
  end if;
  return v_gid;
end $$;

create or replace function public._require_pengurus()
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v_gid uuid := public.my_group_id();
begin
  if v_gid is null or public.my_role() is distinct from 'pengurus' then
    raise exception 'AKSES_DITOLAK: khusus pengurus kelompok aktif' using errcode = '42501';
  end if;
  return v_gid;
end $$;

create or replace function public._require_admin()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'AKSES_DITOLAK: khusus admin platform' using errcode = '42501';
  end if;
end $$;

-- 5.1 SETORAN ---------------------------------------------------------

-- FR10: buat setoran draft; harga SELALU diambil dari tabel harga (bukan dari AI/klien)
-- p_items: [{"item_type":"Kardus","condition":"bersih","is_eligible":true,"weight_kg":2.5,
--            "ai_suggested":true,"reason":"kering dan bersih"}]
create or replace function public.create_deposit(
  p_resident_id uuid,
  p_items       jsonb,
  p_photo_path  text  default null,
  p_photo_hash  text  default null,
  p_ai_result   jsonb default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_gid      uuid := public._require_pengurus();
  v_id       uuid;
  v_total    numeric(14,2) := 0;
  v_item     jsonb;
  v_price    numeric(14,2);
  v_weight   numeric(12,3);
  v_eligible boolean;
  v_sub      numeric(14,2);
begin
  if not exists (select 1 from public.residents r where r.id = p_resident_id and r.group_id = v_gid) then
    raise exception 'WARGA_TIDAK_DITEMUKAN';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'ITEM_KOSONG: minimal satu jenis barang';
  end if;
  if p_photo_path is not null and split_part(p_photo_path, '/', 1) <> v_gid::text then
    raise exception 'FOTO_TIDAK_VALID';
  end if;

  insert into public.deposits (group_id, resident_id, photo_path, photo_hash, ai_result, created_by)
  values (v_gid, p_resident_id, p_photo_path, p_photo_hash, p_ai_result, auth.uid())
  returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_weight   := coalesce((v_item ->> 'weight_kg')::numeric, 0);
    v_eligible := coalesce((v_item ->> 'is_eligible')::boolean, true);
    if v_weight <= 0 then
      raise exception 'BERAT_TIDAK_VALID: %', v_item ->> 'item_type';
    end if;

    select pt.price_per_kg into v_price
    from public.price_table pt
    where pt.group_id = v_gid and pt.item_type = v_item ->> 'item_type' and pt.is_active;

    if v_eligible and v_price is null then
      raise exception 'HARGA_BELUM_DIATUR: %', v_item ->> 'item_type';
    end if;

    v_sub := case when v_eligible then round(v_weight * v_price, 0) else 0 end;  -- FR10: tidak layak = Rp0

    insert into public.deposit_items
      (deposit_id, group_id, item_type, condition, is_eligible, ai_suggested, weight_kg, price_per_kg, subtotal, reason)
    values
      (v_id, v_gid, v_item ->> 'item_type', coalesce(v_item ->> 'condition', 'bersih'), v_eligible,
       coalesce((v_item ->> 'ai_suggested')::boolean, false), v_weight, coalesce(v_price, 0), v_sub,
       left(v_item ->> 'reason', 200));

    v_total := v_total + v_sub;
  end loop;

  update public.deposits set total = v_total where id = v_id;
  return jsonb_build_object('deposit_id', v_id, 'total', v_total);
end $$;

-- FR11–FR12 (internal): setujui setoran → stok naik (rata-rata tertimbang),
-- lalu saldo warga naik ATAU kas keluar (bila dibayar tunai saat itu juga).
create or replace function public._approve_deposit(
  p_deposit_id uuid, p_gid uuid, p_pay_cash boolean, p_uid uuid, p_at timestamptz
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_dep  public.deposits%rowtype;
  v_line record;
begin
  select * into v_dep from public.deposits
  where id = p_deposit_id and group_id = p_gid
  for update;
  if not found then raise exception 'SETORAN_TIDAK_DITEMUKAN'; end if;
  if v_dep.status <> 'draft' then raise exception 'SETORAN_SUDAH_DIPROSES: status %', v_dep.status; end if;

  for v_line in
    select di.item_type, sum(di.weight_kg) as kg, sum(di.subtotal) as val
    from public.deposit_items di
    where di.deposit_id = v_dep.id and di.is_eligible
    group by di.item_type
  loop
    insert into public.stock as s (group_id, item_type, qty_kg, avg_value_per_kg)
    values (p_gid, v_line.item_type, v_line.kg, round(v_line.val / v_line.kg, 2))
    on conflict (group_id, item_type) do update
      set avg_value_per_kg = round((s.qty_kg * s.avg_value_per_kg + v_line.val) / (s.qty_kg + v_line.kg), 2),
          qty_kg           = s.qty_kg + v_line.kg,
          updated_at       = now();
  end loop;

  if v_dep.total > 0 then
    if p_pay_cash then
      insert into public.cash_ledger (group_id, entry_type, category, amount, ref_table, ref_id, note, created_by, entry_date)
      values (p_gid, 'out', 'pembelian_setoran', v_dep.total, 'deposits', v_dep.id,
              'Bayar tunai setoran warga', p_uid, (p_at at time zone 'Asia/Jakarta')::date);
    else
      update public.residents set balance = balance + v_dep.total where id = v_dep.resident_id;
    end if;
  end if;

  update public.deposits
  set status = 'approved', paid_cash = p_pay_cash, decided_at = p_at, decided_by = p_uid
  where id = v_dep.id;

  return jsonb_build_object('deposit_id', v_dep.id, 'total', v_dep.total, 'paid_cash', p_pay_cash);
end $$;

create or replace function public.approve_deposit(p_deposit_id uuid, p_pay_cash boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  return public._approve_deposit(p_deposit_id, public._require_pengurus(), p_pay_cash, auth.uid(), now());
end $$;

create or replace function public.cancel_deposit(p_deposit_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_gid uuid := public._require_pengurus();
begin
  update public.deposits
  set status = 'cancelled', decided_at = now(), decided_by = auth.uid()
  where id = p_deposit_id and group_id = v_gid and status = 'draft';
  if not found then raise exception 'SETORAN_TIDAK_BISA_DIBATALKAN'; end if;
end $$;

-- FR13: pencairan saldo warga → saldo turun, kas keluar
create or replace function public.withdraw_balance(p_resident_id uuid, p_amount numeric, p_note text default null)
returns numeric language plpgsql security definer set search_path = '' as $$
declare
  v_gid uuid := public._require_pengurus();
  v_bal numeric(14,2);
begin
  if p_amount is null or p_amount <= 0 then raise exception 'JUMLAH_TIDAK_VALID'; end if;
  update public.residents
  set balance = balance - p_amount
  where id = p_resident_id and group_id = v_gid and balance >= p_amount
  returning balance into v_bal;
  if not found then raise exception 'SALDO_TIDAK_CUKUP'; end if;

  insert into public.cash_ledger (group_id, entry_type, category, amount, ref_table, ref_id, note, created_by)
  values (v_gid, 'out', 'pembelian_setoran', p_amount, 'residents', p_resident_id,
          coalesce(p_note, 'Pencairan saldo warga'), auth.uid());
  return v_bal;
end $$;

-- 5.2 KAS ---------------------------------------------------------------

-- Entri kas manual (modal awal, pembelian lain, dsb.)
create or replace function public.add_cash_entry(
  p_entry_type text, p_category text, p_amount numeric, p_note text default null,
  p_date date default public.today_wib()
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_gid uuid := public._require_pengurus(); v_id uuid;
begin
  if p_category not in ('modal_awal', 'bahan_tambahan', 'lainnya') then
    raise exception 'KATEGORI_TIDAK_BOLEH_MANUAL: %', p_category;
  end if;
  insert into public.cash_ledger (group_id, entry_type, category, amount, note, entry_date, created_by)
  values (v_gid, p_entry_type, p_category, p_amount, p_note, p_date, auth.uid())
  returning id into v_id;
  return v_id;
end $$;

-- FR29: koreksi lewat entri pembalik (data keuangan tidak pernah dihapus)
create or replace function public.reverse_cash_entry(p_entry_id uuid, p_note text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_gid  uuid := public._require_pengurus();
  v_orig public.cash_ledger%rowtype;
  v_id   uuid;
begin
  select * into v_orig from public.cash_ledger where id = p_entry_id and group_id = v_gid for update;
  if not found then raise exception 'ENTRI_TIDAK_DITEMUKAN'; end if;
  if v_orig.reverses_id is not null then raise exception 'ENTRI_PEMBALIK_TIDAK_BISA_DIBALIK'; end if;
  if exists (select 1 from public.cash_ledger where reverses_id = v_orig.id) then
    raise exception 'ENTRI_SUDAH_DIKOREKSI';
  end if;

  insert into public.cash_ledger (group_id, entry_type, category, amount, ref_table, ref_id, reverses_id, note, created_by)
  values (v_gid, case v_orig.entry_type when 'in' then 'out' else 'in' end, 'koreksi', v_orig.amount,
          v_orig.ref_table, v_orig.ref_id, v_orig.id, coalesce(p_note, 'Koreksi'), auth.uid())
  returning id into v_id;
  return v_id;
end $$;

-- 5.3 IDE & COSTING (FR18–FR23) ---------------------------------------

-- Modal = nilai bahan stok + bahan tambahan + porsi alat + upah; harga jual = modal × (1+margin), dibulatkan ke atas Rp500
create or replace function public._idea_costs(
  p_gid uuid, p_materials jsonb, p_extras jsonb, p_tool_cost numeric, p_time_hours numeric, p_margin numeric
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_wage   numeric;
  v_margin numeric;
  v_mat    numeric := 0;
  v_extra  numeric := 0;
  v_avg    numeric;
  v_m      jsonb;
  v_e      jsonb;
  v_labor  numeric;
  v_unit   numeric;
begin
  select g.wage_per_hour, coalesce(p_margin, g.default_margin) into v_wage, v_margin
  from public.groups g where g.id = p_gid;

  for v_m in select * from jsonb_array_elements(coalesce(p_materials, '[]'::jsonb)) loop
    select s.avg_value_per_kg into v_avg
    from public.stock s where s.group_id = p_gid and s.item_type = v_m ->> 'item_type' and s.avg_value_per_kg > 0;
    if v_avg is null then  -- belum pernah ada stok → pakai harga tabel
      select pt.price_per_kg into v_avg
      from public.price_table pt where pt.group_id = p_gid and pt.item_type = v_m ->> 'item_type';
    end if;
    v_mat := v_mat + coalesce((v_m ->> 'kg')::numeric, 0) * coalesce(v_avg, 0);
  end loop;

  for v_e in select * from jsonb_array_elements(coalesce(p_extras, '[]'::jsonb)) loop
    v_extra := v_extra + coalesce((v_e ->> 'price')::numeric, 0) * coalesce((v_e ->> 'qty')::numeric, 1);
  end loop;

  v_labor := round(coalesce(p_time_hours, 0) * v_wage, 0);
  v_unit  := round(v_mat, 0) + round(v_extra, 0) + round(coalesce(p_tool_cost, 0), 0) + v_labor;

  return jsonb_build_object(
    'material_cost', round(v_mat, 0),
    'extra_cost',    round(v_extra, 0),
    'tool_cost',     round(coalesce(p_tool_cost, 0), 0),
    'labor_cost',    v_labor,
    'unit_cost',     v_unit,
    'margin',        v_margin,
    'sell_price',    ceil(v_unit * (1 + v_margin) / 500.0) * 500);
end $$;

-- Simpan ide (dari AI / template / manual). Costing dihitung di server.
-- p: {"title","description","materials":[{"item_type","kg"}],"tools":[..],"extras":[{"name","price"}],
--     "tool_cost","time_hours","difficulty","source","template_id","stock_hash","margin"}
create or replace function public.create_idea(p jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_gid    uuid := public._require_member();
  v_margin numeric := nullif(p ->> 'margin', '')::numeric;
  v_tool   numeric := coalesce(nullif(p ->> 'tool_cost', '')::numeric, 500);
  v_hours  numeric := coalesce(nullif(p ->> 'time_hours', '')::numeric, 1);
  v_c      jsonb;
  v_id     uuid;
begin
  if coalesce(trim(p ->> 'title'), '') = '' then raise exception 'JUDUL_KOSONG'; end if;
  if jsonb_typeof(p -> 'materials') is distinct from 'array' or jsonb_array_length(p -> 'materials') = 0 then
    raise exception 'BAHAN_KOSONG';
  end if;
  if exists (select 1 from jsonb_array_elements(p -> 'materials') m
             where coalesce((m ->> 'kg')::numeric, 0) <= 0) then
    raise exception 'BAHAN_KG_TIDAK_VALID';
  end if;
  if v_margin is not null and (v_margin < 0 or v_margin > 3) then raise exception 'MARGIN_TIDAK_VALID'; end if;

  v_c := public._idea_costs(v_gid, p -> 'materials', p -> 'extras', v_tool, v_hours, v_margin);

  insert into public.ideas (
    group_id, template_id, title, description, materials, tools, extras, time_hours, difficulty,
    material_cost, extra_cost, tool_cost, labor_cost, unit_cost, margin, sell_price,
    source, stock_hash, created_by)
  values (
    v_gid, nullif(p ->> 'template_id', '')::uuid, trim(p ->> 'title'), p ->> 'description',
    p -> 'materials', coalesce(p -> 'tools', '[]'::jsonb), coalesce(p -> 'extras', '[]'::jsonb),
    v_hours, coalesce(p ->> 'difficulty', 'sedang'),
    (v_c ->> 'material_cost')::numeric, (v_c ->> 'extra_cost')::numeric, (v_c ->> 'tool_cost')::numeric,
    (v_c ->> 'labor_cost')::numeric, (v_c ->> 'unit_cost')::numeric, (v_c ->> 'margin')::numeric,
    (v_c ->> 'sell_price')::numeric,
    coalesce(p ->> 'source', 'manual'), p ->> 'stock_hash', auth.uid())
  returning id into v_id;
  return v_id;
end $$;

-- FR23/FR34: mode manual — buat ide dari template tanpa AI
create or replace function public.create_idea_from_template(p_template_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_t public.idea_templates%rowtype;
begin
  select * into v_t from public.idea_templates where id = p_template_id;
  if not found then raise exception 'TEMPLATE_TIDAK_DITEMUKAN'; end if;
  return public.create_idea(jsonb_build_object(
    'title', v_t.title, 'description', v_t.description, 'materials', v_t.materials,
    'tools', v_t.tools, 'extras', v_t.extras, 'tool_cost', v_t.tool_cost,
    'time_hours', v_t.time_hours, 'difficulty', v_t.difficulty,
    'source', 'template', 'template_id', v_t.id));
end $$;

-- FR20–FR21: pengurus ubah harga bahan tambahan / margin / harga jual
create or replace function public.update_idea_pricing(
  p_idea_id uuid, p_extras jsonb default null, p_margin numeric default null, p_sell_price numeric default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_gid  uuid := public._require_pengurus();
  v_idea public.ideas%rowtype;
  v_c    jsonb;
  v_sell numeric;
begin
  select * into v_idea from public.ideas where id = p_idea_id and group_id = v_gid for update;
  if not found then raise exception 'IDE_TIDAK_DITEMUKAN'; end if;
  if p_margin is not null and (p_margin < 0 or p_margin > 3) then raise exception 'MARGIN_TIDAK_VALID'; end if;

  v_c := public._idea_costs(v_gid, v_idea.materials, coalesce(p_extras, v_idea.extras),
                            v_idea.tool_cost, v_idea.time_hours, coalesce(p_margin, v_idea.margin));
  v_sell := coalesce(p_sell_price, (v_c ->> 'sell_price')::numeric);
  if v_sell < 0 then raise exception 'HARGA_TIDAK_VALID'; end if;

  update public.ideas set
    extras        = coalesce(p_extras, extras),
    material_cost = (v_c ->> 'material_cost')::numeric,
    extra_cost    = (v_c ->> 'extra_cost')::numeric,
    labor_cost    = (v_c ->> 'labor_cost')::numeric,
    unit_cost     = (v_c ->> 'unit_cost')::numeric,
    margin        = case when p_sell_price is not null and (v_c ->> 'unit_cost')::numeric > 0
                         then least(3, greatest(0, round(p_sell_price / (v_c ->> 'unit_cost')::numeric - 1, 2)))
                         else (v_c ->> 'margin')::numeric end,
    sell_price    = v_sell
  where id = v_idea.id;

  return v_c || jsonb_build_object('sell_price', v_sell);
end $$;

-- FR22: simpan panduan sekali saja (tidak ditimpa bila sudah ada)
create or replace function public.save_idea_guide(p_idea_id uuid, p_guide jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_gid uuid := public._require_member();
begin
  update public.ideas set guide = p_guide
  where id = p_idea_id and group_id = v_gid and guide is null;
  return found;
end $$;

-- 5.4 PRODUKSI (FR24–FR26) -----------------------------------------------

create or replace function public._start_batch(
  p_gid uuid, p_uid uuid, p_idea_id uuid, p_qty int, p_members uuid[], p_at timestamptz
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_idea  public.ideas%rowtype;
  v_m     jsonb;
  v_need  numeric;
  v_stock public.stock%rowtype;
  v_used  jsonb := '[]'::jsonb;
  v_value numeric := 0;
  v_extra numeric;
  v_id    uuid;
begin
  if p_qty is null or p_qty <= 0 then raise exception 'JUMLAH_TIDAK_VALID'; end if;
  select * into v_idea from public.ideas where id = p_idea_id and group_id = p_gid;
  if not found then raise exception 'IDE_TIDAK_DITEMUKAN'; end if;
  if exists (select 1 from unnest(coalesce(p_members, '{}'::uuid[])) as mid
             where not exists (select 1 from public.profiles pr
                               where pr.id = mid and pr.group_id = p_gid and pr.is_active)) then
    raise exception 'ANGGOTA_TIDAK_VALID';
  end if;

  -- FR16: cek & kurangi stok (dikunci per baris supaya tidak bentrok)
  for v_m in select * from jsonb_array_elements(v_idea.materials) loop
    v_need := (v_m ->> 'kg')::numeric * p_qty;
    select * into v_stock from public.stock
    where group_id = p_gid and item_type = v_m ->> 'item_type'
    for update;
    if not found or v_stock.qty_kg < v_need then
      raise exception 'STOK_KURANG: % butuh % kg, tersedia % kg',
        v_m ->> 'item_type', v_need, coalesce(v_stock.qty_kg, 0);
    end if;
    update public.stock set qty_kg = qty_kg - v_need, updated_at = now() where id = v_stock.id;
    v_used  := v_used || jsonb_build_object('item_type', v_stock.item_type, 'kg', v_need,
                                            'value', round(v_need * v_stock.avg_value_per_kg, 0));
    v_value := v_value + round(v_need * v_stock.avg_value_per_kg, 0);
  end loop;

  v_extra := v_idea.extra_cost * p_qty;
  insert into public.production_batches
    (group_id, idea_id, qty_planned, materials_used, material_value, extra_cost_total, tool_cost_total,
     assigned_members, created_by, started_at)
  values
    (p_gid, v_idea.id, p_qty, v_used, v_value, v_extra, v_idea.tool_cost * p_qty,
     coalesce(p_members, '{}'::uuid[]), p_uid, p_at)
  returning id into v_id;

  if v_extra > 0 then  -- belanja bahan tambahan di warung = kas keluar
    insert into public.cash_ledger (group_id, entry_type, category, amount, ref_table, ref_id, note, created_by, entry_date)
    values (p_gid, 'out', 'bahan_tambahan', v_extra, 'production_batches', v_id,
            'Bahan tambahan: ' || v_idea.title, p_uid, (p_at at time zone 'Asia/Jakarta')::date);
  end if;
  return v_id;
end $$;

create or replace function public.start_batch(p_idea_id uuid, p_qty int, p_members uuid[] default '{}')
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  return public._start_batch(public._require_pengurus(), auth.uid(), p_idea_id, p_qty, p_members, now());
end $$;

-- Batalkan batch yang masih berjalan → bahan dikembalikan ke stok
create or replace function public.cancel_batch(p_batch_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_gid   uuid := public._require_pengurus();
  v_batch public.production_batches%rowtype;
  v_u     jsonb;
begin
  select * into v_batch from public.production_batches where id = p_batch_id and group_id = v_gid for update;
  if not found or v_batch.status <> 'running' then raise exception 'BATCH_TIDAK_BISA_DIBATALKAN'; end if;
  for v_u in select * from jsonb_array_elements(v_batch.materials_used) loop
    update public.stock s
    set avg_value_per_kg = round((s.qty_kg * s.avg_value_per_kg + (v_u ->> 'value')::numeric)
                                 / (s.qty_kg + (v_u ->> 'kg')::numeric), 2),
        qty_kg = s.qty_kg + (v_u ->> 'kg')::numeric,
        updated_at = now()
    where s.group_id = v_gid and s.item_type = v_u ->> 'item_type';
  end loop;
  update public.production_batches set status = 'cancelled', finished_at = now() where id = v_batch.id;
end $$;

-- FR25: catat hasil → produk jadi bertambah; unit gagal tetap jadi biaya
create or replace function public._finish_batch(
  p_gid uuid, p_batch_id uuid, p_done int, p_failed int, p_photo text, p_at timestamptz
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_batch public.production_batches%rowtype;
  v_idea  public.ideas%rowtype;
  v_unit  numeric := 0;
  v_fg    uuid;
begin
  select * into v_batch from public.production_batches where id = p_batch_id and group_id = p_gid for update;
  if not found then raise exception 'BATCH_TIDAK_DITEMUKAN'; end if;
  if v_batch.status <> 'running' then raise exception 'BATCH_SUDAH_SELESAI'; end if;
  p_done := coalesce(p_done, 0); p_failed := coalesce(p_failed, 0);
  if p_done < 0 or p_failed < 0 or p_done + p_failed = 0 or p_done + p_failed > v_batch.qty_planned then
    raise exception 'JUMLAH_HASIL_TIDAK_VALID: jadi + gagal harus 1..%', v_batch.qty_planned;
  end if;

  update public.production_batches
  set status = 'done', qty_done = p_done, qty_failed = p_failed, result_photo_path = p_photo, finished_at = p_at
  where id = v_batch.id;

  if p_done > 0 then
    select * into v_idea from public.ideas where id = v_batch.idea_id;
    v_unit := round((v_batch.material_value + v_batch.extra_cost_total + v_batch.tool_cost_total + v_batch.wage_total)
                    / p_done, 0);
    insert into public.finished_goods (group_id, batch_id, idea_id, name, qty, unit_cost, sell_price, photo_path, created_at)
    values (p_gid, v_batch.id, v_idea.id, v_idea.title, p_done, v_unit, v_idea.sell_price, p_photo, p_at)
    returning id into v_fg;
  end if;
  return jsonb_build_object('batch_id', v_batch.id, 'finished_good_id', v_fg, 'unit_cost', v_unit);
end $$;

create or replace function public.finish_batch(
  p_batch_id uuid, p_done int, p_failed int default 0, p_photo text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_gid uuid := public._require_member();
begin
  -- pengurus, atau anggota yang ditugaskan di batch ini
  if public.my_role() <> 'pengurus' and not exists (
       select 1 from public.production_batches b
       where b.id = p_batch_id and b.group_id = v_gid and (select auth.uid()) = any (b.assigned_members)) then
    raise exception 'AKSES_DITOLAK: bukan anggota batch ini' using errcode = '42501';
  end if;
  return public._finish_batch(v_gid, p_batch_id, p_done, p_failed, p_photo, now());
end $$;

-- FR26: upah per anggota → baris upah + kas keluar; modal/unit produk jadi diperbarui
-- p_wages: [{"member_id":"uuid","hours":1.5,"amount":18750}]
create or replace function public._pay_wages(
  p_gid uuid, p_uid uuid, p_batch_id uuid, p_wages jsonb, p_at timestamptz
) returns numeric language plpgsql security definer set search_path = '' as $$
declare
  v_batch public.production_batches%rowtype;
  v_w     jsonb;
  v_amt   numeric;
  v_name  text;
  v_total numeric := 0;
begin
  select * into v_batch from public.production_batches where id = p_batch_id and group_id = p_gid for update;
  if not found or v_batch.status = 'cancelled' then raise exception 'BATCH_TIDAK_VALID'; end if;

  for v_w in select * from jsonb_array_elements(coalesce(p_wages, '[]'::jsonb)) loop
    v_amt := round(coalesce((v_w ->> 'amount')::numeric, -1), 0);
    if v_amt < 0 then raise exception 'UPAH_TIDAK_VALID'; end if;
    continue when v_amt = 0;
    select pr.full_name into v_name from public.profiles pr
    where pr.id = (v_w ->> 'member_id')::uuid and pr.group_id = p_gid;
    if not found then raise exception 'ANGGOTA_TIDAK_VALID'; end if;

    insert into public.wages (group_id, batch_id, member_id, hours, amount, created_at)
    values (p_gid, v_batch.id, (v_w ->> 'member_id')::uuid, nullif(v_w ->> 'hours', '')::numeric, v_amt, p_at);
    insert into public.cash_ledger (group_id, entry_type, category, amount, ref_table, ref_id, note, created_by, entry_date)
    values (p_gid, 'out', 'upah', v_amt, 'production_batches', v_batch.id,
            'Upah ' || coalesce(nullif(v_name, ''), 'anggota'), p_uid, (p_at at time zone 'Asia/Jakarta')::date);
    v_total := v_total + v_amt;
  end loop;

  update public.production_batches set wage_total = wage_total + v_total where id = v_batch.id;
  if v_batch.qty_done > 0 then
    update public.finished_goods
    set unit_cost = round((v_batch.material_value + v_batch.extra_cost_total + v_batch.tool_cost_total
                           + v_batch.wage_total + v_total) / v_batch.qty_done, 0)
    where batch_id = v_batch.id;
  end if;
  return v_total;
end $$;

create or replace function public.pay_wages(p_batch_id uuid, p_wages jsonb)
returns numeric language plpgsql security definer set search_path = '' as $$
begin
  return public._pay_wages(public._require_pengurus(), auth.uid(), p_batch_id, p_wages, now());
end $$;

-- 5.5 PENJUALAN (FR27–FR28) -----------------------------------------------

create or replace function public._record_sale(
  p_gid uuid, p_uid uuid, p_fg_id uuid, p_qty int, p_unit_price numeric, p_buyer text, p_date date
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_fg    public.finished_goods%rowtype;
  v_price numeric;
  v_total numeric;
  v_id    uuid;
begin
  if p_qty is null or p_qty <= 0 then raise exception 'JUMLAH_TIDAK_VALID'; end if;
  select * into v_fg from public.finished_goods where id = p_fg_id and group_id = p_gid for update;
  if not found then raise exception 'PRODUK_TIDAK_DITEMUKAN'; end if;
  if v_fg.qty < p_qty then raise exception 'STOK_PRODUK_KURANG: tersedia % unit', v_fg.qty; end if;
  v_price := coalesce(p_unit_price, v_fg.sell_price);
  if v_price < 0 then raise exception 'HARGA_TIDAK_VALID'; end if;
  v_total := round(v_price * p_qty, 0);

  update public.finished_goods set qty = qty - p_qty where id = v_fg.id;
  insert into public.sales (group_id, finished_good_id, qty, unit_price, unit_cost, total, buyer_name, sold_at, created_by)
  values (p_gid, v_fg.id, p_qty, v_price, v_fg.unit_cost, v_total, nullif(trim(p_buyer), ''), p_date, p_uid)
  returning id into v_id;
  if v_total > 0 then
    insert into public.cash_ledger (group_id, entry_type, category, amount, ref_table, ref_id, note, created_by, entry_date)
    values (p_gid, 'in', 'penjualan', v_total, 'sales', v_id, 'Jual ' || p_qty || 'x ' || v_fg.name, p_uid, p_date);
  end if;
  return jsonb_build_object('sale_id', v_id, 'total', v_total, 'sisa_stok', v_fg.qty - p_qty);
end $$;

create or replace function public.record_sale(
  p_finished_good_id uuid, p_qty int, p_unit_price numeric default null,
  p_buyer text default null, p_sold_at date default public.today_wib()
) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  return public._record_sale(public._require_pengurus(), auth.uid(), p_finished_good_id, p_qty,
                             p_unit_price, p_buyer, coalesce(p_sold_at, public.today_wib()));
end $$;

-- 5.6 LAPORAN (FR30, FR32) -----------------------------------------------

create or replace function public.report_profit_loss(p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_gid   uuid := public._require_pengurus();
  v_rev   numeric; v_cogs numeric; v_units bigint;
  v_cat   jsonb;   v_in numeric; v_out numeric; v_bal numeric;
begin
  select coalesce(sum(s.total), 0), coalesce(sum(s.qty * s.unit_cost), 0), coalesce(sum(s.qty), 0)
  into v_rev, v_cogs, v_units
  from public.sales s where s.group_id = v_gid and s.sold_at between p_from and p_to;

  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) into v_cat from (
    select l.entry_type || ':' || l.category as k, sum(l.amount) as v
    from public.cash_ledger l
    where l.group_id = v_gid and l.entry_date between p_from and p_to
    group by l.entry_type, l.category) t;

  select coalesce(sum(amount) filter (where entry_type = 'in'), 0),
         coalesce(sum(amount) filter (where entry_type = 'out'), 0)
  into v_in, v_out
  from public.cash_ledger where group_id = v_gid and entry_date between p_from and p_to;

  select coalesce(sum(case entry_type when 'in' then amount else -amount end), 0) into v_bal
  from public.cash_ledger where group_id = v_gid;

  return jsonb_build_object(
    'dari', p_from, 'sampai', p_to,
    'pendapatan', v_rev, 'modal_terjual', v_cogs, 'laba', v_rev - v_cogs, 'unit_terjual', v_units,
    'kas_masuk', v_in, 'kas_keluar', v_out, 'kas_per_kategori', v_cat, 'saldo_kas', v_bal);
end $$;

create or replace function public.report_impact(p_months int default 6)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_gid  uuid := public._require_member();
  v_res  jsonb;
begin
  with dep as (
    select d.id, d.total, d.resident_id, (d.decided_at at time zone 'Asia/Jakarta')::date as tgl
    from public.deposits d where d.group_id = v_gid and d.status = 'approved'
  ),
  items as (
    select di.item_type, di.weight_kg, dep.tgl
    from public.deposit_items di join dep on dep.id = di.deposit_id
    where di.is_eligible
  ),
  months as (
    select to_char(m, 'YYYY-MM') as bulan, m::date as awal, (m + interval '1 month')::date as akhir
    from generate_series(date_trunc('month', public.today_wib()::timestamp) - make_interval(months => greatest(p_months, 1) - 1),
                         date_trunc('month', public.today_wib()::timestamp), interval '1 month') m
  )
  select jsonb_build_object(
    'total_kg',          (select coalesce(sum(weight_kg), 0) from items),
    'kg_per_jenis',      (select coalesce(jsonb_object_agg(item_type, kg), '{}'::jsonb)
                          from (select item_type, sum(weight_kg) kg from items group by item_type) t),
    'rupiah_ke_warga',   (select coalesce(sum(total), 0) from dep),
    'jumlah_warga',      (select count(distinct resident_id) from dep),
    'produk_dibuat',     (select coalesce(sum(qty_done), 0) from public.production_batches
                          where group_id = v_gid and status = 'done'),
    'produk_terjual',    (select coalesce(sum(qty), 0) from public.sales where group_id = v_gid),
    'pendapatan',        (select coalesce(sum(total), 0) from public.sales where group_id = v_gid),
    'laba',              (select coalesce(sum(total - qty * unit_cost), 0) from public.sales where group_id = v_gid),
    'upah_anggota',      (select coalesce(sum(amount), 0) from public.wages where group_id = v_gid),
    'tren_bulanan',      (select jsonb_agg(jsonb_build_object(
                             'bulan', mo.bulan,
                             'kg', (select coalesce(sum(i.weight_kg), 0) from items i
                                    where i.tgl >= mo.awal and i.tgl < mo.akhir),
                             'rupiah_warga', (select coalesce(sum(d.total), 0) from dep d
                                              where d.tgl >= mo.awal and d.tgl < mo.akhir),
                             'pendapatan', (select coalesce(sum(s.total), 0) from public.sales s
                                            where s.group_id = v_gid and s.sold_at >= mo.awal and s.sold_at < mo.akhir),
                             'laba', (select coalesce(sum(s.total - s.qty * s.unit_cost), 0) from public.sales s
                                      where s.group_id = v_gid and s.sold_at >= mo.awal and s.sold_at < mo.akhir))
                           order by mo.bulan) from months mo)
  ) into v_res;
  return v_res;
end $$;

-- 5.7 KUOTA AI (FR33) -----------------------------------------------------

-- Panggil SEBELUM memanggil Gemini. Gagal dengan 'KUOTA_HABIS' bila jatah hari ini habis.
create or replace function public.consume_ai_quota(p_fn text, p_model text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_gid   uuid := public._require_member();
  v_quota int;
  v_used  int;
  v_id    bigint;
begin
  if p_fn not in ('scan', 'idea', 'guide') then raise exception 'FUNGSI_AI_TIDAK_VALID'; end if;
  perform pg_advisory_xact_lock(hashtext(v_gid::text || ':' || p_fn));
  select case p_fn when 'scan' then g.quota_scan_daily else g.quota_idea_daily end into v_quota
  from public.groups g where g.id = v_gid;
  select count(*) into v_used from public.ai_usage
  where group_id = v_gid and fn = p_fn and usage_date = public.today_wib();
  if v_used >= v_quota then
    raise exception 'KUOTA_HABIS: kuota % hari ini (%) sudah terpakai', p_fn, v_quota;
  end if;
  insert into public.ai_usage (group_id, fn, model) values (v_gid, p_fn, p_model) returning id into v_id;
  return v_id;
end $$;

-- Panggil SETELAH Gemini menjawab (atau gagal) untuk mencatat token
create or replace function public.finish_ai_usage(p_usage_id bigint, p_tokens_in int, p_tokens_out int, p_ok boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_gid uuid := public._require_member();
begin
  update public.ai_usage
  set tokens_in = coalesce(p_tokens_in, 0), tokens_out = coalesce(p_tokens_out, 0), ok = p_ok
  where id = p_usage_id and group_id = v_gid;
end $$;

create or replace function public.ai_quota_status()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_gid uuid := public._require_member(); v_res jsonb;
begin
  select jsonb_build_object(
    'scan_quota', g.quota_scan_daily, 'idea_quota', g.quota_idea_daily,
    'scan_used',  (select count(*) from public.ai_usage u where u.group_id = v_gid and u.fn = 'scan'  and u.usage_date = public.today_wib()),
    'idea_used',  (select count(*) from public.ai_usage u where u.group_id = v_gid and u.fn = 'idea'  and u.usage_date = public.today_wib()),
    'guide_used', (select count(*) from public.ai_usage u where u.group_id = v_gid and u.fn = 'guide' and u.usage_date = public.today_wib()))
  into v_res from public.groups g where g.id = v_gid;
  return v_res;
end $$;

-- 5.8 ADMIN PLATFORM (FR02, FR36, FR37) -----------------------------------

create or replace function public.admin_list_groups()
returns table (
  id uuid, name text, address text, status text, activated_at timestamptz, created_at timestamptz,
  pengurus_email text, members bigint, quota_scan int, quota_idea int,
  ai_calls_today bigint, ai_calls_30d bigint, tokens_in_30d bigint, tokens_out_30d bigint
) language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._require_admin();
  return query
  select g.id, g.name, g.address, g.status, g.activated_at, g.created_at,
         (select u.email::text from public.profiles p join auth.users u on u.id = p.id
          where p.group_id = g.id and p.role = 'pengurus' order by p.created_at limit 1),
         (select count(*) from public.profiles p where p.group_id = g.id),
         g.quota_scan_daily, g.quota_idea_daily,
         (select count(*) from public.ai_usage a where a.group_id = g.id and a.usage_date = public.today_wib()),
         (select count(*) from public.ai_usage a where a.group_id = g.id and a.usage_date > public.today_wib() - 30),
         (select coalesce(sum(a.tokens_in), 0)::bigint from public.ai_usage a
          where a.group_id = g.id and a.usage_date > public.today_wib() - 30),
         (select coalesce(sum(a.tokens_out), 0)::bigint from public.ai_usage a
          where a.group_id = g.id and a.usage_date > public.today_wib() - 30)
  from public.groups g
  order by g.created_at desc;
end $$;

create or replace function public.admin_set_group_status(p_group_id uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_admin();
  if p_status not in ('pending', 'active', 'inactive') then raise exception 'STATUS_TIDAK_VALID'; end if;
  update public.groups
  set status = p_status,
      activated_at = case when p_status = 'active' then coalesce(activated_at, now()) else activated_at end
  where id = p_group_id;
  if not found then raise exception 'KELOMPOK_TIDAK_DITEMUKAN'; end if;
end $$;

create or replace function public.admin_set_quota(p_group_id uuid, p_scan int, p_idea int)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_admin();
  update public.groups set quota_scan_daily = p_scan, quota_idea_daily = p_idea where id = p_group_id;
  if not found then raise exception 'KELOMPOK_TIDAK_DITEMUKAN'; end if;
end $$;


-- ---------------------------------------------------------------------
-- 6. HAK AKSES (GRANT) — eksplisit, sesuai aturan Supabase terbaru
-- ---------------------------------------------------------------------

-- Tabel: cabut semua dulu, lalu buka seperlunya. RLS tetap menyaring baris.
revoke all on all tables in schema public from anon, authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant select on all tables in schema public to authenticated;

grant insert (name, phone)                         on public.residents      to authenticated;
grant update (name, phone)                         on public.residents      to authenticated;
grant insert (item_type, price_per_kg, is_active)  on public.price_table    to authenticated;
grant update (price_per_kg, is_active)             on public.price_table    to authenticated;
grant update (name, address, wage_per_hour, default_margin) on public.groups to authenticated;
grant update (full_name, role, is_active)          on public.profiles       to authenticated;
grant update (is_archived)                         on public.ideas          to authenticated;
grant update (name, sell_price, photo_path)        on public.finished_goods to authenticated;
grant insert                                       on public.ai_cache       to authenticated;

-- Fungsi: tutup semua, lalu buka yang memang API
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.today_wib(), public.my_group_id(), public.my_any_group_id(), public.my_role(),
  public.is_admin(), public.is_pengurus()
to authenticated, service_role;

grant execute on function
  public.create_deposit(uuid, jsonb, text, text, jsonb),
  public.approve_deposit(uuid, boolean),
  public.cancel_deposit(uuid),
  public.withdraw_balance(uuid, numeric, text),
  public.add_cash_entry(text, text, numeric, text, date),
  public.reverse_cash_entry(uuid, text),
  public.create_idea(jsonb),
  public.create_idea_from_template(uuid),
  public.update_idea_pricing(uuid, jsonb, numeric, numeric),
  public.save_idea_guide(uuid, jsonb),
  public.start_batch(uuid, int, uuid[]),
  public.cancel_batch(uuid),
  public.finish_batch(uuid, int, int, text),
  public.pay_wages(uuid, jsonb),
  public.record_sale(uuid, int, numeric, text, date),
  public.report_profit_loss(date, date),
  public.report_impact(int),
  public.consume_ai_quota(text, text),
  public.finish_ai_usage(bigint, int, int, boolean),
  public.ai_quota_status(),
  public.admin_list_groups(),
  public.admin_set_group_status(uuid, text),
  public.admin_set_quota(uuid, int, int)
to authenticated;


-- ---------------------------------------------------------------------
-- 7. STORAGE: bucket privat untuk foto (akses lewat signed URL, NFR06)
--    Path wajib: <group_id>/<folder>/<nama-file>.jpg
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy photos_select_own_group on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select public.my_group_id())::text);
create policy photos_insert_own_group on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select public.my_group_id())::text);


-- ---------------------------------------------------------------------
-- 8. DATA AWAL: template ide kerajinan (FR23). Tambah sampai 20–30 ide.
--    materials & extras = kebutuhan per 1 unit produk.
-- ---------------------------------------------------------------------
insert into public.idea_templates (title, description, materials, tools, extras, tool_cost, time_hours, difficulty) values
('Pouch kosmetik kain perca', 'Pouch beresleting dari potongan kain perca yang dijahit tambal sulam.',
 '[{"item_type":"Kain perca","kg":0.25}]', '["Gunting kain","Jarum & mesin jahit","Penggaris"]',
 '[{"name":"Ritsleting 20 cm","price":2000},{"name":"Benang jahit","price":500}]', 500, 0.6, 'mudah'),
('Tote bag lipat perca', 'Tas belanja lipat dari perca, pengganti kantong plastik.',
 '[{"item_type":"Kain perca","kg":0.5}]', '["Gunting kain","Mesin jahit"]',
 '[{"name":"Benang jahit","price":1000},{"name":"Tali katun 1 m","price":2000}]', 700, 1.5, 'sedang'),
('Cempal dan lap dapur perca', 'Alas panci/cempal tebal berlapis dari perca.',
 '[{"item_type":"Kain perca","kg":0.15}]', '["Gunting kain","Jarum jahit"]',
 '[{"name":"Benang jahit","price":300}]', 300, 0.3, 'mudah'),
('Keset kaki perca', 'Keset anyam/ikat dari sobekan kain perca.',
 '[{"item_type":"Kain perca","kg":0.8}]', '["Gunting kain","Jarum besar"]',
 '[{"name":"Benang kasur","price":500}]', 500, 2.0, 'mudah'),
('Pot tanaman botol PET', 'Pot gantung dari botol plastik yang dicat.',
 '[{"item_type":"Plastik PET","kg":0.05}]', '["Cutter","Kuas"]',
 '[{"name":"Cat akrilik","price":1500},{"name":"Tali rami 1 m","price":1000}]', 300, 0.5, 'mudah'),
('Tempat pensil botol PET', 'Dua dasar botol PET disambung ritsleting.',
 '[{"item_type":"Plastik PET","kg":0.04}]', '["Cutter","Jarum jahit"]',
 '[{"name":"Ritsleting 15 cm","price":1500},{"name":"Benang","price":300}]', 300, 0.7, 'mudah'),
('Pot gantung HDPE', 'Botol sampo/deterjen (HDPE) dipotong jadi pot gantung.',
 '[{"item_type":"Plastik HDPE","kg":0.06}]', '["Cutter","Bor tangan kecil"]',
 '[{"name":"Tali gantung","price":1000}]', 300, 0.5, 'mudah'),
('Kotak penyimpanan kardus berlapis kain', 'Kotak serbaguna kardus tebal dilapisi perca.',
 '[{"item_type":"Kardus","kg":0.4},{"item_type":"Kain perca","kg":0.1}]', '["Cutter","Penggaris","Kuas lem"]',
 '[{"name":"Lem putih","price":2000}]', 500, 1.0, 'mudah'),
('Organizer meja kardus', 'Rak kecil alat tulis dari kardus dan kertas bekas.',
 '[{"item_type":"Kardus","kg":0.3},{"item_type":"Kertas","kg":0.05}]', '["Cutter","Penggaris"]',
 '[{"name":"Lem","price":1500},{"name":"Cat","price":2000}]', 500, 1.0, 'mudah'),
('Bingkai foto kertas gulung', 'Bingkai dari gulungan kertas koran/majalah.',
 '[{"item_type":"Kertas","kg":0.15},{"item_type":"Kardus","kg":0.1}]', '["Gunting","Lidi/tusuk sate"]',
 '[{"name":"Lem","price":1000},{"name":"Pernis","price":1500}]', 300, 1.0, 'mudah'),
('Lampu hias botol kaca', 'Botol kaca bersih diisi lampu tumbler LED.',
 '[{"item_type":"Kaca","kg":0.4}]', '["Sarung tangan","Lap"]',
 '[{"name":"Lampu tumbler LED","price":8000}]', 300, 0.5, 'sedang'),
('Celengan kaleng berlapis kain', 'Kaleng bekas dilapisi perca, diberi lubang koin.',
 '[{"item_type":"Logam","kg":0.08},{"item_type":"Kain perca","kg":0.05}]', '["Gunting","Pembuka kaleng","Sarung tangan"]',
 '[{"name":"Lem","price":1000}]', 300, 0.5, 'mudah'),
('Gantungan kunci kaleng', 'Potongan kaleng aluminium dibentuk dan dihias.',
 '[{"item_type":"Logam","kg":0.03}]', '["Gunting seng","Tang","Sarung tangan"]',
 '[{"name":"Ring gantungan","price":500}]', 300, 0.4, 'sedang');


-- ---------------------------------------------------------------------
-- 9. DATA DEMO (opsional, untuk video & latihan demo)
--    Hanya bisa dijalankan dari SQL Editor (tidak bisa dari aplikasi).
--    Contoh: select public.demo_seed('<group_id kelompok demo>');
-- ---------------------------------------------------------------------
create or replace function public.demo_seed(p_group_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid    uuid;
  v_tmp    uuid;
  v_res    uuid[] := '{}';
  v_names  text[] := array['Bu Siti', 'Pak Joko', 'Bu Wati', 'Pak Darto', 'Bu Yanti', 'Mbak Rina'];
  v_types  text[] := array['Kain perca', 'Kardus', 'Plastik PET', 'Kertas', 'Kain perca', 'Plastik HDPE', 'Kaca', 'Logam'];
  v_dep    jsonb;
  v_at     timestamptz;
  v_idea   uuid[];
  v_batch  uuid;
  v_fg     jsonb;
  i        int;
  v_n_dep  int := 0;
begin
  select p.id into v_uid from public.profiles p
  where p.group_id = p_group_id and p.role = 'pengurus' order by p.created_at limit 1;
  if v_uid is null then raise exception 'Kelompok tidak punya pengurus'; end if;

  update public.groups set status = 'active', activated_at = coalesce(activated_at, now()) where id = p_group_id;

  insert into public.cash_ledger (group_id, entry_type, category, amount, note, entry_date, created_by)
  values (p_group_id, 'in', 'modal_awal', 500000, 'Kas awal PKK', public.today_wib() - 100, v_uid);

  for i in 1 .. array_length(v_names, 1) loop
    insert into public.residents (group_id, name, phone)
    values (p_group_id, v_names[i], '0812000000' || i)
    returning id into v_tmp;
    v_res := v_res || v_tmp;
  end loop;

  -- 24 setoran tersebar ±100 hari terakhir
  for i in 1 .. 24 loop
    v_at := now() - make_interval(days => 100 - i * 4);
    insert into public.deposits (group_id, resident_id, status, created_by, created_at)
    values (p_group_id, v_res[1 + (i % 6)], 'draft', v_uid, v_at)
    returning jsonb_build_object('id', id) into v_dep;

    insert into public.deposit_items (deposit_id, group_id, item_type, condition, is_eligible, ai_suggested, weight_kg, price_per_kg, subtotal)
    select (v_dep ->> 'id')::uuid, p_group_id, t.item_type, 'bersih', true, true, t.kg, pt.price_per_kg, round(t.kg * pt.price_per_kg, 0)
    from (values (v_types[1 + (i % 8)], (1.5 + (i % 5))::numeric),
                 (v_types[1 + ((i + 3) % 8)], (0.5 + (i % 3))::numeric)) as t(item_type, kg)
    join public.price_table pt on pt.group_id = p_group_id and pt.item_type = t.item_type;

    update public.deposits d set total = (select sum(subtotal) from public.deposit_items where deposit_id = d.id)
    where d.id = (v_dep ->> 'id')::uuid;
    perform public._approve_deposit((v_dep ->> 'id')::uuid, p_group_id, (i % 3 = 0), v_uid, v_at);
    v_n_dep := v_n_dep + 1;
  end loop;

  -- 3 ide dari template (costing dihitung dari stok)
  select array_agg(x.id) into v_idea from (
    select t.id from public.idea_templates t
    where t.title in ('Pouch kosmetik kain perca', 'Kotak penyimpanan kardus berlapis kain', 'Pot tanaman botol PET')
  ) x;
  for i in 1 .. coalesce(array_length(v_idea, 1), 0) loop
    perform set_config('request.jwt.claim.sub', v_uid::text, true);  -- jalankan sebagai pengurus
    v_idea[i] := public.create_idea_from_template(v_idea[i]);
  end loop;

  -- 3 batch produksi + penjualan bertahap
  for i in 1 .. coalesce(array_length(v_idea, 1), 0) loop
    v_at := now() - make_interval(days => 60 - i * 15);
    v_batch := public._start_batch(p_group_id, v_uid, v_idea[i], 8, array[v_uid], v_at);
    v_fg := public._finish_batch(p_group_id, v_batch, 7, 1, null, v_at + interval '2 days');
    perform public._pay_wages(p_group_id, v_uid, v_batch,
      jsonb_build_array(jsonb_build_object('member_id', v_uid, 'hours', 6, 'amount', 60000)), v_at + interval '2 days');
    perform public._record_sale(p_group_id, v_uid, (v_fg ->> 'finished_good_id')::uuid, 3, null, 'Bazar kelurahan',
                                ((v_at + interval '5 days') at time zone 'Asia/Jakarta')::date);
    perform public._record_sale(p_group_id, v_uid, (v_fg ->> 'finished_good_id')::uuid, 2, null, 'Pesanan WA',
                                ((v_at + interval '9 days') at time zone 'Asia/Jakarta')::date);
  end loop;

  return jsonb_build_object('residents', array_length(v_res, 1), 'deposits', v_n_dep,
                            'ideas', coalesce(array_length(v_idea, 1), 0));
end $$;

revoke execute on function public.demo_seed(uuid) from public, anon, authenticated;

-- Selesai ✔
