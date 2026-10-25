import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { addCash, reverseCash } from "@/lib/actions/ops";

const CAT: Record<string, string> = {
  modal_awal: "Modal awal", pembelian_setoran: "Bayar setoran warga", bahan_tambahan: "Bahan tambahan",
  upah: "Upah", penjualan: "Penjualan", lainnya: "Lainnya", koreksi: "Koreksi",
};

// FR29: buku kas — koreksi lewat entri pembalik, tidak ada hapus
export default async function KasPage() {
  await requireMe(["pengurus"]);
  const supabase = await createClient();
  const [{ data: rows }, { data: pl }] = await Promise.all([
    supabase.from("cash_ledger").select("id, entry_type, category, amount, note, entry_date, reverses_id")
      .order("created_at", { ascending: false }).limit(100),
    supabase.rpc("report_profit_loss", { p_from: "2000-01-01", p_to: "2100-01-01" }),
  ]);
  const reversed = new Set((rows ?? []).map((r) => r.reverses_id).filter(Boolean));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Buku kas</h1>
        <a href="/api/export/kas" className="rounded-lg border px-3 py-2 text-base">Unduh CSV</a>
      </div>
      <p className="text-xl">Saldo kas: <b>{rupiah((pl as { saldo_kas: number } | null)?.saldo_kas)}</b></p>

      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer text-base font-semibold">+ Entri manual</summary>
        <ActionForm action={addCash} submitLabel="Simpan entri" className="mt-3 space-y-2">
          <select name="entry_type" className="h-12 w-full rounded-md border px-3 text-base">
            <option value="in">Pemasukan</option><option value="out">Pengeluaran</option>
          </select>
          <select name="category" className="h-12 w-full rounded-md border px-3 text-base">
            <option value="modal_awal">Modal awal</option>
            <option value="bahan_tambahan">Bahan tambahan</option>
            <option value="lainnya">Lainnya</option>
          </select>
          <Field label="Jumlah (Rp)" name="amount" type="number" min={1} />
          <Field label="Catatan" name="note" required={false} />
        </ActionForm>
      </details>

      <ul className="divide-y rounded-xl border">
        {(rows ?? []).map((r) => (
          <li key={r.id} className="space-y-1 p-3">
            <div className="flex justify-between text-base">
              <span>{tanggal(r.entry_date)} · {CAT[r.category] ?? r.category}</span>
              <b className={r.entry_type === "in" ? "text-green-700" : "text-red-700"}>
                {r.entry_type === "in" ? "+" : "−"}{rupiah(r.amount)}
              </b>
            </div>
            {r.note && <p className="text-sm text-muted-foreground">{r.note}</p>}
            {!r.reverses_id && !reversed.has(r.id) && (
              <details>
                <summary className="cursor-pointer text-sm underline">Koreksi</summary>
                <ActionForm action={reverseCash.bind(null, r.id)} submitLabel="Buat entri pembalik" variant="outline" className="mt-2" />
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
