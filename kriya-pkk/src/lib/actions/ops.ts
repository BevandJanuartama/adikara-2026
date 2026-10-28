"use server";

// Server Action untuk modul pengaturan, warga, ide, produksi, penjualan, dan kas.
// Semua perubahan uang/stok lewat RPC database (atomik + dicek perannya di database).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { parseDecimal } from "@/lib/format";
import { isKategori } from "@/lib/marketplace/kategori";
import { normalisasiWa } from "@/lib/marketplace/wa";

type FormState = { error?: string; message?: string } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => parseDecimal(str(fd, k));

async function rpc<T = unknown>(fn: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, args);
  return { data: data as T, error: error ? friendlyError(error.message) : null };
}

// ---------- Pengaturan (FR05–FR06) ----------
export async function updatePrice(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  const price = num(fd, "price_per_kg");
  if (price <= 0) return { error: "Harga harus lebih dari 0" };
  const supabase = await createClient();
  const { error } = await supabase.from("price_table")
    .update({ price_per_kg: price, is_active: fd.get("is_active") === "on" }).eq("id", id);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/pengaturan");
  return { message: "Tersimpan. Berlaku untuk setoran berikutnya." };
}

export async function addPriceType(_p: FormState, fd: FormData): Promise<FormState> {
  const item_type = str(fd, "item_type");
  const price = num(fd, "price_per_kg");
  if (!item_type || price <= 0) return { error: "Isi jenis dan harga" };
  const supabase = await createClient();
  const { error } = await supabase.from("price_table").insert({ item_type, price_per_kg: price });
  if (error) return { error: error.code === "23505" ? "Jenis sudah ada" : friendlyError(error.message) };
  revalidatePath("/pengaturan");
  return { message: "Jenis barang ditambahkan." };
}

export async function updateGroupSettings(_p: FormState, fd: FormData): Promise<FormState> {
  const me = await requireMe(["pengurus"]);
  const margin = num(fd, "margin_percent") / 100;
  if (margin < 0 || margin > 3) return { error: "Margin harus 0–300%" };
  const supabase = await createClient();
  const { error } = await supabase.from("groups")
    .update({ wage_per_hour: num(fd, "wage_per_hour"), default_margin: margin }).eq("id", me.group!.id);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/pengaturan");
  return { message: "Pengaturan disimpan." };
}

// ---------- Warga (FR13) ----------
export async function withdrawBalance(residentId: string, _p: FormState, fd: FormData): Promise<FormState> {
  const { data, error } = await rpc<number>("withdraw_balance", { p_resident_id: residentId, p_amount: num(fd, "amount") });
  if (error) return { error };
  revalidatePath("/warga");
  return { message: `Dicairkan. Sisa saldo Rp${Number(data).toLocaleString("id-ID")}` };
}

// ---------- Ide (FR20–FR23) ----------
export async function ideaFromTemplate(templateId: string, _p: FormState, _fd: FormData): Promise<FormState> {
  const { data, error } = await rpc<string>("create_idea_from_template", { p_template_id: templateId });
  if (error) return { error };
  redirect(`/ide/${data}`);
}

export async function updatePricing(ideaId: string, _p: FormState, fd: FormData): Promise<FormState> {
  const extras = JSON.parse(str(fd, "extras") || "[]");
  const sell = str(fd, "sell_price");
  const { error } = await rpc("update_idea_pricing", {
    p_idea_id: ideaId,
    p_extras: extras,
    p_margin: num(fd, "margin_percent") / 100,
    p_sell_price: sell ? parseDecimal(sell) : null,
  });
  if (error) return { error };
  revalidatePath(`/ide/${ideaId}`);
  return { message: "Harga disimpan." };
}

// ---------- Produksi (FR24–FR26) ----------
export async function startBatch(ideaId: string, _p: FormState, fd: FormData): Promise<FormState> {
  const members = fd.getAll("members").map(String);
  const { data, error } = await rpc<string>("start_batch", {
    p_idea_id: ideaId, p_qty: Math.floor(num(fd, "qty")), p_members: members,
  });
  if (error) return { error };
  revalidatePath("/stok");
  redirect(`/produksi/${data}`);
}

export async function finishBatch(batchId: string, _p: FormState, fd: FormData): Promise<FormState> {
  const { error } = await rpc("finish_batch", {
    p_batch_id: batchId, p_done: Math.floor(num(fd, "done")), p_failed: Math.floor(num(fd, "failed")),
    p_photo: str(fd, "photo_path") || null,
  });
  if (error) return { error };
  revalidatePath(`/produksi/${batchId}`);
  return { message: "Hasil produksi dicatat. Produk jadi bertambah." };
}

