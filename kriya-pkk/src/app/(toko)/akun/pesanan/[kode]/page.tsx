import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CircleCheck, Clock, MapPin, MessageCircle, PackageSearch, Receipt, Store, Truck, UserX } from "lucide-react";
import { requirePembeli } from "@/lib/auth";
import { rupiah, tanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge, btn, EmptyState, MoneyRow, Notice, Panel } from "@/components/kriya-ui";
import { infoStatus, langkahPesanan } from "@/lib/marketplace/status";
import { titikValid } from "@/lib/marketplace/geo";
import { formatHp, linkWa } from "@/lib/marketplace/wa";
import { ambilPesananSaya, appUrlDariHeader, sinkronkanDenganMidtrans } from "@/lib/marketplace/pesanan";
import { simulasiAktif } from "@/lib/marketplace/simulasi";
import { midtransProduksi } from "@/lib/marketplace/midtrans-mode";
import { PetaLokasi } from "@/components/toko/peta-lokasi";
import { SalinTeks } from "@/components/toko/salin-teks";
import { TombolBayar } from "./tombol-bayar";

export const metadata: Metadata = { title: "Detail pesanan · KriyaPKK", robots: { index: false } };

const jamWib = (d: Date) =>
  d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) + " WIB";

export default async function DetailPesananPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  const me = await requirePembeli(`/akun/pesanan/${kode}`);
  if (!me) {
    return <EmptyState icon={UserX} title="Halaman ini untuk akun pembeli" action={<Link href="/beranda" className={btn.primary}>Ke dasbor posko</Link>} />;
  }

  let [o] = await ambilPesananSaya(me.id, kode);
  // (RLS: hanya pesanan milik akun ini yang terbaca)
  if (!o) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="Pesanan tidak ditemukan"
        text="Pesanan ini tidak ada atau dibuat dengan akun lain."
        action={<Link href="/akun/pesanan" className={btn.primary}>Pesanan saya</Link>}
      />
    );
  }

  // Webhook Midtrans belum sampai (mis. uji di localhost)? tanya langsung ke Midtrans
  if (o.status === "menunggu_bayar" && o.midtrans_token) {
    await sinkronkanDenganMidtrans(o.code, await appUrlDariHeader());
    const [baru] = await ambilPesananSaya(me.id, kode);
    if (baru) o = baru;
  }

  const st = infoStatus(o.status);
  const ditutup = ["batal", "kedaluwarsa", "gagal"].includes(o.status);
  const kurir = o.shipping_method === "kurir";
  const langkah = langkahPesanan(o.shipping_method);
  const posisi = langkah.indexOf(o.status as (typeof langkah)[number]);
  const posko = o.posko;
  const titikPosko = { lat: Number(posko?.latitude), lng: Number(posko?.longitude) };
  const batasBayar = jamWib(new Date(new Date(o.created_at).getTime() + 60 * 60_000));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/akun/pesanan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-tinta">
        <ArrowLeft className="size-4" /> Pesanan saya
      </Link>

      <header className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Pesanan {tanggal(o.created_at)}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-tinta sm:text-3xl">{o.code}</h1>
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>
        <p className="text-base text-muted-foreground">
          Dari <span className="font-semibold text-tinta">{posko?.name ?? "posko"}</span>
        </p>
      </header>

      {o.status === "menunggu_bayar" && (
        <div className="jahitan space-y-3 rounded-2xl bg-mentega p-5">
          <p className="flex items-center gap-2 text-lg font-bold text-tinta">
            <Clock className="size-5" aria-hidden /> Selesaikan pembayaran {rupiah(o.total)}
          </p>
          <p className="text-base text-mentega-ink">
            Bayar dengan QRIS atau Virtual Account sebelum {batasBayar}. Setelah itu pesanan dibatalkan dan stok dikembalikan ke posko.
          </p>
          <TombolBayar code={o.code} snap={{ clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "", produksi: midtransProduksi() }} />
          {simulasiAktif() && (
            <p className="text-sm text-mentega-ink">
              Mode uji: bila pembayaran online belum bisa dibuka, pengurus posko akan mengonfirmasi pembayaran secara manual. Muat ulang halaman ini untuk melihat status terbaru.
            </p>
          )}
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

      {kurir && ["dikirim", "selesai"].includes(o.status) && o.tracking_number && (
        <section className="space-y-3 rounded-2xl border-2 border-hutan/30 bg-daun-muda p-5" aria-label="Nomor resi">
          <p className="flex items-center gap-2 text-base font-bold text-tinta">
            <Truck className="size-5 text-hutan" aria-hidden /> Paket dikirim lewat {o.courier_name ?? "ekspedisi"}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Nomor resi</p>
              <p className="break-all text-xl font-extrabold tracking-wide tabular-nums text-tinta">{o.tracking_number}</p>
            </div>
            <SalinTeks teks={o.tracking_number} label="Salin resi" />
          </div>
          <p className="text-sm text-tinta/80">
            Lacak posisi paket di situs atau aplikasi {o.courier_name?.split(" ")[0] ?? "ekspedisi"}: buka menu Lacak / Cek Resi, lalu tempel nomor resi di atas.
          </p>
        </section>
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
            <MoneyRow label="Harga produk" value={rupiah(o.subtotal)} />
            <MoneyRow label={kurir ? `Ongkir ${o.courier_name ?? ""}` : "Ongkir"} value={kurir ? rupiah(o.shipping_cost) : "Gratis"} />
            <MoneyRow label="Total" value={rupiah(o.total)} strong />
          </div>
          {o.paid_at && (
            <p className="mt-2 text-sm text-muted-foreground">
              Dibayar {tanggal(o.paid_at)}
              {o.payment_type ? ` lewat ${o.payment_type.replace(/_/g, " ").toUpperCase()}` : ""}
            </p>
          )}
        </Panel>

        <Panel title={kurir ? "Pengiriman" : "Ambil di posko"} icon={kurir ? Truck : Store}>
          {kurir ? (
            <div className="space-y-2 text-base text-tinta">
              <p className="font-semibold">{o.courier_name}</p>
              {o.shipping_eta && <p className="text-muted-foreground">Estimasi {o.shipping_eta} setelah dikirim</p>}
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-5 shrink-0 text-hutan" aria-hidden />
                <span>
                  {o.buyer_name} ({formatHp(o.buyer_phone)})
                  <br />
                  {[o.address, o.buyer_city, o.buyer_postal_code].filter(Boolean).join(", ")}
                </span>
              </p>
              {!o.tracking_number && !ditutup && (
                <p className="rounded-lg bg-daun-muda px-3 py-2 text-sm">Nomor resi muncul di sini setelah posko mengirim paket.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-base text-tinta">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-5 shrink-0 text-hutan" aria-hidden />
                <span>
                  {posko?.name}
                  {(posko?.address || posko?.city) && <br />}
                  {[posko?.address, posko?.city].filter(Boolean).join(", ")}
                </span>
              </p>
              <p className="text-muted-foreground">
                {o.status === "siap_diambil" ? "Pesanan sudah siap. " : "Tunggu status Siap diambil. "}Tunjukkan kode {o.code} saat mengambil.
              </p>
              {titikValid(titikPosko) && <PetaLokasi titik={titikPosko} judul={posko?.name ?? "Posko"} />}
            </div>
          )}
        </Panel>
      </div>

      {posko?.whatsapp && (
        <a
          href={linkWa(posko.whatsapp, `Halo ${posko.name}, saya ingin bertanya tentang pesanan ${o.code}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(btn.outline, "w-full sm:w-auto")}
        >
          <MessageCircle /> Tanya posko lewat WhatsApp
        </a>
      )}
    </div>
  );
}
