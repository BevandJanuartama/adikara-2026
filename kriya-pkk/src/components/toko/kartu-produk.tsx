import Link from "next/link";
import { Store } from "lucide-react";
import { rupiah } from "@/lib/format";
import { infoKategori } from "@/lib/marketplace/kategori";
import { FotoProduk } from "@/components/toko/foto-produk";

export type ProdukKatalog = {
  id: string;
  name: string;
  category: string;
  sell_price: number;
  qty: number;
  photo_path: string | null;
  posko_name?: string | null;
  posko_city?: string | null;
};

export function KartuProduk({ p }: { p: ProdukKatalog }) {
  const k = infoKategori(p.category);
  const habis = Number(p.qty) <= 0;
  return (
    <Link
      href={`/katalog/${p.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:border-sage hover:shadow-[0_12px_28px_-18px_rgba(36,54,31,.5)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-muted">
        <FotoProduk path={p.photo_path} name={p.name} category={p.category} className="transition duration-300 group-hover:scale-[1.03]" />
        <span className="absolute left-2 top-2 rounded-full bg-card/95 px-2.5 py-1 text-sm font-semibold text-tinta shadow-sm">
          {k.label}
        </span>
        {habis && (
          <span className="absolute inset-x-0 bottom-0 bg-tinta/80 py-1.5 text-center text-sm font-semibold text-white">Stok habis</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <p className="line-clamp-2 text-base font-bold leading-snug text-tinta">{p.name}</p>
        <p className="text-lg font-extrabold tabular-nums text-hutan">{rupiah(p.sell_price)}</p>
        {p.posko_name && (
          <span className="mt-auto inline-flex min-w-0 max-w-full items-center gap-1.5 self-start rounded-full bg-daun-muda px-2.5 py-1 text-sm font-semibold text-hutan">
            <Store className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{p.posko_name}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
