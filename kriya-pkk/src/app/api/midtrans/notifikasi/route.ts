import { NextResponse } from "next/server";
import { cekStatus, tandaTanganValid, type StatusMidtrans } from "@/lib/marketplace/midtrans";
import { appUrl, terapkanStatusMidtrans } from "@/lib/marketplace/pesanan";

// URL ini diisi di Midtrans Dashboard → Settings → Payment → Notification URL:
//   https://<domain-anda>/api/midtrans/notifikasi
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as StatusMidtrans | null;
  if (!body?.order_id) return NextResponse.json({ error: "bad request" }, { status: 400 });
  if (!tandaTanganValid(body)) return NextResponse.json({ error: "invalid signature" }, { status: 403 });

  try {
    // Status dari GET Status API dipakai sebagai sumber kebenaran (bukan isi body saja)
    const status = (await cekStatus(body.order_id)) ?? body;
    const hasil = await terapkanStatusMidtrans(status, appUrl(req));
    return NextResponse.json({ ok: true, status: hasil });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Notifikasi uji dari dashboard (order_id bukan milik kita): balas 200 supaya tidak diulang
    if (msg.includes("PESANAN_TIDAK_DITEMUKAN")) return NextResponse.json({ ok: true, ignored: true });
    console.error("[midtrans] notifikasi", e);
    return NextResponse.json({ error: "gagal memproses" }, { status: 500 }); // Midtrans akan mencoba lagi
  }
}

export function GET() {
  return NextResponse.json({ ok: true, info: "Endpoint notifikasi Midtrans KriyaPKK" });
}
