import { ArrowDownLeft, ArrowUpRight, BookOpenCheck, ChevronDown, Download, CirclePlus, RotateCcw, Wallet } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ActionForm, Field } from "@/components/action-form";
import { EmptyState, PageHeader, Panel, StatPatch, btn, inputClass, labelClass } from "@/components/kriya-ui";
import { addCash, reverseCash } from "@/lib/actions/ops";

const CAT: Record<string, string> = {
  modal_awal: "Modal awal",
  pembelian_setoran: "Bayar setoran warga",
  bahan_tambahan: "Bahan tambahan",
  upah: "Upah",
  penjualan: "Penjualan",
  lainnya: "Lainnya",
  koreksi: "Koreksi",
};

function AddCashForm() {
  return (
    <ActionForm action={addCash} submitLabel="Simpan entri">
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className={labelClass}>Jenis</span>
          <select name="entry_type" className={inputClass}>
            <option value="in">Pemasukan</option>
            <option value="out">Pengeluaran</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>Kategori</span>
          <select name="category" className={inputClass}>
            <option value="modal_awal">Modal awal</option>
            <option value="bahan_tambahan">Bahan tambahan</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </label>
      </div>
      <Field label="Jumlah (Rp)" name="amount" type="number" min={1} placeholder="50000" />
      <Field label="Catatan" name="note" required={false} placeholder="Contoh: beli tali kur" />
    </ActionForm>
  );
}

// FR29: buku kas — koreksi lewat entri pembalik, tidak ada hapus
export default async function KasPage() {
  await requireMe(["pengurus"]);
  const supabase = await createClient();
  const [{ data: rows }, { data: pl }] = await Promise.all([
    supabase
      .from("cash_ledger")
      .select("id, entry_type, category, amount, note, entry_date, reverses_id")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.rpc("report_profit_loss", { p_from: "2000-01-01", p_to: "2100-01-01" }),
  ]);
  const list = rows ?? [];
  const reversed = new Set(list.map((r) => r.reverses_id).filter(Boolean));
  const report = (pl ?? {}) as { saldo_kas?: number; kas_masuk?: number; kas_keluar?: number };

  const Amount = ({ isIn, amount }: { isIn: boolean; amount: number }) => (
    <span className={cn("whitespace-nowrap font-bold tabular-nums", isIn ? "text-hutan" : "text-bata-ink")}>
      {isIn ? "+" : "−"}
      {rupiah(amount)}
    </span>
  );
  const Reverse = ({ id }: { id: string }) => (
    <details className="group/rev">
      <summary className="inline-flex cursor-pointer items-center gap-1 rounded-md text-sm font-semibold text-bata-ink hover:underline">
        <RotateCcw className="size-4" aria-hidden /> Koreksi
      </summary>
      <div className="mt-2 w-60">
        <ActionForm action={reverseCash.bind(null, id)} submitLabel="Buat entri pembalik" variant="destructive" />
      </div>
    </details>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Buku kas"
        description="Semua uang masuk dan keluar kelompok. Kesalahan dikoreksi dengan entri pembalik, tidak dihapus."
        icon={BookOpenCheck}
        actions={
          <a href="/api/export/kas" className={btn.outline}>
            <Download /> Unduh CSV
          </a>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <StatPatch tone="persik" label="Saldo kas" value={rupiah(report.saldo_kas ?? 0)} icon={Wallet} className="col-span-2 md:col-span-1" />
        <StatPatch tone="pucuk" label="Total masuk" value={rupiah(report.kas_masuk ?? 0)} icon={ArrowDownLeft} />
        <StatPatch tone="mentega" label="Total keluar" value={rupiah(report.kas_keluar ?? 0)} icon={ArrowUpRight} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
        <div className="order-2 xl:order-1">
          <h2 className="mb-3 text-lg font-bold text-tinta">Riwayat transaksi</h2>
          {list.length === 0 ? (
            <EmptyState icon={BookOpenCheck} title="Belum ada catatan kas" text="Mulai dengan mencatat modal awal kelompok." />
          ) : (
            <>
              <ul className="divide-y rounded-2xl border bg-card lg:hidden">
                {list.map((r) => {
                  const isIn = r.entry_type === "in";
                  return (
                    <li key={r.id} className="space-y-1.5 px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-tinta">{CAT[r.category] ?? r.category}</p>
                          <p className="text-sm text-muted-foreground">{tanggal(r.entry_date)}</p>
                        </div>
                        <Amount isIn={isIn} amount={r.amount} />
                      </div>
                      {r.note && <p className="text-sm text-muted-foreground">{r.note}</p>}
                      {!r.reverses_id && !reversed.has(r.id) && <Reverse id={r.id} />}
                    </li>
                  );
                })}
              </ul>

              <div className="hidden overflow-hidden rounded-2xl border bg-card lg:block">
                <table className="w-full text-left text-base">
                  <thead className="border-b bg-daun-muda/60 text-sm text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">Tanggal</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Kategori</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Catatan</th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">Jumlah</th>
                      <th scope="col" className="px-5 py-3"><span className="sr-only">Aksi</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {list.map((r) => (
                      <tr key={r.id} className="align-top hover:bg-daun-muda/40">
                        <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{tanggal(r.entry_date)}</td>
                        <td className="px-5 py-3 font-semibold text-tinta">{CAT[r.category] ?? r.category}</td>
                        <td className="px-5 py-3 text-muted-foreground">{r.note || "-"}</td>
                        <td className="px-5 py-3 text-right"><Amount isIn={r.entry_type === "in"} amount={r.amount} /></td>
                        <td className="px-5 py-3 text-right">{!r.reverses_id && !reversed.has(r.id) && <Reverse id={r.id} />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="order-1 xl:order-2 xl:sticky xl:top-10">
          <details className="group rounded-2xl border bg-card xl:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-base font-bold text-tinta">
              <span className="flex items-center gap-2"><CirclePlus className="size-5 text-hutan" aria-hidden /> Tambah entri manual</span>
              <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="border-t p-5"><AddCashForm /></div>
          </details>
          <Panel title="Tambah entri manual" icon={CirclePlus} className="hidden xl:block">
            <AddCashForm />
          </Panel>
        </div>
      </div>
    </div>
  );
}
