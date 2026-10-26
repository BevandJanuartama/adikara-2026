import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeDollarSign,
  Coins,
  PackageCheck,
  CirclePlus,
  Recycle,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kg, rupiah, angka } from "@/lib/format";
import { EmptyState, Notice, PageHeader, Panel, StatPatch, btn } from "@/components/kriya-ui";

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
  tren_bulanan: { bulan: string; kg: number; rupiah_warga: number; pendapatan: number; laba: number }[];
};

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// FR32: dashboard dampak
export default async function BerandaPage() {
  const me = await requireMe();
  if (me.role === "admin") redirect("/admin");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("report_impact", { p_months: 6 });
  if (error) return <Notice tone="error">Gagal memuat dashboard: {error.message}</Notice>;

  const d = data as Impact;
  const maxKg = Math.max(1, ...d.tren_bulanan.map((m) => Number(m.kg)));
  const jenis = Object.entries(d.kg_per_jenis).sort((a, b) => Number(b[1]) - Number(a[1]));
  const maxJenis = Math.max(1, ...jenis.map(([, v]) => Number(v)));

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Halo, ${me.fullName.trim().split(/\s+/)[0] || "Ibu"}`}
        description={`Dampak lingkungan, warga, dan keuangan ${me.group?.name ?? "kelompok"} dalam 6 bulan terakhir.`}
        actions={
          me.role === "pengurus" && (
            <Link href="/setoran/baru" className={btn.primary}>
              <CirclePlus /> Setor sampah
            </Link>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatPatch tone="pucuk" label="Sampah terkelola" value={kg(d.total_kg)} icon={Recycle} />
        <StatPatch tone="mentega" label="Rupiah ke warga" value={rupiah(d.rupiah_ke_warga)} icon={Coins} />
        <StatPatch tone="persik" label="Upah anggota" value={rupiah(d.upah_anggota)} icon={Wallet} />
        <StatPatch tone="sage" label="Laba usaha" value={rupiah(d.laba)} icon={TrendingUp} />
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border xl:grid-cols-4">
        {[
          { label: "Warga penyetor", value: angka(d.jumlah_warga), icon: Users },
          { label: "Produk dibuat", value: angka(d.produk_dibuat), icon: PackageCheck },
          { label: "Produk terjual", value: angka(d.produk_terjual), icon: ShoppingBag },
          { label: "Pendapatan", value: rupiah(d.pendapatan), icon: BadgeDollarSign },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="min-w-0 bg-card p-4">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4 shrink-0 text-hutan" aria-hidden />
                {s.label}
              </dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-tinta [overflow-wrap:anywhere]">{s.value}</dd>
            </div>
          );
        })}
      </dl>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Sampah per bulan" description="Total berat setoran yang diterima (kg)" icon={Recycle}>
          <div className="flex h-56 items-end gap-2 sm:gap-4" role="img"
            aria-label={d.tren_bulanan.map((m) => `${m.bulan}: ${angka(m.kg)} kg`).join(", ")}>
            {d.tren_bulanan.map((m, i) => {
              const last = i === d.tren_bulanan.length - 1;
              const h = Math.max(4, (Number(m.kg) / maxKg) * 100);
              return (
                <div key={m.bulan} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-sm font-semibold tabular-nums text-tinta">{angka(m.kg)}</span>
                  <div
                    className={`w-full max-w-16 rounded-t-lg ${last ? "bg-hutan" : "bg-sage"}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-sm text-muted-foreground">{BULAN[Number(m.bulan.slice(5)) - 1]}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Komposisi sampah" description="Berat per jenis barang" icon={PackageCheck}>
          {jenis.length === 0 ? (
            <EmptyState icon={Recycle} title="Belum ada setoran" text="Data muncul setelah setoran pertama disetujui." className="border-0 py-6" />
          ) : (
            <ul className="space-y-3.5">
              {jenis.map(([nama, berat]) => (
                <li key={nama}>
                  <div className="flex items-baseline justify-between gap-3 text-base">
                    <span className="font-medium text-tinta">{nama}</span>
                    <span className="font-semibold tabular-nums text-tinta">{kg(berat)}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-daun-muda">
                    <div className="h-full rounded-full bg-sage" style={{ width: `${(Number(berat) / maxJenis) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
