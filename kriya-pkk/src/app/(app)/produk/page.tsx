import { ChevronDown, Package, Receipt, ShoppingBag, ShoppingCart } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { Badge, EmptyState, PageHeader, Panel, StatPatch } from "@/components/kriya-ui";
import { recordSale } from "@/lib/actions/ops";

// FR28 stok produk jadi, FR27 catat penjualan manual
export default async function ProdukPage() {
  await requireMe(["pengurus"]);
  const supabase = await createClient();
  const [{ data: goods }, { data: sales }] = await Promise.all([
    supabase.from("finished_goods").select("id, name, qty, unit_cost, sell_price").gt("qty", 0).order("created_at", { ascending: false }),
    supabase
      .from("sales")
      .select("id, qty, total, buyer_name, sold_at, produk:finished_goods(name)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const items = goods ?? [];
  const stockValue = items.reduce((s, g) => s + Number(g.qty) * Number(g.sell_price), 0);
  const totalUnits = items.reduce((s, g) => s + Number(g.qty), 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Produk dan penjualan" description="Stok kerajinan siap jual. Buka produk untuk mencatat penjualan." icon={ShoppingBag} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatPatch tone="persik" label="Nilai jual stok" value={rupiah(stockValue)} icon={ShoppingCart} />
        <StatPatch tone="pucuk" label="Unit siap jual" value={`${totalUnits} unit`} icon={Package} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <section>
          <h2 className="mb-3 text-lg font-bold text-tinta">Stok produk ({items.length})</h2>
          {items.length === 0 ? (
            <EmptyState icon={Package} title="Belum ada produk jadi" text="Produk muncul setelah hasil produksi dicatat." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((g) => (
                <details key={g.id} className="group rounded-2xl border bg-card open:border-sage">
                  <summary className="flex cursor-pointer items-start justify-between gap-3 p-5">
                    <div className="min-w-0">
                      <p className="text-lg font-bold leading-snug text-tinta">{g.name}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge tone="pucuk">{g.qty} unit</Badge>
                        <Badge tone="persik">Jual {rupiah(g.sell_price)}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Modal {rupiah(g.unit_cost)} per unit</p>
                    </div>
                    <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-hutan">
                      Jual <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
                    </span>
                  </summary>
                  <div className="border-t p-5">
                    <ActionForm action={recordSale.bind(null, g.id)} submitLabel="Simpan penjualan">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label={`Jumlah (maks. ${g.qty})`} name="qty" type="number" min={1} max={g.qty} defaultValue={1} />
                        <Field label="Harga satuan (Rp)" name="unit_price" type="number" defaultValue={Number(g.sell_price)} />
                      </div>
                      <Field label="Nama pembeli" name="buyer" required={false} placeholder="Contoh: Bu Lurah" />
                    </ActionForm>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>

        <Panel title="Penjualan terakhir" icon={Receipt} bodyClassName="p-0">
          {!sales?.length ? (
            <p className="p-5 text-base text-muted-foreground">Belum ada penjualan.</p>
          ) : (
            <ul className="divide-y">
              {sales.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="font-semibold text-tinta">
                      {s.qty}× {(s.produk as unknown as { name: string } | null)?.name ?? "Produk"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tanggal(s.sold_at)}
                      {s.buyer_name && `, ${s.buyer_name}`}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold tabular-nums text-tinta">{rupiah(s.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
