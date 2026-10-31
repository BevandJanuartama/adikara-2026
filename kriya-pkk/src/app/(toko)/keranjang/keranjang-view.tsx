"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingCart, Store, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { btn, EmptyState, Notice, PageHeader } from "@/components/kriya-ui";
import { keranjang, useKeranjang, type ItemKeranjang } from "@/lib/marketplace/keranjang";
import { FotoProduk } from "@/components/toko/foto-produk";
import { PengaturJumlah } from "@/components/toko/tambah-keranjang";

export function KeranjangView() {
  const items = useKeranjang();
  const [info, setInfo] = useState<string | null>(null);

  // Samakan harga & stok dengan data terbaru sekali saat halaman dibuka
  const ids = useMemo(() => items.map((i) => i.id).sort().join(","), [items]);
  useEffect(() => {
    if (!ids) return;
    let batal = false;
    createClient()
      .rpc("katalog_items", { p_ids: ids.split(",") })
      .then(({ data }) => {
        if (batal || !data) return;
        const dibuang = keranjang.perbarui(data as Parameters<typeof keranjang.perbarui>[0]);
        if (dibuang > 0) setInfo(`${dibuang} produk dihapus karena stoknya habis atau sudah tidak dijual.`);
      });
    return () => {
      batal = true;
    };
  }, [ids]);

  const perPosko = useMemo(() => {
    const m = new Map<string, { nama: string; items: ItemKeranjang[] }>();
    for (const i of items) {
      const g = m.get(i.posko_slug) ?? { nama: i.posko_name, items: [] };
      g.items.push(i);
      m.set(i.posko_slug, g);
    }
    return [...m.entries()];
  }, [items]);

  return (
    <div className="space-y-6">
      <PageHeader title="Keranjang" description="Pesanan dibuat per posko, karena tiap posko mengirim dari lokasinya sendiri." icon={ShoppingCart} />
      {info && <Notice tone="warning">{info}</Notice>}

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Keranjang masih kosong"
          text="Pilih produk olahan limbah dari posko PKK di katalog."
          action={<Link href="/katalog" className={btn.primary}>Lihat katalog</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {perPosko.map(([slug, g]) => {
            const subtotal = g.items.reduce((s, i) => s + i.price * i.qty, 0);
            return (
              <section key={slug} className="flex flex-col rounded-2xl border bg-card">
                <header className="flex items-center gap-2 border-b px-5 py-4">
                  <Store className="size-5 text-hutan" aria-hidden />
                  <h2 className="min-w-0 truncate text-lg font-bold text-tinta">{g.nama}</h2>
                </header>
                <ul className="divide-y">
                  {g.items.map((i) => (
                    <li key={i.id} className="flex gap-3 px-5 py-4">
                      <Link href={`/katalog/${i.id}`} className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <FotoProduk path={i.photo_path} name={i.name} category={i.category} ikonClass="size-7" />
                      </Link>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/katalog/${i.id}`} className="line-clamp-2 text-base font-bold leading-snug text-tinta hover:underline">
                            {i.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => keranjang.hapus(i.id)}
                            aria-label={`Hapus ${i.name}`}
                            className="grid size-10 shrink-0 place-items-center rounded-lg text-bata-ink hover:bg-bata-soft"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <PengaturJumlah value={i.qty} max={i.max} onChange={(n) => keranjang.ubah(i.id, n)} />
                          <span className="text-base font-bold tabular-nums text-tinta">{rupiah(i.price * i.qty)}</span>
                        </div>
                        {i.qty >= i.max && <p className="text-sm text-muted-foreground">Sisa stok {i.max}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
                <footer className="mt-auto space-y-3 border-t px-5 py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-base text-muted-foreground">Subtotal produk</span>
                    <span className="text-xl font-extrabold tabular-nums text-tinta">{rupiah(subtotal)}</span>
                  </div>
                  <Link href={`/checkout?posko=${encodeURIComponent(slug)}`} className={cn(btn.primary, "w-full")}>
                    Checkout dari posko ini <ArrowRight />
                  </Link>
                  <p className="text-center text-sm text-muted-foreground">Ongkir dihitung saat checkout. Perlu masuk dengan akun pembeli.</p>
                </footer>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
