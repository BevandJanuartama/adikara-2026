import Link from "next/link";
import type { Metadata } from "next";
import { PackageSearch, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { btn, EmptyState, inputClass } from "@/components/kriya-ui";
import { KATEGORI, isKategori } from "@/lib/marketplace/kategori";
import { KartuProduk, type ProdukKatalog } from "@/components/toko/kartu-produk";

export const metadata: Metadata = { title: "Katalog produk olahan limbah · KriyaPKK" };

type SP = { q?: string; kategori?: string; posko?: string };

// URL filter yang mempertahankan pencarian lain
function href(sp: SP, ubah: Partial<SP>) {
  const p = new URLSearchParams();
  const v = { ...sp, ...ubah };
  if (v.q) p.set("q", v.q);
  if (v.kategori) p.set("kategori", v.kategori);
  if (v.posko) p.set("posko", v.posko);
  const s = p.toString();
  return s ? `/katalog?${s}` : "/katalog";
}

export default async function KatalogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const kategori = isKategori(sp.kategori) ? sp.kategori : undefined;
  const posko = sp.posko?.slice(0, 80) || undefined;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("katalog_list", {
    p_q: q || null,
    p_category: kategori ?? null,
    p_posko: posko ?? null,
    p_limit: 120,
  });
  const produk = (data ?? []) as (ProdukKatalog & { posko_slug: string })[];
  const namaPosko = posko ? produk[0]?.posko_name ?? posko : null;

  return (
    <div className="space-y-6">
      <section className="jahitan relative overflow-hidden rounded-3xl bg-pucuk px-5 py-7 sm:px-8 sm:py-9">
        <p className="text-sm font-semibold text-pucuk-ink">Katalog posko PKK</p>
        <h1 className="mt-1 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-balance text-tinta sm:text-4xl">
          Produk olahan limbah, dibuat ibu-ibu PKK
        </h1>
        <p className="mt-2 max-w-xl text-base text-tinta/80">
          Dari kain perca, minyak jelantah, sampai sisa dapur. Ambil di posko atau kirim lewat kurir lokal.
        </p>
        <form action="/katalog" className="mt-5 flex max-w-xl gap-2">
          {kategori && <input type="hidden" name="kategori" value={kategori} />}
          {posko && <input type="hidden" name="posko" value={posko} />}
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Cari produk</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Cari produk, bahan, atau posko"
              className={cn(inputClass, "pl-11")}
            />
          </label>
          <button type="submit" className={cn(btn.primary, "shrink-0 px-4 sm:px-5")}>
            <Search className="sm:hidden" />
            <span className="hidden sm:inline">Cari</span>
          </button>
        </form>
      </section>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 pb-1 sm:w-auto sm:flex-wrap">
          <Link
            href={href(sp, { kategori: undefined })}
            aria-current={!kategori ? "page" : undefined}
            className={cn(
              "inline-flex h-11 items-center rounded-full border px-4 text-base font-semibold",
              !kategori ? "border-hutan bg-hutan text-white" : "bg-card text-tinta hover:bg-daun-muda",
            )}
          >
            Semua
          </Link>
          {KATEGORI.map((k) => {
            const on = kategori === k.key;
            const Icon = k.icon;
            return (
              <Link
                key={k.key}
                href={href(sp, { kategori: k.key })}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-base font-semibold",
                  on ? "border-hutan bg-hutan text-white" : "bg-card text-tinta hover:bg-daun-muda",
                )}
              >
                <Icon className="size-4" aria-hidden /> {k.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base text-muted-foreground">
          {error ? "Katalog belum bisa dimuat." : `${produk.length} produk`}
          {q && (
            <>
              {" "}untuk <span className="font-semibold text-tinta">“{q}”</span>
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {namaPosko && (
            <Link href={href(sp, { posko: undefined })} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-mentega px-3 text-sm font-semibold text-mentega-ink">
              Posko: {namaPosko} <X className="size-4" aria-label="hapus filter posko" />
            </Link>
          )}
          {q && (
            <Link href={href(sp, { q: undefined })} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-muted px-3 text-sm font-semibold text-tinta">
              Hapus pencarian <X className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>

      {produk.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Produk tidak ditemukan"
          text="Coba kata lain atau pilih kategori Semua."
          action={<Link href="/katalog" className={btn.outline}>Lihat semua produk</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {produk.map((p) => (
            <KartuProduk key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
