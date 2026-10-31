import { NextResponse } from "next/server";
import { z } from "zod";
import { getMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { simulasiAktif } from "@/lib/marketplace/simulasi";
import { appUrl, terapkanStatusMidtrans } from "@/lib/marketplace/pesanan";

// POST /api/pesanan/simulasi  { order_id, aksi: "lunas" | "gagal" | "kedaluwarsa" }
// Mengubah status pembayaran secara manual selama memakai Midtrans sandbox.
// Syarat: SIMULASI_PEMBAYARAN=true, mode sandbox, login sebagai PENGURUS posko pemilik pesanan.
const schema = z.object({
  order_id: z.string().uuid(),
  aksi: z.enum(["lunas", "gagal", "kedaluwarsa"]),
});

const STATUS_MIDTRANS = { lunas: "settlement", gagal: "deny", kedaluwarsa: "expire" } as const;

export async function POST(req: Request) {
  if (!simulasiAktif()) return NextResponse.json({ error: "not found" }, { status: 404 });

  // tolak permintaan dari situs lain
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) {
    return NextResponse.json({ error: "Asal permintaan tidak dikenal" }, { status: 403 });
  }

  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Silakan login dulu" }, { status: 401 });
  if (me.role !== "pengurus" || !me.isActive || me.group?.status !== "active") {
    return NextResponse.json({ error: "Khusus pengurus posko yang aktif" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const aksi = parsed.data.aksi as keyof typeof STATUS_MIDTRANS;

  // RLS: pengurus hanya bisa membaca pesanan milik poskonya sendiri
  const supabase = await createClient();
  const { data: o } = await supabase
    .from("orders")
    .select("id, code, total, status")
    .eq("id", parsed.data.order_id)
    .maybeSingle();
  if (!o) return NextResponse.json({ error: "Pesanan tidak ditemukan di posko Anda" }, { status: 404 });
  if (o.status !== "menunggu_bayar") {
    return NextResponse.json({ error: "Hanya pesanan yang menunggu pembayaran yang bisa disimulasikan" }, { status: 409 });
  }

  try {
    const hasil = await terapkanStatusMidtrans(
      {
        order_id: o.code,
        transaction_status: STATUS_MIDTRANS[aksi],
        gross_amount: String(o.total),
        payment_type: "simulasi",
        transaction_id: `SIMULASI-${Date.now()}`,
      },
      appUrl(req),
    );
    console.info(`[simulasi] ${me.email ?? me.id} → ${o.code}: ${aksi}`);
    return NextResponse.json({ ok: true, status: hasil });
  } catch (e) {
    console.error("[simulasi]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal mengubah status" }, { status: 500 });
  }
}
