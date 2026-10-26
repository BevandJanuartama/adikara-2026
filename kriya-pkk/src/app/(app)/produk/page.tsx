import Link from "next/link";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { recordSale } from "@/lib/actions/ops";
import {
  ShoppingBag,
  Package,
  Tags,
  Banknote,
  ChevronDown,
  Receipt,
  ShoppingCart,
  Store,
} from "lucide-react";

// FR28 stok produk jadi, FR27 catat penjualan manual
export default async function ProdukPage() {
  await requireMe(["pengurus"]);
  const supabase = await createClient();
  const [{ data: goods }, { data: sales }] = await Promise.all([
    supabase
      .from("finished_goods")
      .select("id, name, qty, unit_cost, sell_price")
      .gt("qty", 0)
      .order("created_at", { ascending: false }),
    supabase
      .from("sales")
      .select(
        "id, qty, total, buyer_name, sold_at, produk:finished_goods(name)",
      )
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      {/* Header & Judul */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Produk Jadi & Penjualan
          </h1>
          <p className="text-xs text-muted-foreground">
            Kelola stok kerajinan siap jual dan pencatatan transaksi
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 shadow-2xs">
          <ShoppingBag className="h-6 w-6" />
        </div>
      </div>

      {/* Daftar Produk Jadi */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
          Stok Produk Tersedia
        </h2>

        {!goods || goods.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center space-y-3 shadow-2xs">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <Package className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Belum ada produk jadi dengan stok tersedia.
              <br />
              Selesaikan batch produksi terlebih dahulu.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {goods.map((g) => (
              <details
                key={g.id}
                className="group rounded-2xl border bg-card p-4 shadow-2xs transition-all hover:border-emerald-500"
              >
                <summary className="flex cursor-pointer items-center justify-between list-none">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-foreground group-hover:text-emerald-700 transition-colors">
                        {g.name}
                      </p>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        Stok: {g.qty} unit
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Modal:{" "}
                      <strong className="text-foreground">
                        {rupiah(g.unit_cost)}
                      </strong>{" "}
                      · Jual:{" "}
                      <strong className="text-emerald-700">
                        {rupiah(g.sell_price)}
                      </strong>
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-1 text-muted-foreground group-open:rotate-180 transition-transform">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </summary>

                <div className="mt-4 border-t pt-4">
                  <ActionForm
                    action={recordSale.bind(null, g.id)}
                    submitLabel="Catat Penjualan"
                    className="space-y-3 rounded-xl border bg-muted/20 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-emerald-700" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Form Transaksi Penjualan
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label={`Jumlah (Maks ${g.qty})`}
                        name="qty"
                        type="number"
                        min={1}
                        max={g.qty}
                        defaultValue={1}
                      />
                      <Field
                        label="Harga Satuan (Rp)"
                        name="unit_price"
                        type="number"
                        defaultValue={Number(g.sell_price)}
                      />
                    </div>

                    <Field
                      label="Nama Pembeli (Opsional)"
                      name="buyer"
                      required={false}
                      placeholder="Contoh: Ibu Lurah / Umum"
                    />
                  </ActionForm>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      {/* Bagian Penjualan Terakhir */}
      <section className="space-y-3 pt-4 border-t">
        <div className="flex items-center gap-2 px-1">
          <Receipt className="h-5 w-5 text-emerald-700" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Penjualan Terakhir
          </h2>
        </div>

        {!sales || sales.length === 0 ? (
          <div className="rounded-2xl border bg-card p-6 text-center text-xs text-muted-foreground shadow-2xs">
            Belum ada riwayat transaksi penjualan.
          </div>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card shadow-2xs overflow-hidden">
            {sales.map((s) => {
              const productName =
                (s.produk as unknown as { name: string } | null)?.name ??
                "Produk";
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between p-4 text-xs sm:text-sm transition-colors hover:bg-muted/30"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground">
                      {s.qty}× {productName}{" "}
                      {s.buyer_name && (
                        <span className="font-normal text-muted-foreground">
                          ({s.buyer_name})
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {tanggal(s.sold_at)}
                    </p>
                  </div>
                  <span className="font-extrabold text-emerald-700 text-base">
                    {rupiah(s.total)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
