import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { addCash, reverseCash } from "@/lib/actions/ops";
import {
  BookOpenCheck,
  Wallet,
  Download,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";

const CAT: Record<string, string> = {
  modal_awal: "Modal awal",
  pembelian_setoran: "Bayar setoran warga",
  bahan_tambahan: "Bahan tambahan",
  upah: "Upah",
  penjualan: "Penjualan",
  lainnya: "Lainnya",
  correksi: "Koreksi",
};

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
    supabase.rpc("report_profit_loss", {
      p_from: "2000-01-01",
      p_to: "2100-01-01",
    }),
  ]);
  const reversed = new Set(
    (rows ?? []).map((r) => r.reverses_id).filter(Boolean),
  );
  const saldoKas = Number(
    (pl as { saldo_kas?: number } | null)?.saldo_kas ?? 0,
  );

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      {/* Header & Tombol CSV */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buku Kas</h1>
          <p className="text-xs text-muted-foreground">
            Pencatatan arus kas masuk dan keluar kelompok PKK
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/kas"
            className="inline-flex items-center gap-1.5 rounded-xl border bg-card hover:bg-muted px-3.5 py-2 text-xs font-bold shadow-2xs transition-colors"
          >
            <Download className="h-4 w-4 text-emerald-700" />
            <span>Unduh CSV</span>
          </a>
        </div>
      </div>

      {/* Kartu Saldo Kas */}
      <div className="rounded-2xl border bg-gradient-to-br from-emerald-700 to-teal-800 p-5 text-white shadow-md flex items-center justify-between">
        <div>
          <p className="text-xs text-emerald-100 font-medium">
            Saldo Kas Saat Ini
          </p>
          <p className="text-2xl font-bold tracking-tight">
            {rupiah(saldoKas)}
          </p>
        </div>
        <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md shadow-2xs">
          <Wallet className="h-6 w-6 text-emerald-200" />
        </div>
      </div>

      {/* Accordion Entri Manual */}
      <details className="group rounded-2xl border bg-card p-4 shadow-2xs">
        <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-foreground list-none">
          <span className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-emerald-700" /> + Tambah Entri
            Kas Manual
          </span>
          <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>
        <div className="mt-4 border-t pt-4">
          <ActionForm
            action={addCash}
            submitLabel="Simpan Entri Kas"
            className="space-y-3.5"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Jenis Arus
                </label>
                <select
                  name="entry_type"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="in">Pemasukan (+)</option>
                  <option value="out">Pengeluaran (−)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Kategori
                </label>
                <select
                  name="category"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="modal_awal">Modal Awal</option>
                  <option value="bahan_tambahan">Bahan Tambahan</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <Field
              label="Jumlah (Rp)"
              name="amount"
              type="number"
              min={1}
              placeholder="Contoh: 50000"
            />
            <Field
              label="Catatan / Keterangan (Opsional)"
              name="note"
              required={false}
              placeholder="Contoh: Pembelian tali kur tambahan"
            />
          </ActionForm>
        </div>
      </details>

      {/* Daftar Buku Kas */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
          Riwayat Transaksi Kas
        </h2>

        {!rows || rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center space-y-3 shadow-2xs">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <BookOpenCheck className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Belum ada catatan arus kas.
            </p>
          </div>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card shadow-2xs overflow-hidden">
            {rows.map((r) => {
              const isIn = r.entry_type === "in";
              const isReversedOrRev = r.reverses_id || reversed.has(r.id);

              return (
                <li
                  key={r.id}
                  className="p-4 space-y-2 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full p-1 ${isIn ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
                        >
                          {isIn ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <p className="text-xs font-bold text-foreground">
                          {CAT[r.category] ?? r.category}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {tanggal(r.entry_date)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-base font-extrabold ${isIn ? "text-emerald-700" : "text-red-600"}`}
                      >
                        {isIn ? "+" : "−"}
                        {rupiah(r.amount)}
                      </p>
                    </div>
                  </div>

                  {r.note && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-xl">
                      📝 {r.note}
                    </p>
                  )}

                  {!r.reverses_id && !reversed.has(r.id) && (
                    <div className="pt-1">
                      <details className="group/rev">
                        <summary className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline">
                          <RotateCcw className="h-3 w-3" /> Koreksi Transaksi
                          (Buat Entri Pembalik)
                        </summary>
                        <div className="mt-2 pt-2 border-t">
                          <ActionForm
                            action={reverseCash.bind(null, r.id)}
                            submitLabel="Konfirmasi Entri Pembalik"
                            variant="outline"
                            className="max-w-xs"
                          />
                        </div>
                      </details>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
