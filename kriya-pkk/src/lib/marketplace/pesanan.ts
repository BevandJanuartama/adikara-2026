import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";
import { kirimWa } from "@/lib/marketplace/fonnte";
import { cekStatus, type StatusMidtrans } from "@/lib/marketplace/midtrans";
import { formatHp } from "@/lib/marketplace/wa";

// Alamat aplikasi untuk link di WhatsApp & callback Midtrans
export function appUrl(req?: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (env) return env;
  if (req) return new URL(req.url).origin;
  return "http://localhost:3000";
}

// Untuk Server Component (tanpa objek Request)
export async function appUrlDariHeader(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (env) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

type DetailLunas = {
  code: string;
  buyer_name: string;
  buyer_phone: string;
  shipping_method: "ambil" | "kurir";
  address: string | null;
  buyer_city: string | null;
  buyer_postal_code: string | null;
  courier_name: string | null;
  shipping_cost: number;
  total: number;
  note: string | null;
  items: { name: string; qty: number; subtotal: number }[];
  posko: { whatsapp: string | null } | null;
};

// Satu-satunya WhatsApp toko online: ke pengurus posko saat pesanan LUNAS (berisi semua yang perlu disiapkan)
export function pesanWaLunas(o: DetailLunas, metode: string, url: string) {
  const kurir = o.shipping_method === "kurir";
  return [
    `*Pesanan ${o.code} LUNAS*`,
    `Dibayar ${rupiah(o.total)} lewat ${metode.replace(/_/g, " ").toUpperCase()}`,
    ``,
    ...o.items.map((i) => `• ${i.qty}× ${i.name} — ${rupiah(i.subtotal)}`),
    ``,
    `Pembeli: ${o.buyer_name} (${formatHp(o.buyer_phone)})`,
    kurir
      ? `Kirim lewat *${o.courier_name ?? "ekspedisi"}* (ongkir ${rupiah(o.shipping_cost)})\nAlamat: ${[o.address, o.buyer_city, o.buyer_postal_code].filter(Boolean).join(", ")}`
      : `Diambil di posko`,
    o.note ? `Catatan: ${o.note}` : null,
    ``,
    kurir
      ? `Kemas & kirim lewat ekspedisi, lalu isi nomor resinya di aplikasi.`
      : `Siapkan barangnya, lalu tandai "Siap diambil" di aplikasi.`,
    `${url}/pesanan`,
  ]
    .filter((b) => b !== null)
    .join("\n");
}

// Terapkan status dari Midtrans ke database. Dipakai webhook, halaman pesanan pembeli, dan simulasi.
export async function terapkanStatusMidtrans(s: StatusMidtrans, url: string): Promise<string> {
  const db = createAdminClient();
  const ts = s.transaction_status ?? "";
  const lunas = ts === "settlement" || (ts === "capture" && (!s.fraud_status || s.fraud_status === "accept"));

  if (lunas) {
    const { data, error } = await db.rpc("mark_order_paid", {
      p_code: s.order_id,
      p_gross: Number(s.gross_amount),
      p_payment_type: s.payment_type ?? null,
      p_transaction_id: s.transaction_id ?? null,
    });
    if (error) throw new Error(error.message);
    // notifikasi ganda dari Midtrans tidak mengirim WhatsApp dua kali
    if (!(data as { already: boolean }).already) {
      const { data: o } = await db
        .from("orders")
        .select(
          "code, buyer_name, buyer_phone, shipping_method, address, buyer_city, buyer_postal_code, courier_name, shipping_cost, total, note, items:order_items(name, qty, subtotal), posko:groups(whatsapp)",
        )
        .eq("code", s.order_id)
        .maybeSingle();
      const d = o as unknown as DetailLunas | null;
      if (d) await kirimWa(d.posko?.whatsapp, pesanWaLunas(d, s.payment_type ?? "midtrans", url));
    }
    return "dibayar";
  }
  if (ts === "expire") {
    const { data } = await db.rpc("close_order", { p_code: s.order_id, p_status: "kedaluwarsa", p_midtrans_status: ts });
    return String(data ?? ts);
  }
  if (ts === "deny" || ts === "cancel" || ts === "failure") {
    const { data } = await db.rpc("close_order", { p_code: s.order_id, p_status: ts === "cancel" ? "batal" : "gagal", p_midtrans_status: ts });
    return String(data ?? ts);
  }
  await db.rpc("set_midtrans_status", { p_code: s.order_id, p_status: ts, p_payment_type: s.payment_type ?? null });
  return ts;
}

// Halaman pesanan memanggil ini supaya status tetap benar walau webhook belum sampai
// (mis. saat uji di localhost yang tidak bisa dihubungi Midtrans).
export async function sinkronkanDenganMidtrans(code: string, url: string) {
  try {
    const s = await cekStatus(code);
    if (s) await terapkanStatusMidtrans(s, url);
  } catch (e) {
    console.warn("[midtrans] sinkron gagal:", e);
  }
}

export type PoskoPesanan = {
  group_id: string;
  name: string;
  slug: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  whatsapp: string | null;
};

export type PesananSaya = {
  id: string;
  code: string;
  group_id: string;
  status: string;
  buyer_name: string;
  buyer_phone: string;
  shipping_method: "ambil" | "kurir";
  address: string | null;
  buyer_city: string | null;
  buyer_postal_code: string | null;
  courier_name: string | null;
  shipping_eta: string | null;
  shipping_cost: number;
  tracking_number: string | null;
  subtotal: number;
  total: number;
  note: string | null;
  payment_type: string | null;
  midtrans_token: string | null;
  created_at: string;
  paid_at: string | null;
  items: { name: string; qty: number; unit_price: number; subtotal: number; finished_good_id: string }[];
  posko: PoskoPesanan | null;
};

const KOLOM =
  "id, code, group_id, status, buyer_name, buyer_phone, shipping_method, address, buyer_city, buyer_postal_code, courier_name, shipping_eta, shipping_cost, tracking_number, subtotal, total, note, payment_type, midtrans_token, created_at, paid_at, items:order_items(name, qty, unit_price, subtotal, finished_good_id)";

// Pesanan milik pembeli yang login (RLS: buyer_id = auth.uid()), plus info poskonya
export async function ambilPesananSaya(userId: string, code?: string): Promise<PesananSaya[]> {
  const supabase = await createClient();
  let q = supabase.from("orders").select(KOLOM).eq("buyer_id", userId).order("created_at", { ascending: false }).limit(100);
  if (code) q = q.eq("code", code);
  const [{ data }, { data: posko }] = await Promise.all([q, supabase.rpc("posko_pesanan_saya")]);
  const peta = new Map(((posko ?? []) as PoskoPesanan[]).map((p) => [p.group_id, p]));
  return ((data ?? []) as unknown as Omit<PesananSaya, "posko">[]).map((o) => ({ ...o, posko: peta.get(o.group_id) ?? null }));
}
