-- =====================================================================
--  KriyaPKK — Ongkir manual: ukuran kemasan produk (untuk berat volumetrik)
--  Jalankan SETELAH 0002_marketplace.sql. Aman dijalankan ulang.
-- =====================================================================

-- 1. Ukuran kemasan (cm), opsional. Berat volumetrik = P × L × T / 6000.
alter table public.finished_goods
  add column if not exists length_cm smallint,
  add column if not exists width_cm  smallint,
  add column if not exists height_cm smallint;

do $$ begin
  alter table public.finished_goods add constraint fg_dimensi_check check (
    (length_cm is null or length_cm between 1 and 300) and
    (width_cm  is null or width_cm  between 1 and 300) and
    (height_cm is null or height_cm between 1 and 300));
exception when duplicate_object then null; end $$;

grant update (length_cm, width_cm, height_cm) on public.finished_goods to authenticated;

-- 2. Simpan produk: kini juga ukuran kemasan ("length_cm", "width_cm", "height_cm"; null = kosongkan)
create or replace function public.save_product(p_id uuid, p jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_gid uuid := public._require_pengurus();
  v_id uuid;
  v_mats text[];
  v_l smallint := nullif(p ->> 'length_cm', '')::smallint;
  v_w smallint := nullif(p ->> 'width_cm', '')::smallint;
  v_h smallint := nullif(p ->> 'height_cm', '')::smallint;
begin
  if p ? 'waste_materials' then
    select coalesce(array_agg(distinct trim(x)) filter (where trim(x) <> ''), '{}')
      into v_mats from jsonb_array_elements_text(coalesce(p -> 'waste_materials', '[]'::jsonb)) x;
  end if;
  if p ? 'name' and length(trim(coalesce(p ->> 'name', ''))) < 2 then raise exception 'NAMA_PRODUK_WAJIB'; end if;
  if coalesce((p ->> 'sell_price')::numeric, 0) < 0 or coalesce((p ->> 'qty')::int, 0) < 0 then
    raise exception 'ANGKA_TIDAK_VALID';
  end if;

  if p_id is null then
    insert into public.finished_goods (group_id, name, category, description, waste_materials, weight_grams,
                                       length_cm, width_cm, height_cm,
                                       sell_price, unit_cost, qty, photo_path, is_listed)
    values (v_gid, trim(p ->> 'name'), coalesce(p ->> 'category', 'kerajinan'), nullif(trim(p ->> 'description'), ''),
            coalesce(v_mats, '{}'), coalesce((p ->> 'weight_grams')::int, 250),
            v_l, v_w, v_h,
            coalesce((p ->> 'sell_price')::numeric, 0), coalesce((p ->> 'unit_cost')::numeric, 0),
            coalesce((p ->> 'qty')::int, 0), nullif(p ->> 'photo_path', ''), coalesce((p ->> 'is_listed')::boolean, true))
    returning id into v_id;
  else
    update public.finished_goods set
      name            = coalesce(nullif(trim(p ->> 'name'), ''), name),
      category        = coalesce(p ->> 'category', category),
      description     = case when p ? 'description' then nullif(trim(p ->> 'description'), '') else description end,
      waste_materials = coalesce(v_mats, waste_materials),
      weight_grams    = coalesce((p ->> 'weight_grams')::int, weight_grams),
      length_cm       = case when p ? 'length_cm' then v_l else length_cm end,
      width_cm        = case when p ? 'width_cm'  then v_w else width_cm end,
      height_cm       = case when p ? 'height_cm' then v_h else height_cm end,
      sell_price      = coalesce((p ->> 'sell_price')::numeric, sell_price),
      unit_cost       = coalesce((p ->> 'unit_cost')::numeric, unit_cost),
      qty             = coalesce((p ->> 'qty')::int, qty),
      photo_path      = case when p ? 'photo_path' then nullif(p ->> 'photo_path', '') else photo_path end,
      is_listed       = coalesce((p ->> 'is_listed')::boolean, is_listed)
    where id = p_id and group_id = v_gid
    returning id into v_id;
    if v_id is null then raise exception 'PRODUK_TIDAK_DITEMUKAN'; end if;
  end if;
  return v_id;
end $$;

-- 3. Isi keranjang + ukuran kemasan (kolom hasil berubah → fungsi dibuat ulang)
drop function if exists public.katalog_items(uuid[]);
create function public.katalog_items(p_ids uuid[])
returns table (id uuid, name text, sell_price numeric, qty int, photo_path text,
               weight_grams int, length_cm smallint, width_cm smallint, height_cm smallint,
               posko_slug text, posko_name text)
language sql stable security definer set search_path = '' as $$
  select f.id, f.name, f.sell_price, f.qty, f.photo_path, f.weight_grams, f.length_cm, f.width_cm, f.height_cm,
         g.slug, g.name
  from public.finished_goods f
  join public.groups g on g.id = f.group_id
  where f.id = any (p_ids) and f.is_listed and g.status = 'active' and g.shop_open
$$;

revoke execute on function public.katalog_items(uuid[]) from public, anon, authenticated;
grant execute on function public.katalog_items(uuid[]) to anon, authenticated, service_role;
revoke execute on function public.save_product(uuid, jsonb) from public, anon;
grant execute on function public.save_product(uuid, jsonb) to authenticated;
