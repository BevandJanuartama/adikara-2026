import Link from "next/link";
import { ChevronDown, CirclePlus, Eye, EyeOff, Package, PencilLine, Receipt, ShoppingBag, ShoppingCart, Store } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { Badge, btn, EmptyState, PageHeader, Panel, StatPatch } from "@/components/kriya-ui";
import { FotoProduk } from "@/components/toko/foto-produk";
import { infoKategori } from "@/lib/marketplace/kategori";
import { recordSale } from "@/lib/actions/ops";
import { ProductForm, type ProdukForm } from "./product-form";

// FR28 stok produk jadi, FR27 catat penjualan langsung, + katalog online
export default async function ProdukPage() {
  const me = await requireMe(["pengurus"]);
  const supabase = await createClient();
  const [{ data: goods }, { data: sales }] = await Promise.all([
    supabase
      .from("finished_goods")
      .select("id, name, qty, unit_cost, sell_price, category, description, waste_materials, weight_grams, photo_path, is_listed")
      .order("qty", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("sales")
      .select("id, qty, total, buyer_name, sold_at, produk:finished_goods(name)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const items = (goods ?? []) as ProdukForm[];
  const stockValue = items.reduce((s, g) => s + Number(g.qty) * Number(g.sell_price), 0);
  const totalUnits = items.reduce((s, g) => s + Number(g.qty), 0);
  const tampil = items.filter((g) => g.is_listed && g.qty > 0).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Produk & katalog"
        description="Stok produk siap jual, tampilan di toko online, dan penjualan langsung di posko."
        icon={ShoppingBag}
        actions={
          <Link href="/katalog" className={btn.outline}>
            <Store /> Lihat toko
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <StatPatch tone="persik" label="Nilai jual stok" value={rupiah(stockValue)} icon={ShoppingCart} className="col-span-2 md:col-span-1" />
        <StatPatch tone="pucuk" label="Unit siap jual" value={`${totalUnits} unit`} icon={Package} />
        <StatPatch tone="mentega" label="Tampil di katalog" value={`${tampil} produk`} icon={Eye} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
        <section className="min-w-0">
          <h2 className="mb-3 text-lg font-bold text-tinta">Daftar produk ({items.length})</h2>
          {items.length === 0 ? (
            <EmptyState icon={Package} title="Belum ada produk" text="Produk muncul setelah hasil produksi dicatat, atau tambahkan sendiri lewat formulir Tambah produk." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {items.map((g) => {
                const k = infoKategori(g.category);
                return (
                  <article key={g.id} className="flex flex-col rounded-2xl border bg-card">
                    <div className="flex gap-4 p-4">
                      <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <FotoProduk path={g.photo_path} name={g.name} category={g.category} ikonClass="size-7" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold leading-snug text-tinta">{g.name}</p>
                        <p className="mt-0.5 text-base font-semibold tabular-nums text-hutan">{rupiah(g.sell_price)}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge tone={g.qty > 0 ? "pucuk" : "bata"}>{g.qty > 0 ? `${g.qty} unit` : "Habis"}</Badge>
                          <Badge tone={k.tone} icon={k.icon}>{k.label}</Badge>
                          {g.is_listed ? <Badge tone="sage" icon={Eye}>Di katalog</Badge> : <Badge icon={EyeOff}>Tidak tampil</Badge>}
                        </div>
                      </div>
                    </div>

                    <details className="group/ubah border-t">
                      <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-base font-semibold text-hutan">
                        <span className="inline-flex items-center gap-2"><PencilLine className="size-4" /> Ubah produk & katalog</span>
                        <ChevronDown className="size-5 transition-transform group-open/ubah:rotate-180" aria-hidden />
                      </summary>
                      <div className="border-t p-4">
                        <ProductForm groupId={me.group!.id} p={g} />
                      </div>
                    </details>

                    {g.qty > 0 && (
                      <details className="group/jual border-t">
                        <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-base font-semibold text-hutan">
                          <span className="inline-flex items-center gap-2"><Receipt className="size-4" /> Catat jual langsung</span>
                          <ChevronDown className="size-5 transition-transform group-open/jual:rotate-180" aria-hidden />
                        </summary>
                        <div className="border-t p-4">
                          <ActionForm action={recordSale.bind(null, g.id)} submitLabel="Simpan penjualan">
                            <div className="grid grid-cols-2 gap-3">
                              <Field label={`Jumlah (maks. ${g.qty})`} name="qty" type="number" min={1} max={g.qty} defaultValue={1} />
                              <Field label="Harga satuan (Rp)" name="unit_price" type="number" defaultValue={Number(g.sell_price)} />
                            </div>
                            <Field label="Nama pembeli" name="buyer" required={false} placeholder="Contoh: Bu Lurah" />
                          </ActionForm>
                        </div>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="space-y-6 xl:sticky xl:top-10">
          <details className="group/tambah rounded-2xl border border-dashed bg-card xl:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-5 py-4 text-lg font-bold text-tinta">
              <span className="inline-flex items-center gap-2"><CirclePlus className="size-5 text-hutan" /> Tambah produk</span>
              <ChevronDown className="size-5 transition-transform group-open/tambah:rotate-180" aria-hidden />
            </summary>
            <div className="border-t p-5">
              <ProductForm groupId={me.group!.id} />
            </div>
          </details>
          <Panel title="Tambah produk" description="Untuk produk di luar alur produksi, mis. pupuk kompos atau sabun jelantah." icon={CirclePlus} className="hidden border-dashed xl:block">
            <ProductForm groupId={me.group!.id} />
          </Panel>

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
    </div>
  );
}
