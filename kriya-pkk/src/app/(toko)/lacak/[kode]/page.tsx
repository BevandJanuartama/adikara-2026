import Link from "next/link";
import type { Metadata } from "next";
import { CircleCheck, Clock, MapPin, PackageSearch, Receipt, Store, Truck } from "lucide-react";
import { rupiah, tanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge, btn, EmptyState, MoneyRow, Notice, Panel } from "@/components/kriya-ui";
import { infoStatus, langkahPesanan } from "@/lib/marketplace/status";
import { titikValid } from "@/lib/marketplace/geo";
import { ambilPesananPublik, appUrlDariHeader, sinkronkanDenganMidtrans } from "@/lib/marketplace/pesanan";
import { PetaLokasi } from "@/components/toko/peta-lokasi";
import { TombolBayar } from "./tombol-bayar";

export const metadata: Metadata = { title: "Lacak pesanan · KriyaPKK", robots: { index: false } };

export default async function LacakPage({
  params,
  searchParams,
}: {
  params: Promise<{ kode: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { kode } = await params;
  // Midtrans menambahkan ?order_id=… di URL kembali; ambil token 32 karakter saja
  const t = ((await searchParams).t ?? "").match(/^[0-9a-f]{32}/i)?.[0] ?? "";
  let o = await ambilPesananPublik(kode, t);

  if (!o) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="Pesanan tidak ditemukan"
        text="Buka halaman ini lewat tautan setelah pembayaran. Tautannya berisi kode rahasia pesanan Anda."
        action={<Link href="/katalog" className={btn.outline}>Kembali ke katalog</Link>}
      />
    );
  }

  // Webhook belum sampai (mis. uji di localhost)? tanya langsung ke Midtrans
  if (o.status === "menunggu_bayar" && o.midtrans_token) {
    await sinkronkanDenganMidtrans(o.code, await appUrlDariHeader());
    o = (await ambilPesananPublik(kode, t)) ?? o;
  }

  const st = infoStatus(o.status);
  const ditutup = ["batal", "kedaluwarsa", "gagal"].includes(o.status);
  const langkah = langkahPesanan(o.shipping_method);
  const posisi = langkah.indexOf(o.status as (typeof langkah)[number]);
  const titikPosko = { lat: Number(o.posko.latitude), lng: Number(o.posko.longitude) };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Pesanan {tanggal(o.created_at)}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-tinta sm:text-3xl">{o.code}</h1>
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>
        <p className="text-base text-muted-foreground">
          Dari <span className="font-semibold text-tinta">{o.posko.name}</span> untuk {o.buyer_name}
        </p>
      </header>

      {o.status === "menunggu_bayar" && (
        <div className="jahitan space-y-3 rounded-2xl bg-mentega p-5">
          <p className="flex items-center gap-2 text-lg font-bold text-tinta">
            <Clock className="size-5" aria-hidden /> Selesaikan pembayaran {rupiah(o.total)}
          </p>
          <p className="text-base text-mentega-ink">Bayar dengan QRIS atau Virtual Account dalam 60 menit sejak pesanan dibuat. Setelah itu stok dikembalikan ke posko.</p>
          <TombolBayar code={o.code} token={o.access_token} clientKey={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""} />
        </div>
      )}
      {ditutup && (
        <Notice tone="error">
          {o.status === "kedaluwarsa"
            ? "Waktu pembayaran habis, pesanan dibatalkan otomatis."
            : o.status === "gagal"
              ? "Pembayaran gagal. Silakan pesan ulang dari katalog."
              : "Pesanan dibatalkan."}
        </Notice>
      )}

      {!ditutup && (
        <ol className="grid grid-cols-5 gap-1 sm:gap-2" aria-label="Tahap pesanan">
          {langkah.map((s, i) => {
            const selesai = i < posisi || o.status === "selesai";
            const kini = i === posisi && o.status !== "selesai";
            return (
              <li key={s} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-full text-sm font-bold",
                    selesai ? "bg-hutan text-white" : kini ? "bg-mentega text-tinta ring-2 ring-hutan" : "bg-muted text-muted-foreground",
                  )}
                >
                  {selesai ? <CircleCheck className="size-5" aria-hidden /> : i + 1}
                </span>
                <span className={cn("text-sm leading-tight", kini || selesai ? "font-semibold text-tinta" : "text-muted-foreground")}>
                  {infoStatus(s).label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Panel title="Rincian" icon={Receipt}>
          <ul className="space-y-2">
            {o.items.map((i) => (
              <li key={i.finished_good_id} className="flex justify-between gap-3 text-base">
                <span className="min-w-0 text-tinta">
                  {i.qty}× {i.name}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-tinta">{rupiah(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 divide-y border-t pt-1">
            <MoneyRow label="Subtotal" value={rupiah(o.subtotal)} />
            <MoneyRow label="Ongkir" value={o.shipping_method === "kurir" ? rupiah(o.shipping_cost) : "Gratis"} />
            <MoneyRow label="Total" value={rupiah(o.total)} strong />
          </div>
          {o.paid_at && (
            <p className="mt-2 text-sm text-muted-foreground">
              Dibayar {tanggal(o.paid_at)}
              {o.payment_type ? ` lewat ${o.payment_type.replace(/_/g, " ").toUpperCase()}` : ""}
            </p>
          )}
        </Panel>

        <Panel title={o.shipping_method === "kurir" ? "Dikirim kurir" : "Ambil di posko"} icon={o.shipping_method === "kurir" ? Truck : Store}>
          {o.shipping_method === "kurir" ? (
            <div className="space-y-2 text-base text-tinta">
              <p className="font-semibold">{o.courier_name}</p>
              {o.shipping_eta && <p className="text-muted-foreground">Estimasi {o.shipping_eta}</p>}
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-5 shrink-0 text-hutan" aria-hidden /> {o.address}
              </p>
              {o.tracking_number && (
                <p className="rounded-lg bg-daun-muda px-3 py-2">
                  No. resi: <span className="font-bold tabular-nums">{o.tracking_number}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-base text-tinta">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-5 shrink-0 text-hutan" aria-hidden />
                <span>
                  {o.posko.name}
                  {(o.posko.address || o.posko.city) && <br />}
                  {[o.posko.address, o.posko.city].filter(Boolean).join(", ")}
                </span>
              </p>
              <p className="text-muted-foreground">Tunjukkan kode {o.code} saat mengambil.</p>
              {titikValid(titikPosko) && <PetaLokasi titik={titikPosko} judul={o.posko.name} />}
            </div>
          )}
        </Panel>
      </div>

      <p className="text-sm text-muted-foreground">
        Simpan tautan halaman ini untuk mengecek status pesanan. Pertanyaan tentang pesanan bisa disampaikan ke posko {o.posko.name}.
      </p>
    </div>
  );
}
