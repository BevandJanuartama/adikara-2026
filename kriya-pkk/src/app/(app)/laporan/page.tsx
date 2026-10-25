import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, angka } from "@/lib/format";

type PL = {
  pendapatan: number; modal_terjual: number; laba: number; unit_terjual: number;
  kas_masuk: number; kas_keluar: number; kas_per_kategori: Record<string, number>; saldo_kas: number;
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
  if (error) return <p className="text-red-700">{error.message}</p>;
  const r = data as PL;

  const line = (label: string, v: number, bold = false) => (
    <p className={`flex justify-between py-1 text-lg ${bold ? "font-bold" : ""}`}><span>{label}</span><span>{rupiah(v)}</span></p>
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Laporan laba rugi</h1>
      <form className="grid grid-cols-2 gap-2">
        <input type="date" name="dari" defaultValue={dari} className="h-12 rounded-md border px-2 text-base" />
        <input type="date" name="sampai" defaultValue={sampai} className="h-12 rounded-md border px-2 text-base" />
        <button className="col-span-2 h-12 rounded-md border text-base">Tampilkan</button>
      </form>

      <section className="rounded-xl border p-4">
        {line("Pendapatan penjualan", r.pendapatan)}
        {line("Modal produk terjual (HPP)", r.modal_terjual)}
        <hr className="my-1" />
        {line("Laba", r.laba, true)}
        <p className="text-base text-muted-foreground">{angka(r.unit_terjual)} unit terjual</p>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 text-lg font-semibold">Arus kas periode ini</h2>
        {Object.entries(r.kas_per_kategori).map(([k, v]) => (
          <p key={k} className="flex justify-between text-base"><span>{k.replace(":", " · ").replace("_", " ")}</span><span>{rupiah(v)}</span></p>
        ))}
        <hr className="my-2" />
        {line("Kas masuk", r.kas_masuk)}
        {line("Kas keluar", r.kas_keluar)}
        {line("Saldo kas saat ini", r.saldo_kas, true)}
      </section>
    </div>
  );
}
