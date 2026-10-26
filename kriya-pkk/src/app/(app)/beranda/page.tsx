import { redirect } from "next/navigation";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kg, rupiah, angka } from "@/lib/format";
import {
  Recycle,
  Coins,
  Users,
  PackageCheck,
  ShoppingBag,
  BadgeDollarSign,
  TrendingUp,
  Wallet,
  Building2,
  Sparkles,
  Layers,
} from "lucide-react";

type Impact = {
  total_kg: number;
  kg_per_jenis: Record<string, number>;
  rupiah_ke_warga: number;
  jumlah_warga: number;
  produk_dibuat: number;
  produk_terjual: number;
  pendapatan: number;
  laba: number;
  upah_anggota: number;
  tren_bulanan: {
    bulan: string;
    kg: number;
    rupiah_warga: number;
    pendapatan: number;
    laba: number;
  }[];
};

export default async function BerandaPage() {
  const me = await requireMe();
  if (me.role === "admin") redirect("/admin");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("report_impact", { p_months: 6 });

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-red-800">
          Gagal Memuat Dashboard
        </p>
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
      </div>
    );
  }

  const d = data as Impact;
  const maxKg = Math.max(1, ...d.tren_bulanan.map((m) => Number(m.kg)));

  const mainMetrics = [
    {
      label: "Sampah Terkelola",
      value: kg(d.total_kg),
      icon: Recycle,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      label: "Rupiah ke Warga",
      value: rupiah(d.rupiah_ke_warga),
      icon: Coins,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      label: "Upah Anggota",
      value: rupiah(d.upah_anggota),
      icon: Wallet,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      label: "Laba Bersih Usaha",
      value: rupiah(d.laba),
      icon: TrendingUp,
      color: "text-teal-600 bg-teal-50 border-teal-100",
    },
  ];

  const secondaryMetrics = [
    { label: "Warga Penyetor", value: angka(d.jumlah_warga), icon: Users },
    {
      label: "Produk Dibuat",
      value: angka(d.produk_dibuat),
      icon: PackageCheck,
    },
    {
      label: "Produk Terjual",
      value: angka(d.produk_terjual),
      icon: ShoppingBag,
    },
    {
      label: "Total Pendapatan",
      value: rupiah(d.pendapatan),
      icon: BadgeDollarSign,
    },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 p-6 text-white shadow-lg shadow-emerald-900/10">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-md">
            <Building2 className="h-3.5 w-3.5" />
            <span>Kelompok PKK</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {me.group?.name}
          </h1>
          <p className="text-xs text-emerald-100/90">
            Ringkasan capaian lingkungan, pemberdayaan warga, dan keuangan
            kelompok.
          </p>
        </div>
        <Sparkles className="absolute -bottom-2 -right-2 h-32 w-32 text-white/5" />
      </div>

      {/* Metric Utama Grid */}
      <div className="grid grid-cols-2 gap-3">
        {mainMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className={`flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${m.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium opacity-80">
                  {m.label}
                </span>
                <Icon className="h-5 w-5 opacity-90" />
              </div>
              <p className="mt-3 text-xl font-bold tracking-tight">{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Metric Sekunder Baris Compact */}
      <div className="grid grid-cols-2 gap-2.5 rounded-2xl border bg-card p-3 shadow-sm sm:grid-cols-4">
        {secondaryMetrics.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-2.5"
            >
              <div className="rounded-lg bg-background p-2 text-muted-foreground shadow-xs">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {s.label}
                </p>
                <p className="text-sm font-bold tracking-tight">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grafik Tren Sampah */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold tracking-tight">
              Tren Sampah Terkelola
            </h2>
            <p className="text-xs text-muted-foreground">
              Volume setoran per bulan (kg)
            </p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
            <Recycle className="h-5 w-5" />
          </div>
        </div>

        <div className="pt-2">
          <div className="flex h-44 items-end gap-2 border-b pb-2">
            {d.tren_bulanan.map((m) => {
              const heightPercent = Math.max(8, (Number(m.kg) / maxKg) * 100);
              return (
                <div
                  key={m.bulan}
                  className="group relative flex flex-1 flex-col items-center gap-1.5 h-full justify-end"
                >
                  {/* Tooltip Hover/Touch */}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 rounded bg-popover px-2 py-1 text-[10px] font-bold shadow border z-20">
                    {angka(m.kg)} kg
                  </span>

                  <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground">
                    {angka(m.kg)}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-500 transition-all group-hover:brightness-110"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {m.bulan.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Rincian Per Jenis Sampah */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold tracking-tight">
              Komposisi Sampah
            </h2>
            <p className="text-xs text-muted-foreground">
              Rincian berat berdasarkan jenis
            </p>
          </div>
          <div className="rounded-lg bg-muted p-2 text-muted-foreground">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <ul className="divide-y rounded-xl border bg-muted/20">
          {Object.entries(d.kg_per_jenis).length === 0 ? (
            <li className="p-4 text-center text-xs text-muted-foreground">
              Belum ada data jenis sampah.
            </li>
          ) : (
            Object.entries(d.kg_per_jenis).map(([jenis, berat]) => (
              <li
                key={jenis}
                className="flex items-center justify-between p-3.5 text-sm transition-colors hover:bg-muted/40"
              >
                <span className="font-medium text-foreground capitalize">
                  {jenis}
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  {kg(berat)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
