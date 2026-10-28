import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Dipanggil Vercel Cron sekali sehari (lihat vercel.json) supaya proyek Supabase gratis
// tidak di-pause karena 7 hari tanpa aktivitas — penting selama masa penjurian.
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = createAdminClient();
  const { count, error } = await db.from("groups").select("id", { count: "exact", head: true });
  // Pesanan yang ditinggal tanpa dibayar → kedaluwarsa, stok kembali
  const { data: expired } = await db.rpc("expire_stale_orders", { p_minutes: 90 });
  return NextResponse.json({ ok: !error, groups: count ?? 0, expired: expired ?? 0, at: new Date().toISOString() });
}
