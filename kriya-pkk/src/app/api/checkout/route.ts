import { NextResponse } from "next/server";
import { z } from "zod";
import { getMe } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { friendlyError } from "@/lib/errors";
import { normalisasiWa } from "@/lib/marketplace/wa";
import { GalatMidtrans, buatTransaksiSnap } from "@/lib/marketplace/midtrans";
import { KesalahanToko, hitungOngkir, muatKeranjang } from "@/lib/marketplace/ongkir";
import { appUrl } from "@/lib/marketplace/pesanan";
import { simulasiAktif } from "@/lib/marketplace/simulasi";

export const maxDuration = 30;

const schema = z.object({
  posko: z.string().min(1),
  items: z.array(z.object({ id: z.string().uuid(), qty: z.number().int().min(1).max(99) })).min(1).max(30),
  pembeli: z.object({
    nama: z.string().trim().min(2, "Nama penerima minimal 2 huruf").max(80),
    hp: z.string().trim().min(8, "Nomor HP belum benar"),
  }),
  pengiriman: z.discriminatedUnion("metode", [
    z.object({ metode: z.literal("ambil") }),
    z.object({
      metode: z.literal("kurir"),
      alamat: z.string().trim().min(10, "Alamat terlalu pendek").max(300),
      kota: z.string().trim().max(80).optional(),
      kode_pos: z.string().regex(/^\d{5}$/).optional().or(z.literal("")),
      lat: z.number(),
      lng: z.number(),
      kurir: z.object({ company: z.string().min(1), type: z.string().min(1) }),
    }),
  ]),
  catatan: z.string().trim().max(300).optional(),
});

// POST /api/checkout (wajib login sebagai pembeli)
//   → pesanan dibuat atas nama akun (stok disisihkan, harga + ongkir dihitung server)
//   → token Midtrans Snap. WhatsApp ke pengurus posko baru dikirim saat pesanan LUNAS.
export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Silakan masuk dulu untuk checkout.", login: true }, { status: 401 });
  if (me.role !== "pembeli" || !me.isActive) {
    return NextResponse.json({ error: "Checkout hanya untuk akun pembeli." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data belum lengkap" }, { status: 400 });
  }
  const { posko: slug, items, pembeli, pengiriman, catatan } = parsed.data;
  const hp = normalisasiWa(pembeli.hp);
  if (!hp) return NextResponse.json({ error: "Nomor HP/WhatsApp belum benar" }, { status: 400 });
  const url = appUrl(req);
  const db = createAdminClient();

  try {
    // 1. Harga, stok, dan ongkir ekspedisi dihitung ulang di server
    const { posko, baris } = await muatKeranjang(slug, items);
    let shipping: Record<string, unknown> = { method: "ambil" };
    if (pengiriman.metode === "kurir") {
      const { tarif } = await hitungOngkir(posko, baris, {
        lat: pengiriman.lat,
        lng: pengiriman.lng,
        postal: pengiriman.kode_pos || null,
      });
      const pilih = tarif.find((t) => t.company === pengiriman.kurir.company && t.type === pengiriman.kurir.type);
      if (!pilih) throw new KesalahanToko("Layanan ekspedisi itu sudah tidak tersedia. Cek ongkir lagi.", 409);
      shipping = {
        method: "kurir",
        address: pengiriman.alamat,
        city: pengiriman.kota ?? null,
        postal_code: pengiriman.kode_pos || null,
        lat: pengiriman.lat,
        lng: pengiriman.lng,
        courier_company: pilih.company,
        courier_type: pilih.type,
        courier_name: `${pilih.name} ${pilih.service}`.trim(),
        eta: pilih.eta,
        cost: pilih.price,
      };
    }

    // 2. Buat pesanan + potong stok (atomik di database), terhubung ke akun pembeli
    const { data: order, error } = await db.rpc("create_order", {
      p_group_slug: slug,
      p_items: items,
      p_buyer: { name: pembeli.nama, phone: hp, email: me.email, user_id: me.id },
      p_shipping: shipping,
      p_note: catatan ?? null,
    });
    if (error) throw new KesalahanToko(friendlyError(error.message));
    const o = order as {
      code: string;
      shipping_cost: number;
      total: number;
      items: { id: string; name: string; qty: number; price: number; subtotal: number }[];
    };
    const halaman = `/akun/pesanan/${o.code}`;

    // 3. Token pembayaran Midtrans Snap (QRIS / Virtual Account): total = harga produk + ongkir
    let snap: { token: string; redirect_url: string };
    try {
      snap = await buatTransaksiSnap({
        orderId: o.code,
        total: Number(o.total),
        items: [
          ...o.items.map((i) => ({ id: i.id.slice(0, 50), name: i.name, price: Number(i.price), quantity: i.qty })),
          ...(Number(o.shipping_cost) > 0
            ? [{ id: "ONGKIR", name: `Ongkir ${String(shipping.courier_name ?? "ekspedisi")}`, price: Number(o.shipping_cost), quantity: 1 }]
            : []),
        ],
        pembeli: { nama: pembeli.nama, hp, email: me.email },
        finishUrl: url + halaman,
      });
    } catch (e) {
      console.error("[checkout] midtrans", e);
      // Mode uji: pesanan tetap "menunggu bayar" supaya pengurus bisa menandai lunas lewat simulasi
      if (simulasiAktif()) return NextResponse.json({ code: o.code, lacak: halaman, simulasi: true });
      await db.rpc("close_order", { p_code: o.code, p_status: "gagal", p_midtrans_status: "snap_error" });
      const detail =
        process.env.NODE_ENV !== "production" && e instanceof Error
          ? ` (${e.message})`
          : ` (kode ${e instanceof GalatMidtrans ? e.kode : "MT"})`;
      return NextResponse.json({ error: `Pembayaran belum bisa dibuat. Coba lagi sebentar.${detail}` }, { status: 502 });
    }
    await db.rpc("attach_payment", { p_code: o.code, p_token: snap.token, p_redirect_url: snap.redirect_url });

    return NextResponse.json({ code: o.code, token: snap.token, redirect_url: snap.redirect_url, lacak: halaman });
  } catch (e) {
    if (e instanceof KesalahanToko) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[checkout]", e);
    const detail = process.env.NODE_ENV !== "production" && e instanceof Error ? ` (${e.message})` : "";
    return NextResponse.json({ error: `Pesanan gagal dibuat. Coba lagi.${detail}` }, { status: 500 });
  }
}
