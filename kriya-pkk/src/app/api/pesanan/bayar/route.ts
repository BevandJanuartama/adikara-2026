import { NextResponse } from "next/server";
import { z } from "zod";
import { getMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GalatMidtrans, buatTransaksiSnap } from "@/lib/marketplace/midtrans";
import { appUrl } from "@/lib/marketplace/pesanan";
import { simulasiAktif } from "@/lib/marketplace/simulasi";

const schema = z.object({ code: z.string().min(5) });

// POST /api/pesanan/bayar → token Snap untuk pesanan milik pembeli yang login (dari halaman Pesanan saya)
export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Silakan masuk dulu" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  // RLS: pembeli hanya bisa membaca pesanannya sendiri
  const supabase = await createClient();
  const { data: o } = await supabase
    .from("orders")
    .select("code, status, total, shipping_cost, courier_name, buyer_name, buyer_phone, buyer_email, buyer_id, midtrans_token, items:order_items(finished_good_id, name, qty, unit_price)")
    .eq("code", parsed.data.code)
    .eq("buyer_id", me.id)
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
      items.push({ id: "ONGKIR", name: `Ongkir ${o.courier_name ?? "ekspedisi"}`, price: Number(o.shipping_cost), quantity: 1 });
    }
    const snap = await buatTransaksiSnap({
      orderId: o.code,
      total: Number(o.total),
      items,
      pembeli: { nama: o.buyer_name, hp: o.buyer_phone, email: o.buyer_email },
      finishUrl: `${appUrl(req)}/akun/pesanan/${o.code}`,
    });
    await createAdminClient().rpc("attach_payment", { p_code: o.code, p_token: snap.token, p_redirect_url: snap.redirect_url });
    return NextResponse.json({ token: snap.token });
  } catch (e) {
    console.error("[bayar]", e);
    if (simulasiAktif()) {
      return NextResponse.json(
        { error: "Mode uji: pembayaran online belum aktif. Pengurus posko akan mengonfirmasi pembayaran Anda." },
        { status: 409 },
      );
    }
    const detail =
      process.env.NODE_ENV !== "production" && e instanceof Error
        ? ` (${e.message})`
        : ` (kode ${e instanceof GalatMidtrans ? e.kode : "MT"})`;
    return NextResponse.json({ error: `Pembayaran belum bisa dibuat. Coba lagi.${detail}` }, { status: 502 });
  }
}
