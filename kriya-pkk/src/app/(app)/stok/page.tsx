import Link from "next/link";
import { Boxes, Coins, Layers, PackageOpen, Scale } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kg, rupiah } from "@/lib/format";
import { EmptyState, PageHeader, StatPatch, btn } from "@/components/kriya-ui";

// FR15: daftar stok per jenis dengan jumlah kg dan nilai
export default async function StokPage() {
  const me = await requireMe(["pengurus", "anggota"]);
  const supabase = await createClient();
  const { data: stock } = await supabase
    .from("stock")
    .select("item_type, qty_kg, avg_value_per_kg, updated_at")
    .order("item_type");

  const rows = stock ?? [];
  const totalValue = rows.reduce((s, r) => s + Number(r.qty_kg) * Number(r.avg_value_per_kg), 0);
  const totalKg = rows.reduce((s, r) => s + Number(r.qty_kg), 0);
  const maxKg = Math.max(1, ...rows.map((r) => Number(r.qty_kg)));

  return (
    <div className="space-y-8">
      <PageHeader title="Stok bahan" description="Persediaan bahan baku dari setoran warga, dengan nilai rata-rata per kg." icon={Boxes} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <StatPatch tone="mentega" label="Nilai stok" value={rupiah(totalValue)} icon={Coins} />
        <StatPatch tone="pucuk" label="Total berat" value={kg(totalKg)} icon={Scale} />
        <StatPatch tone="persik" label="Jenis bahan" value={`${rows.length} jenis`} icon={Layers} className="col-span-2 md:col-span-1" />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="Stok masih kosong"
          text="Stok bertambah otomatis setiap kali setoran warga disetujui."
          action={me.role === "pengurus" && <Link href="/setoran/baru" className={btn.primary}>Catat setoran</Link>}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <li key={s.item_type} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-bold text-tinta">{s.item_type}</p>
                <p className="text-2xl font-extrabold tabular-nums text-tinta">{kg(s.qty_kg)}</p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-daun-muda" aria-hidden>
                <div className="h-full rounded-full bg-sage" style={{ width: `${(Number(s.qty_kg) / maxKg) * 100}%` }} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Nilai rata-rata <span className="font-semibold text-tinta">{rupiah(s.avg_value_per_kg)}/kg</span>
                {" "}· total <span className="font-semibold text-tinta">{rupiah(Number(s.qty_kg) * Number(s.avg_value_per_kg))}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
