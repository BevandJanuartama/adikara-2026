import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

// Kunci sandbox Midtrans berawalan "SB-Mid-…", jadi mode sandbox/produksi terbaca otomatis.
const serverKey = () => {
  const k = process.env.MIDTRANS_SERVER_KEY;
  if (!k) throw new Error("MIDTRANS_SERVER_KEY belum diisi di .env.local");
  return k;
};
const isProduction = () => !serverKey().startsWith("SB-");
const snapBase = () => (isProduction() ? "https://app.midtrans.com/snap/v1" : "https://app.sandbox.midtrans.com/snap/v1");
const coreBase = () => (isProduction() ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com");
const authHeader = () => "Basic " + Buffer.from(serverKey() + ":").toString("base64");

export type ItemMidtrans = { id: string; name: string; price: number; quantity: number };

// Hanya QRIS dan Virtual Account (sesuai kebutuhan KriyaPKK)
export const METODE_BAYAR = ["other_qris", "bca_va", "bni_va", "bri_va", "permata_va", "cimb_va", "echannel", "other_va"];

export async function buatTransaksiSnap(p: {
  orderId: string;
  total: number;
  items: ItemMidtrans[];
  pembeli: { nama: string; hp: string; email?: string | null };
  finishUrl: string;
  menitKedaluwarsa?: number;
}): Promise<{ token: string; redirect_url: string }> {
  const items = p.items.map((i) => ({ ...i, name: i.name.slice(0, 50), price: Math.round(i.price) }));
  const jumlah = items.reduce((s, i) => s + i.price * i.quantity, 0);
  if (jumlah !== Math.round(p.total)) throw new Error("Rincian Midtrans tidak sama dengan total pesanan");

  const res = await fetch(`${snapBase()}/transactions`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      transaction_details: { order_id: p.orderId, gross_amount: Math.round(p.total) },
      item_details: items,
      customer_details: {
        first_name: p.pembeli.nama.slice(0, 50),
        phone: p.pembeli.hp,
        ...(p.pembeli.email ? { email: p.pembeli.email } : {}),
      },
      enabled_payments: METODE_BAYAR,
      expiry: { unit: "minutes", duration: p.menitKedaluwarsa ?? 60 },
      callbacks: { finish: p.finishUrl },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json().catch(() => null)) as { token?: string; redirect_url?: string; error_messages?: string[] } | null;
  if (!res.ok || !json?.token) {
    throw new Error(`Midtrans: ${json?.error_messages?.join(", ") ?? res.statusText}`);
  }
  return { token: json.token, redirect_url: json.redirect_url ?? "" };
}

export type StatusMidtrans = {
  order_id: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
};

// Sumber kebenaran: GET /v2/{order_id}/status (null bila transaksi belum dibuat pembeli)
export async function cekStatus(orderId: string): Promise<StatusMidtrans | null> {
  const res = await fetch(`${coreBase()}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Authorization: authHeader(), Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  const json = (await res.json().catch(() => null)) as StatusMidtrans | null;
  if (!json || !json.transaction_status || json.status_code === "404") return null;
  return json;
}

// signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
export function tandaTanganValid(n: StatusMidtrans): boolean {
  if (!n.signature_key || !n.order_id || !n.status_code || !n.gross_amount) return false;
  const hitung = createHash("sha512").update(n.order_id + n.status_code + n.gross_amount + serverKey()).digest("hex");
  const a = Buffer.from(hitung);
  const b = Buffer.from(n.signature_key);
  return a.length === b.length && timingSafeEqual(a, b);
}
