import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { friendlyError } from "@/lib/errors";
import { normalisasiWa } from "@/lib/marketplace/wa";
import { buatTransaksiSnap } from "@/lib/marketplace/midtrans";
import { kirimWa } from "@/lib/marketplace/fonnte";
import { KesalahanToko, hitungOngkir, muatKeranjang } from "@/lib/marketplace/ongkir";
import { appUrl, pesanWaBaru } from "@/lib/marketplace/pesanan";

export const maxDuration = 30;

const schema = z.object({
  posko: z.string().min(1),
  items: z.array(z.object({ id: z.string().uuid(), qty: z.number().int().min(1).max(99) })).min(1).max(30),
  pembeli: z.object({
    nama: z.string().trim().min(2, "Nama minimal 2 huruf").max(80),
    hp: z.string().trim().min(8, "Nomor HP belum benar"),
    email: z.string().trim().email("Email tidak valid").optional().or(z.literal("")),
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

// POST /api/checkout → buat pesanan (stok disisihkan) → token Midtrans Snap → WA ke pengurus posko
export async function POST(req: Request) {
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
    // 1. Harga, stok, dan ongkir dihitung ulang di server
    const { posko, baris } = await muatKeranjang(slug, items);
    let shipping: Record<string, unknown> = { method: "ambil" };
    if (pengiriman.metode === "kurir") {
      const { tarif } = await hitungOngkir(posko, baris, {
        lat: pengiriman.lat,
        lng: pengiriman.lng,
        postal: pengiriman.kode_pos || null,
      });
      const pilih = tarif.find((t) => t.company === pengiriman.kurir.company && t.type === pengiriman.kurir.type);
      if (!pilih) throw new KesalahanToko("Layanan kurir itu sudah tidak tersedia. Cek ongkir lagi.", 409);
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

    // 2. Buat pesanan + potong stok (atomik di database)
    const { data: order, error } = await db.rpc("create_order", {
      p_group_slug: slug,
      p_items: items,
      p_buyer: { name: pembeli.nama, phone: hp, email: pembeli.email || null },
      p_shipping: shipping,
      p_note: catatan ?? null,
    });
    if (error) throw new KesalahanToko(friendlyError(error.message));
    const o = order as {
      code: string;
      access_token: string;
      subtotal: number;
      shipping_cost: number;
      total: number;
      posko: { name: string; whatsapp: string | null };
      items: { id: string; name: string; qty: number; price: number; subtotal: number }[];
    };
    const lacak = `/lacak/${o.code}?t=${o.access_token}`;

    // 3. Token pembayaran Midtrans Snap (QRIS / Virtual Account)
    let snap: { token: string; redirect_url: string };
    try {
      snap = await buatTransaksiSnap({
        orderId: o.code,
        total: Number(o.total),
        items: [
          ...o.items.map((i) => ({ id: i.id.slice(0, 50), name: i.name, price: Number(i.price), quantity: i.qty })),
          ...(Number(o.shipping_cost) > 0
            ? [{ id: "ONGKIR", name: `Ongkir ${String(shipping.courier_name ?? "kurir")}`, price: Number(o.shipping_cost), quantity: 1 }]
            : []),
        ],
        pembeli: { nama: pembeli.nama, hp, email: pembeli.email || null },
        finishUrl: url + lacak,
      });
    } catch (e) {
      console.error("[checkout] midtrans", e);
      await db.rpc("close_order", { p_code: o.code, p_status: "gagal", p_midtrans_status: "snap_error" });
      return NextResponse.json({ error: "Pembayaran belum bisa dibuat. Coba lagi sebentar." }, { status: 502 });
    }
    await db.rpc("attach_payment", { p_code: o.code, p_token: snap.token, p_redirect_url: snap.redirect_url });

    // 4. Notifikasi WhatsApp ke pengurus posko (gagal kirim tidak menggagalkan pesanan)
    await kirimWa(
      o.posko.whatsapp,
      pesanWaBaru({
        code: o.code,
        buyer_name: pembeli.nama,
        buyer_phone: hp,
        items: o.items.map((i) => ({ name: i.name, qty: i.qty, subtotal: Number(i.subtotal) })),
        shipping_method: pengiriman.metode,
        courier_name: (shipping.courier_name as string) ?? null,
        shipping_cost: Number(o.shipping_cost),
        address: (shipping.address as string) ?? null,
        total: Number(o.total),
        url,
      }),
    );

    return NextResponse.json({ code: o.code, token: snap.token, redirect_url: snap.redirect_url, lacak });
  } catch (e) {
    if (e instanceof KesalahanToko) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[checkout]", e);
    return NextResponse.json({ error: "Pesanan gagal dibuat. Coba lagi." }, { status: 500 });
  }
}
