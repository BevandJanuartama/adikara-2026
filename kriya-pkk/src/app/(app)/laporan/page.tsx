import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, angka } from "@/lib/format";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Package,
  Search,
} from "lucide-react";

type PL = {
  pendapatan: number;
  modal_terjual: number;
  laba: number;
  unit_terjual: number;
  kas_masuk: number;
  kas_keluar: number;
  kas_per_kategori: Record<string, number>;
  saldo_kas: number;
};

const todayWib = () =>
  new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

// FR30: laba rugi sederhana per periode (default: bulan ini)
export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string }>;
}) {
  await requireMe(["pengurus"]);
  const sp = await searchParams;
  const sampai = sp.sampai ?? todayWib();
  const dari = sp.dari ?? `${sampai.slice(0, 7)}-01`;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("report_profit_loss", {
    p_from: dari,
    p_to: sampai,
  });

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-700">
        <span>❌ Terjadi kesalahan memuat laporan: {error.message}</span>
      </div>
    );
  }

  const r = data as PL;
  const isProfitable = r.laba >= 0;

  const line = (label: string, v: number, bold = false, isProfit = false) => (
    <div
      className={`flex items-center justify-between py-2 text-xs sm:text-sm ${bold ? "font-bold text-foreground border-t pt-3" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span
        className={
          bold
            ? isProfit
              ? "text-emerald-700 text-base"
              : "text-foreground"
            : "font-medium text-foreground"
        }
      >
        {rupiah(v)}
      </span>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      {/* Header & Judul */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Laporan Laba Rugi
          </h1>
          <p className="text-xs text-muted-foreground">
            Rekapitulasi keuangan dan performa penjualan kelompok
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 shadow-2xs">
          <FileText className="h-6 w-6" />
        </div>
      </div>

      {/* Filter Periode Tanggal */}
      <form className="rounded-2xl border bg-card p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 border-b pb-2.5 text-xs font-bold text-foreground">
          <Calendar className="h-4 w-4 text-emerald-700" />
          <span>Filter Periode Laporan</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Dari Tanggal
            </label>
            <input
              type="date"
              name="dari"
              defaultValue={dari}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Sampai Tanggal
            </label>
            <input
              type="date"
              name="sampai"
              defaultValue={sampai}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>
        <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition-all">
          <Search className="h-4 w-4" />
          <span>Tampilkan Laporan</span>
        </button>
      </form>

      {/* Bagian 1: Laba Rugi Performa */}
      <div className="rounded-2xl border bg-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div
              className={`rounded-lg p-2 ${isProfitable ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
            >
              {isProfitable ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold">Ringkasan Laba Bersih</h2>
              <p className="text-xs text-muted-foreground">
                Pendapatan dikurangi HPP produk terjual
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
              <Package className="h-3.5 w-3.5" />
              <span>{angka(r.unit_terjual)} unit terjual</span>
            </span>
          </div>
        </div>

        <div className="divide-y divide-muted/40 space-y-1">
          {line("Pendapatan penjualan", r.pendapatan)}
          {line("Modal produk terjual (HPP)", r.modal_terjual)}
          {line("Laba Bersih Periode Ini", r.laba, true, isProfitable)}
        </div>
      </div>

      {/* Bagian 2: Arus Kas Periode Ini */}
      <div className="rounded-2xl border bg-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 border-b pb-3">
          <div className="rounded-lg bg-teal-100 p-2 text-teal-800">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Arus Kas Periode Ini</h2>
            <p className="text-xs text-muted-foreground">
              Rincian mutasi kas masuk dan keluar
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pt-1">
            Rincian Kategori
          </h3>
          {Object.entries(r.kas_per_kategori).length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Tidak ada mutasi kas pada periode ini.
            </p>
          ) : (
            <ul className="space-y-1.5 divide-y divide-muted/30">
              {Object.entries(r.kas_per_kategori).map(([k, v]) => (
                <li
                  key={k}
                  className="flex items-center justify-between pt-1.5 text-xs"
                >
                  <span className="text-muted-foreground capitalize">
                    {k.replace(":", " · ").replace(/_/g, " ")}
                  </span>
                  <span className="font-semibold text-foreground">
                    {rupiah(v)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t pt-3 divide-y divide-muted/40 space-y-1">
          {line("Total Kas Masuk", r.kas_masuk)}
          {line("Total Kas Keluar", r.kas_keluar)}
          {line("Saldo Kas Saat Ini", r.saldo_kas, true)}
        </div>
      </div>
    </div>
  );
}
