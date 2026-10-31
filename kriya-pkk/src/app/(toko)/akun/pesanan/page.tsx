import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, ClipboardList, LogOut, Store, Truck, UserX } from "lucide-react";
import { requirePembeli } from "@/lib/auth";
import { logoutToko } from "@/lib/actions/auth";
import { rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge, btn, EmptyState, PageHeader } from "@/components/kriya-ui";
import { infoStatus } from "@/lib/marketplace/status";
import { ambilPesananSaya, type PesananSaya } from "@/lib/marketplace/pesanan";

export const metadata: Metadata = { title: "Pesanan saya · KriyaPKK", robots: { index: false } };

const waktu = (d: string) =>
  new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

const BERJALAN = ["menunggu_bayar", "dibayar", "diproses", "dikirim", "siap_diambil"];

export default async function PesananSayaPage() {
  const me = await requirePembeli("/akun/pesanan");
  if (!me) {
    return (
      <EmptyState
        icon={UserX}
        title="Halaman ini untuk akun pembeli"
        text="Pengurus dan perajin melihat pesanan posko di menu Pesanan online."
        action={<Link href="/beranda" className={btn.primary}>Ke dasbor posko</Link>}
      />
    );
  }

  const semua = await ambilPesananSaya(me.id);
  const berjalan = semua.filter((o) => BERJALAN.includes(o.status));
  const riwayat = semua.filter((o) => !BERJALAN.includes(o.status));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Pesanan saya"
        description={`Masuk sebagai ${me.fullName || me.email}`}
        icon={ClipboardList}
        actions={
          <form action={logoutToko}>
            <button type="submit" className={cn(btn.outline, btn.small)}>
              <LogOut /> Keluar
            </button>
          </form>
        }
      />

      {semua.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada pesanan"
          text="Pesanan yang Anda buat akan muncul di sini beserta status dan nomor resinya."
          action={<Link href="/katalog" className={btn.primary}>Lihat katalog</Link>}
        />
      ) : (
        <>
          <Bagian judul="Sedang berjalan" daftar={berjalan} kosong="Tidak ada pesanan yang sedang berjalan." />
          {riwayat.length > 0 && <Bagian judul="Riwayat" daftar={riwayat} />}
        </>
      )}
    </div>
  );
}

function Bagian({ judul, daftar, kosong }: { judul: string; daftar: PesananSaya[]; kosong?: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-tinta">
        {judul} <span className="font-normal text-muted-foreground">({daftar.length})</span>
      </h2>
      {daftar.length === 0 ? (
        <p className="text-base text-muted-foreground">{kosong}</p>
      ) : (
        <ul className="space-y-3">
          {daftar.map((o) => (
            <li key={o.id}>
              <KartuPesanan o={o} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function KartuPesanan({ o }: { o: PesananSaya }) {
  const st = infoStatus(o.status);
  const kurir = o.shipping_method === "kurir";
  const [pertama, ...lain] = o.items;
  return (
    <Link
      href={`/akun/pesanan/${o.code}`}
      className={cn(
        "block rounded-2xl border bg-card p-5 transition-colors hover:border-hutan/50 hover:bg-daun-muda/30",
        o.status === "menunggu_bayar" && "border-mentega-ink/40",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-base font-bold text-tinta">{o.code}</p>
          <p className="text-sm text-muted-foreground">
            {waktu(o.created_at)} · {o.posko?.name ?? "Posko"}
          </p>
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>
      <p className="mt-3 line-clamp-1 text-base text-tinta">
        {pertama ? `${pertama.qty}× ${pertama.name}` : "-"}
        {lain.length > 0 && <span className="text-muted-foreground"> +{lain.length} produk lain</span>}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone={kurir ? "persik" : "sage"} icon={kurir ? Truck : Store}>
          {kurir ? o.courier_name ?? "Ekspedisi" : "Ambil di posko"}
        </Badge>
        {o.tracking_number && <span className="text-sm text-muted-foreground">Resi {o.tracking_number}</span>}
        <span className="ml-auto flex items-center gap-1 text-base font-extrabold tabular-nums text-tinta">
          {rupiah(o.total)} <ChevronRight className="size-5 text-hutan" aria-hidden />
        </span>
      </div>
      {o.status === "menunggu_bayar" && <p className="mt-2 text-sm font-semibold text-mentega-ink">Selesaikan pembayaran dalam 60 menit sejak memesan.</p>}
    </Link>
  );
}
