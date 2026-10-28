import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MapPin, Package, Recycle, Store, Weight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";
import { Badge, Panel } from "@/components/kriya-ui";
import { infoKategori } from "@/lib/marketplace/kategori";
import { titikValid } from "@/lib/marketplace/geo";
import { FotoProduk } from "@/components/toko/foto-produk";
import { KartuProduk, type ProdukKatalog } from "@/components/toko/kartu-produk";
import { PetaLokasi } from "@/components/toko/peta-lokasi";
import { TambahKeranjang } from "@/components/toko/tambah-keranjang";

type Detail = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  sell_price: number;
  qty: number;
  photo_path: string | null;
  waste_materials: string[];
  weight_grams: number;
  posko: { name: string; slug: string; address: string | null; city: string | null; latitude: number | null; longitude: number | null };
  lainnya: ProdukKatalog[];
};

async function muat(id: string): Promise<Detail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("katalog_detail", { p_id: id });
  return (data as Detail | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const d = await muat((await params).id);
  return { title: d ? `${d.name} · ${d.posko.name} · KriyaPKK` : "Produk · KriyaPKK" };
}

export default async function ProdukDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const d = await muat((await params).id);
  if (!d) notFound();
  const k = infoKategori(d.category);
  const titik = { lat: Number(d.posko.latitude), lng: Number(d.posko.longitude) };
  const berat = d.weight_grams >= 1000 ? `${(d.weight_grams / 1000).toLocaleString("id-ID")} kg` : `${d.weight_grams} g`;

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <Link href="/katalog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-tinta">
          <ArrowLeft className="size-4" /> Katalog
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
          <div className="aspect-square overflow-hidden rounded-3xl border bg-muted lg:sticky lg:top-24 lg:self-start">
            <FotoProduk path={d.photo_path} name={d.name} category={d.category} ikonClass="size-20" />
          </div>

          <div className="min-w-0 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge tone={k.tone} icon={k.icon}>{k.label}</Badge>
                <Link href={`/katalog?posko=${d.posko.slug}`}>
                  <Badge tone="sage" icon={Store}>{d.posko.name}</Badge>
                </Link>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-balance text-tinta sm:text-4xl">{d.name}</h1>
              <p className="text-3xl font-extrabold tabular-nums text-hutan">{rupiah(d.sell_price)}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-base text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Package className="size-4" aria-hidden />
                  {d.qty > 0 ? `Stok ${d.qty}` : "Stok habis"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Weight className="size-4" aria-hidden /> ±{berat}
                </span>
                {d.posko.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden /> {d.posko.city}
                  </span>
                )}
              </div>
            </div>

            <TambahKeranjang
              produk={{
                id: d.id,
                name: d.name,
                price: Number(d.sell_price),
                max: d.qty,
                photo_path: d.photo_path,
                category: d.category,
                posko_slug: d.posko.slug,
                posko_name: d.posko.name,
              }}
            />

            <section className="jahitan rounded-2xl bg-mentega p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-tinta">
                <Recycle className="size-5" aria-hidden /> Bahan limbah yang dipakai
              </h2>
              {d.waste_materials.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {d.waste_materials.map((m) => (
                    <li key={m} className="rounded-full bg-card px-3 py-1.5 text-base font-semibold text-tinta">{m}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-base text-mentega-ink">Belum diisi oleh posko.</p>
              )}
            </section>

            {d.description && (
              <section>
                <h2 className="text-lg font-bold text-tinta">Tentang produk</h2>
                <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-tinta/85">{d.description}</p>
              </section>
            )}

            <Panel title={d.posko.name} description="Posko PKK pembuat" icon={Store}>
              <div className="space-y-4">
                {(d.posko.address || d.posko.city) && (
                  <p className="flex items-start gap-2 text-base text-tinta">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-hutan" aria-hidden />
                    {[d.posko.address, d.posko.city].filter(Boolean).join(", ")}
                  </p>
                )}
                {titikValid(titik) ? (
                  <PetaLokasi titik={titik} judul={d.posko.name} />
                ) : (
                  <p className="text-base text-muted-foreground">Titik lokasi posko belum diisi.</p>
                )}
                <Link href={`/katalog?posko=${d.posko.slug}`} className="inline-flex text-base font-semibold text-hutan underline-offset-4 hover:underline">
                  Semua produk dari posko ini
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {d.lainnya.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-tinta">Produk lain dari {d.posko.name}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {d.lainnya.map((p) => (
              <KartuProduk key={p.id} p={{ ...p, posko_name: d.posko.name }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
