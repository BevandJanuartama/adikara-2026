import { FileText, Package, Search, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, angka } from "@/lib/format";
import { MoneyRow, Notice, PageHeader, Panel, StatPatch, btn, inputClass, labelClass } from "@/components/kriya-ui";

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

const KATEGORI: Record<string, string> = {
  modal_awal: "Modal awal",
  pembelian_setoran: "Bayar setoran warga",
  bahan_tambahan: "Bahan tambahan",
  upah: "Upah",
  penjualan: "Penjualan",
  lainnya: "Lainnya",
  koreksi: "Koreksi",
};

const todayWib = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

// FR30: laba rugi sederhana per periode (default: bulan ini)
export default async function LaporanPage({ searchParams }: { searchParams: Promise<{ dari?: string; sampai?: string }> }) {
  await requireMe(["pengurus"]);
  const sp = await searchParams;
  const sampai = sp.sampai ?? todayWib();
  const dari = sp.dari ?? `${sampai.slice(0, 7)}-01`;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("report_profit_loss", { p_from: dari, p_to: sampai });
  if (error) return <Notice tone="error">Gagal memuat laporan: {error.message}</Notice>;

  const r = data as PL;
  const untung = r.laba >= 0;
  const kategori = Object.entries(r.kas_per_kategori ?? {});

  return (
    <div className="space-y-8">
      <PageHeader title="Laporan laba rugi" description="Pendapatan, modal produk terjual, dan arus kas per periode." icon={FileText} />

      <form className="grid grid-cols-1 gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-5">
        <label className="block space-y-1.5">
          <span className={labelClass}>Dari tanggal</span>
          <input type="date" name="dari" defaultValue={dari} className={inputClass} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>Sampai tanggal</span>
          <input type="date" name="sampai" defaultValue={sampai} className={inputClass} />
        </label>
        <button className={btn.primary}>
          <Search /> Tampilkan
        </button>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatPatch tone="persik" label="Pendapatan" value={rupiah(r.pendapatan)} />
        <StatPatch tone="mentega" label="Modal terjual" value={rupiah(r.modal_terjual)} />
        <StatPatch tone={untung ? "pucuk" : "persik"} label={untung ? "Laba" : "Rugi"} value={rupiah(r.laba)} icon={untung ? TrendingUp : TrendingDown} />
        <StatPatch tone="sage" label="Unit terjual" value={`${angka(r.unit_terjual)} unit`} icon={Package} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <Panel title="Laba rugi" description="Pendapatan dikurangi modal produk yang terjual" icon={untung ? TrendingUp : TrendingDown}>
          <div className="divide-y">
            <MoneyRow label="Pendapatan penjualan" value={rupiah(r.pendapatan)} />
            <MoneyRow label="Modal produk terjual" value={rupiah(r.modal_terjual)} />
            <MoneyRow label={untung ? "Laba periode ini" : "Rugi periode ini"} value={rupiah(r.laba)} strong />
          </div>
        </Panel>

        <Panel title="Arus kas" description="Uang masuk dan keluar pada periode ini" icon={Wallet}>
          {kategori.length === 0 ? (
            <p className="text-base text-muted-foreground">Tidak ada transaksi kas pada periode ini.</p>
          ) : (
            <div className="divide-y">
              {kategori.map(([k, v]) => {
                const [jenis, cat] = k.split(":");
                return (
                  <MoneyRow
                    key={k}
                    label={`${jenis === "in" ? "Masuk" : "Keluar"}: ${KATEGORI[cat] ?? cat}`}
                    value={rupiah(v)}
                  />
                );
              })}
            </div>
          )}
          <div className="mt-2 divide-y border-t">
            <MoneyRow label="Total masuk" value={rupiah(r.kas_masuk)} />
            <MoneyRow label="Total keluar" value={rupiah(r.kas_keluar)} />
            <MoneyRow label="Saldo kas saat ini" value={rupiah(r.saldo_kas)} strong />
          </div>
        </Panel>
      </div>
    </div>
  );
}
