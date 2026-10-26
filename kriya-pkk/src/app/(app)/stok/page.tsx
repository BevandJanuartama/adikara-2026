import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kg, rupiah } from "@/lib/format";
import { Boxes, Coins, PackageOpen } from "lucide-react";

// FR15: daftar stok per jenis dengan jumlah kg dan nilai
export default async function StokPage() {
  await requireMe(["pengurus", "anggota"]);
  const supabase = await createClient();
  const { data: stock } = await supabase
    .from("stock")
    .select("item_type, qty_kg, avg_value_per_kg, updated_at")
    .order("item_type");

  const total = (stock ?? []).reduce(
    (s, r) => s + Number(r.qty_kg) * Number(r.avg_value_per_kg),
    0,
  );

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-8">
      {/* Header & Judul */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stok Bahan Baku</h1>
          <p className="text-xs text-muted-foreground">
            Persediaan material dari setoran warga
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 shadow-2xs">
          <Boxes className="h-6 w-6" />
        </div>
      </div>

      {/* Kartu Total Nilai Stok */}
      <div className="rounded-2xl border bg-gradient-to-br from-emerald-700 to-teal-800 p-5 text-white shadow-md flex items-center justify-between">
        <div>
          <p className="text-xs text-emerald-100 font-medium">
            Total Estimasi Nilai Stok
          </p>
          <p className="text-2xl font-bold tracking-tight">{rupiah(total)}</p>
        </div>
        <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md shadow-2xs">
          <Coins className="h-6 w-6 text-emerald-200" />
        </div>
      </div>

      {/* Rincian Daftar Stok */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
          Rincian per Jenis
        </h2>

        {!stock || stock.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center space-y-3 shadow-2xs">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <PackageOpen className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Belum ada stok bahan baku.
              <br />
              Mulai catat dari menu Setoran.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2.5">
            {stock.map((s) => (
              <li
                key={s.item_type}
                className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-2xs transition-all hover:shadow-sm"
              >
                <div className="space-y-0.5">
                  <p className="text-base font-bold capitalize text-foreground">
                    {s.item_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nilai rata-rata:{" "}
                    <span className="font-semibold text-emerald-700">
                      {rupiah(s.avg_value_per_kg)}/kg
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-xl bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-800">
                    {kg(s.qty_kg)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
