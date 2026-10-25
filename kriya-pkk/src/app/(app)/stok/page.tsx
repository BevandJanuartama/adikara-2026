import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kg, rupiah } from "@/lib/format";

// FR15: daftar stok per jenis dengan jumlah kg dan nilai
export default async function StokPage() {
  await requireMe(["pengurus", "anggota"]);
  const supabase = await createClient();
  const { data: stock } = await supabase
    .from("stock").select("item_type, qty_kg, avg_value_per_kg, updated_at").order("item_type");

  const total = (stock ?? []).reduce((s, r) => s + Number(r.qty_kg) * Number(r.avg_value_per_kg), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Stok bahan baku</h1>
      <p className="text-lg">Nilai stok: <b>{rupiah(total)}</b></p>
      <ul className="divide-y rounded-xl border">
        {(stock ?? []).map((s) => (
          <li key={s.item_type} className="flex items-center justify-between p-4">
            <div>
              <p className="text-lg font-semibold">{s.item_type}</p>
              <p className="text-sm text-muted-foreground">{rupiah(s.avg_value_per_kg)}/kg</p>
            </div>
            <p className="text-xl font-bold">{kg(s.qty_kg)}</p>
          </li>
        ))}
        {!stock?.length && <li className="p-4 text-muted-foreground">Belum ada stok. Mulai dari menu Setor.</li>}
      </ul>
    </div>
  );
}
