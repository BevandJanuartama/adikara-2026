import Link from "next/link";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";

const STATUS: Record<string, string> = { draft: "Draft", approved: "Disetujui", cancelled: "Batal" };

export default async function SetoranPage() {
  await requireMe(["pengurus"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("deposits")
    .select("id, status, total, paid_cash, created_at, warga:residents(name), deposit_items(item_type, weight_kg)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Riwayat setoran</h1>
        <Link href="/setoran/baru" className="rounded-lg bg-primary px-4 py-2 text-base text-primary-foreground">+ Setor</Link>
      </div>
      <ul className="divide-y rounded-xl border">
        {(data ?? []).map((d) => (
          <li key={d.id} className="p-4">
            <div className="flex justify-between">
              <p className="text-lg font-semibold">{(d.warga as unknown as { name: string } | null)?.name}</p>
              <p className="text-lg font-bold">{rupiah(d.total)}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {tanggal(d.created_at)} · {STATUS[d.status]}{d.status === "approved" && (d.paid_cash ? " · tunai" : " · saldo")} ·{" "}
              {(d.deposit_items as { item_type: string; weight_kg: number }[]).map((i) => `${i.item_type} ${i.weight_kg} kg`).join(", ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
