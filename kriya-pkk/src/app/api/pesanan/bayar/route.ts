import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { buatTransaksiSnap } from "@/lib/marketplace/midtrans";
import { appUrl } from "@/lib/marketplace/pesanan";

const schema = z.object({ code: z.string().min(5), t: z.string().min(10) });

// POST /api/pesanan/bayar → token Snap untuk pesanan yang belum dibayar (dari halaman lacak)
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const db = createAdminClient();
  const { data: o } = await db
    .from("orders")
    .select("code, access_token, status, total, shipping_cost, courier_name, buyer_name, buyer_phone, buyer_email, midtrans_token, items:order_items(finished_good_id, name, qty, unit_price)")
    .eq("code", parsed.data.code)
    .eq("access_token", parsed.data.t)
    .maybeSingle();
  if (!o) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  if (o.status !== "menunggu_bayar") return NextResponse.json({ error: "Pesanan ini tidak menunggu pembayaran" }, { status: 409 });
  if (o.midtrans_token) return NextResponse.json({ token: o.midtrans_token });

  try {
    const items = (o.items as { finished_good_id: string; name: string; qty: number; unit_price: number }[]).map((i) => ({
      id: i.finished_good_id.slice(0, 50),
      name: i.name,
      price: Number(i.unit_price),
      quantity: i.qty,
    }));
    if (Number(o.shipping_cost) > 0) {
      items.push({ id: "ONGKIR", name: `Ongkir ${o.courier_name ?? "kurir"}`, price: Number(o.shipping_cost), quantity: 1 });
    }
    const snap = await buatTransaksiSnap({
      orderId: o.code,
      total: Number(o.total),
      items,
      pembeli: { nama: o.buyer_name, hp: o.buyer_phone, email: o.buyer_email },
      finishUrl: `${appUrl(req)}/lacak/${o.code}?t=${o.access_token}`,
    });
    await db.rpc("attach_payment", { p_code: o.code, p_token: snap.token, p_redirect_url: snap.redirect_url });
    return NextResponse.json({ token: snap.token });
  } catch (e) {
    console.error("[bayar]", e);
    return NextResponse.json({ error: "Pembayaran belum bisa dibuat. Coba lagi." }, { status: 502 });
  }
}
