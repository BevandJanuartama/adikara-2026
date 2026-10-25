import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { recordSale } from "@/lib/actions/ops";

// FR28 stok produk jadi, FR27 catat penjualan manual
export default async function ProdukPage() {
  await requireMe(["pengurus"]);
  const supabase = await createClient();
  const [{ data: goods }, { data: sales }] = await Promise.all([
    supabase.from("finished_goods").select("id, name, qty, unit_cost, sell_price").gt("qty", 0).order("created_at", { ascending: false }),
    supabase.from("sales").select("id, qty, total, buyer_name, sold_at, produk:finished_goods(name)").order("created_at", { ascending: false }).limit(20),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Produk jadi</h1>
      {(goods ?? []).map((g) => (
        <details key={g.id} className="rounded-xl border p-4">
          <summary className="cursor-pointer">
            <span className="text-lg font-semibold">{g.name}</span>
            <span className="block text-base">Stok {g.qty} · modal {rupiah(g.unit_cost)} · jual {rupiah(g.sell_price)}</span>
          </summary>
          <ActionForm action={recordSale.bind(null, g.id)} submitLabel="Catat penjualan" className="mt-3 space-y-2">
            <Field label="Jumlah" name="qty" type="number" min={1} max={g.qty} defaultValue={1} />
            <Field label="Harga per unit (Rp)" name="unit_price" type="number" defaultValue={Number(g.sell_price)} />
            <Field label="Nama pembeli (opsional)" name="buyer" required={false} />
          </ActionForm>
        </details>
      ))}
      {!goods?.length && <p className="text-base text-muted-foreground">Belum ada produk jadi.</p>}

      <section>
        <h2 className="mb-2 text-lg font-semibold">Penjualan terakhir</h2>
        <ul className="divide-y rounded-xl border">
          {(sales ?? []).map((s) => (
            <li key={s.id} className="flex justify-between p-3 text-base">
              <span>{tanggal(s.sold_at)} · {s.qty}× {(s.produk as unknown as { name: string } | null)?.name}{s.buyer_name && ` · ${s.buyer_name}`}</span>
              <b>{rupiah(s.total)}</b>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