export async function payWages(batchId: string, _p: FormState, fd: FormData): Promise<FormState> {
  const wages = fd.getAll("member_id").map(String).map((id) => ({
    member_id: id, hours: num(fd, `hours_${id}`) || null, amount: num(fd, `amount_${id}`),
  }));
  const { error } = await rpc("pay_wages", { p_batch_id: batchId, p_wages: wages });
  if (error) return { error };
  revalidatePath(`/produksi/${batchId}`);
  return { message: "Upah dicatat di buku kas." };
}

export async function cancelBatch(batchId: string, _p: FormState, _fd: FormData): Promise<FormState> {
  const { error } = await rpc("cancel_batch", { p_batch_id: batchId });
  if (error) return { error };
  revalidatePath(`/produksi/${batchId}`);
  return { message: "Batch dibatalkan, bahan kembali ke stok." };
}

// ---------- Penjualan (FR27) ----------
export async function recordSale(fgId: string, _p: FormState, fd: FormData): Promise<FormState> {
  const price = str(fd, "unit_price");
  const { data, error } = await rpc<{ total: number; sisa_stok: number }>("record_sale", {
    p_finished_good_id: fgId,
    p_qty: Math.floor(num(fd, "qty")),
    p_unit_price: price ? parseDecimal(price) : null,
    p_buyer: str(fd, "buyer") || null,
  });
  if (error) return { error };
  revalidatePath("/produk");
  return { message: `Terjual Rp${Number(data.total).toLocaleString("id-ID")}. Sisa ${data.sisa_stok} unit.` };
}

// ---------- Kas (FR29) ----------
export async function addCash(_p: FormState, fd: FormData): Promise<FormState> {
  const { error } = await rpc("add_cash_entry", {
    p_entry_type: str(fd, "entry_type"), p_category: str(fd, "category"),
    p_amount: num(fd, "amount"), p_note: str(fd, "note") || null,
  });
  if (error) return { error };
  revalidatePath("/kas");
  return { message: "Entri kas ditambahkan." };
}

export async function reverseCash(entryId: string, _p: FormState, _fd: FormData): Promise<FormState> {
  const { error } = await rpc("reverse_cash_entry", { p_entry_id: entryId, p_note: "Koreksi entri" });
  if (error) return { error };
  revalidatePath("/kas");
  return { message: "Entri pembalik dibuat." };
}


// ---------- Toko online: profil posko ----------
export async function updateShopProfile(_p: FormState, fd: FormData): Promise<FormState> {
  const me = await requireMe(["pengurus"]);
  const name = str(fd, "name");
  const whatsapp = normalisasiWa(str(fd, "whatsapp"));
  const postal = str(fd, "postal_code");
  const lat = str(fd, "latitude");
  const lng = str(fd, "longitude");
  if (name.length < 3) return { error: "Nama posko minimal 3 huruf" };
  if (!whatsapp) return { error: "Nomor WhatsApp belum benar (contoh 0812xxxxxxx)" };
  if (postal && !/^\d{5}$/.test(postal)) return { error: "Kode pos harus 5 angka" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({
      name,
      address: str(fd, "address") || null,
      city: str(fd, "city") || null,
      postal_code: postal || null,
      whatsapp,
      latitude: lat ? Number(lat) : null,
      longitude: lng ? Number(lng) : null,
      shop_open: fd.get("shop_open") === "on",
    })
    .eq("id", me.group!.id);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/pengaturan");
  return { message: "Profil posko disimpan." };
}

// ---------- Toko online: produk ----------
export async function saveProduct(id: string | null, _p: FormState, fd: FormData): Promise<FormState> {
  const category = str(fd, "category");
  if (!isKategori(category)) return { error: "Pilih kategori" };
  const payload = {
    name: str(fd, "name"),
    category,
    description: str(fd, "description"),
    waste_materials: str(fd, "waste_materials").split(",").map((s) => s.trim()).filter(Boolean),
    weight_grams: Math.max(1, Math.round(num(fd, "weight_grams"))),
    sell_price: Math.round(num(fd, "sell_price")),
    unit_cost: Math.round(num(fd, "unit_cost")),
    qty: Math.max(0, Math.floor(num(fd, "qty"))),
    photo_path: str(fd, "photo_path"),
    is_listed: fd.get("is_listed") === "on",
  };
  if (payload.name.length < 2) return { error: "Nama produk wajib diisi" };
  if (payload.sell_price <= 0) return { error: "Harga jual harus lebih dari 0" };
  const { error } = await rpc("save_product", { p_id: id, p: payload });
  if (error) return { error };
  revalidatePath("/produk");
  return { message: id ? "Produk diperbarui." : "Produk ditambahkan." };
}

// ---------- Toko online: status pesanan ----------
export async function setOrderStatus(orderId: string, status: string, _p: FormState, fd: FormData): Promise<FormState> {
  const { error } = await rpc("set_order_status", {
    p_order_id: orderId,
    p_status: status,
    p_tracking: str(fd, "tracking_number") || null,
  });
  if (error) return { error };
  revalidatePath("/pesanan");
  return { message: "Status pesanan diperbarui." };
}
