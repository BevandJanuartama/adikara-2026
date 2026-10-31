import { NextResponse } from "next/server";
import { z } from "zod";
import { KesalahanToko, hitungOngkir, muatKeranjang } from "@/lib/marketplace/ongkir";

export const maxDuration = 20;

const schema = z.object({
  posko: z.string().min(1),
  items: z.array(z.object({ id: z.string().uuid(), qty: z.number().int().min(1).max(99) })).min(1).max(30),
  tujuan: z.object({
    lat: z.number(),
    lng: z.number(),
    kode_pos: z.string().regex(/^\d{5}$/).optional().or(z.literal("")),
  }),
});

// POST /api/ongkir → { jarak_km, tarif: [{company, type, name, service, price, eta}] }
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data pengiriman belum lengkap" }, { status: 400 });
  const { posko: slug, items, tujuan } = parsed.data;
  try {
    const { posko, baris } = await muatKeranjang(slug, items);
    const { jarakKm, tarif, berat, jarakTagihKm } = await hitungOngkir(posko, baris, {
      lat: tujuan.lat,
      lng: tujuan.lng,
      postal: tujuan.kode_pos || null,
    });
    if (!tarif.length) {
      return NextResponse.json(
        { error: "Belum ada kurir yang melayani alamat ini. Coba isi kode pos atau pilih ambil di posko.", jarak_km: jarakKm },
        { status: 422 },
      );
    }
    return NextResponse.json({
      jarak_km: Math.round(jarakKm * 10) / 10,
      jarak_tagih_km: jarakTagihKm ?? null, // perkiraan jarak jalan yang ditagihkan (mode manual)
      berat_kg: berat?.dibulatkanKg ?? null, // berat dikenakan setelah pembulatan (mode manual)
      tarif,
    });
  } catch (e) {
    if (e instanceof KesalahanToko) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[ongkir]", e);
    const detail = process.env.NODE_ENV !== "production" && e instanceof Error ? ` (${e.message})` : "";
    return NextResponse.json({ error: `Gagal cek ongkir. Coba lagi sebentar.${detail}` }, { status: 502 });
  }
}
