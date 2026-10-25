import { redirect } from "next/navigation";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kg, rupiah, angka } from "@/lib/format";

type Impact = {
  total_kg: number; kg_per_jenis: Record<string, number>; rupiah_ke_warga: number; jumlah_warga: number;
  produk_dibuat: number; produk_terjual: number; pendapatan: number; laba: number; upah_anggota: number;
  tren_bulanan: { bulan: string; kg: number; rupiah_warga: number; pendapatan: number; laba: number }[];
};

// FR32: dashboard dampak
export default async function BerandaPage() {
  const me = await requireMe();
  if (me.role === "admin") redirect("/admin");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("report_impact", { p_months: 6 });
  if (error) return <p className="text-red-700">{error.message}</p>;
  const d = data as Impact;
  const maxKg = Math.max(1, ...d.tren_bulanan.map((m) => Number(m.kg)));

  const stats = [
    { label: "Sampah terkelola", value: kg(d.total_kg) },
    { label: "Rupiah ke warga", value: rupiah(d.rupiah_ke_warga) },
    { label: "Warga penyetor", value: angka(d.jumlah_warga) },
    { label: "Produk dibuat", value: angka(d.produk_dibuat) },
    { label: "Produk terjual", value: angka(d.produk_terjual) },
    { label: "Upah anggota", value: rupiah(d.upah_anggota) },
    { label: "Pendapatan", value: rupiah(d.pendapatan) },
    { label: "Laba", value: rupiah(d.laba) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dampak {me.group?.name}</h1>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Sampah per bulan (kg)</h2>
        <div className="flex h-40 items-end gap-2">
          {d.tren_bulanan.map((m) => (
            <div key={m.bulan} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs">{angka(m.kg)}</span>
              <div className="w-full rounded-t bg-primary" style={{ height: `${(Number(m.kg) / maxKg) * 100}%` }} />
              <span className="text-xs text-muted-foreground">{m.bulan.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Per jenis</h2>
        <ul className="divide-y rounded-xl border">
          {Object.entries(d.kg_per_jenis).map(([jenis, berat]) => (
            <li key={jenis} className="flex justify-between p-3 text-base">
              <span>{jenis}</span><span className="font-semibold">{kg(berat)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
