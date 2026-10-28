import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
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

type ItemRingkas = { name: string; qty: number; subtotal: number };

export function pesanWaBaru(o: {
  code: string;
  buyer_name: string;
  buyer_phone: string;
  items: ItemRingkas[];
  shipping_method: "ambil" | "kurir";
  courier_name?: string | null;
  shipping_cost: number;
  address?: string | null;
  total: number;
  url: string;
}) {
  const baris = o.items.map((i) => `• ${i.qty}× ${i.name} — ${rupiah(i.subtotal)}`).join("\n");
  const kirim =
    o.shipping_method === "kurir"
      ? `Kurir ${o.courier_name ?? ""} (${rupiah(o.shipping_cost)})\nAlamat: ${o.address ?? "-"}`
      : "Ambil di posko";
  return [
    `*Pesanan baru KriyaPKK*`,
    `Kode: ${o.code}`,
    `Pembeli: ${o.buyer_name} (${formatHp(o.buyer_phone)})`,
    ``,
    baris,
    ``,
    `Pengiriman: ${kirim}`,
    `*Total: ${rupiah(o.total)}*`,
    ``,
    `Status: menunggu pembayaran. Stok sudah disisihkan selama 60 menit.`,
    `Kelola pesanan: ${o.url}/pesanan`,
  ].join("\n");
}

export function pesanWaLunas(o: { code: string; buyer_name: string; total: number; metode: string; ambil: boolean; url: string }) {
  return [
    `*Pesanan ${o.code} LUNAS*`,
    `Pembeli: ${o.buyer_name}`,
    `Dibayar: ${rupiah(o.total)} lewat ${o.metode.replace(/_/g, " ").toUpperCase()}`,
    ``,
    o.ambil ? `Siapkan barangnya, pembeli akan mengambil di posko.` : `Siapkan barang dan pesan kurirnya.`,
    `Ubah status: ${o.url}/pesanan`,
  ].join("\n");
}

// Terapkan status dari Midtrans ke database. Dipakai webhook & halaman lacak (sinkron manual).
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
    const r = data as { already: boolean; total: number; buyer_name: string; shipping_method: string; posko: { whatsapp: string | null } };
    if (!r.already) {
      await kirimWa(
        r.posko.whatsapp,
        pesanWaLunas({ code: s.order_id, buyer_name: r.buyer_name, total: Number(r.total), metode: s.payment_type ?? "midtrans", ambil: r.shipping_method === "ambil", url }),
      );
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

// Halaman lacak memanggil ini supaya status tetap benar walau webhook belum sampai
// (mis. saat uji di localhost yang tidak bisa dihubungi Midtrans).
export async function sinkronkanDenganMidtrans(code: string, url: string) {
  try {
    const s = await cekStatus(code);
    if (s) await terapkanStatusMidtrans(s, url);
  } catch (e) {
    console.warn("[midtrans] sinkron gagal:", e);
  }
}

export type PesananPublik = {
  id: string;
  code: string;
  access_token: string;
  status: string;
  buyer_name: string;
  buyer_phone: string;
  shipping_method: "ambil" | "kurir";
  address: string | null;
  courier_name: string | null;
  shipping_eta: string | null;
  shipping_cost: number;
  tracking_number: string | null;
  subtotal: number;
  total: number;
  payment_type: string | null;
  midtrans_token: string | null;
  created_at: string;
  paid_at: string | null;
  posko: { name: string; slug: string; address: string | null; city: string | null; latitude: number | null; longitude: number | null };
  items: { name: string; qty: number; unit_price: number; subtotal: number; finished_good_id: string }[];
};

export async function ambilPesananPublik(code: string, token: string): Promise<PesananPublik | null> {
  if (!code || !token) return null;
  const db = createAdminClient();
  const { data } = await db
    .from("orders")
    .select(
      "id, code, access_token, status, buyer_name, buyer_phone, shipping_method, address, courier_name, shipping_eta, shipping_cost, tracking_number, subtotal, total, payment_type, midtrans_token, created_at, paid_at, posko:groups(name, slug, address, city, latitude, longitude), items:order_items(name, qty, unit_price, subtotal, finished_good_id)",
    )
    .eq("code", code)
    .eq("access_token", token)
    .maybeSingle();
  return (data as unknown as PesananPublik) ?? null;
}
