import { createClient } from "@/lib/supabase/server";

// FR31: ekspor buku kas ke CSV (RLS: hanya pengurus kelompok sendiri yang dapat baris)
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return new Response("Silakan login", { status: 401 });

  const { data, error } = await supabase
    .from("cash_ledger")
    .select("entry_date, entry_type, category, amount, note")
    .order("entry_date");
  if (error) return new Response(error.message, { status: 400 });

  const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const lines = [
    "tanggal,jenis,kategori,jumlah,catatan",
    ...(data ?? []).map((r) =>
      [r.entry_date, r.entry_type === "in" ? "masuk" : "keluar", r.category, r.amount, esc(r.note)].join(","),
    ),
  ];
  return new Response("﻿" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="buku-kas-kriyapkk.csv"`,
    },
  });
}
