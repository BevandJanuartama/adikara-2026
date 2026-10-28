import Link from "next/link";
import { ChevronDown, ClipboardList, MapPin, MessageCircle, Store, Truck } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ActionForm, Field } from "@/components/action-form";
import { Badge, btn, EmptyState, MoneyRow, PageHeader, StatPatch } from "@/components/kriya-ui";
import { infoStatus } from "@/lib/marketplace/status";
import { formatHp, linkWa } from "@/lib/marketplace/wa";
import { setOrderStatus } from "@/lib/actions/ops";

type Order = {
  id: string;
  code: string;
  status: string;
  buyer_name: string;
  buyer_phone: string;
  shipping_method: "ambil" | "kurir";
  address: string | null;
  buyer_postal_code: string | null;
  distance_km: number | null;
  courier_name: string | null;
  shipping_eta: string | null;
  shipping_cost: number;
  tracking_number: string | null;
  subtotal: number;
  total: number;
  note: string | null;
  payment_type: string | null;
  created_at: string;
  paid_at: string | null;
  items: { name: string; qty: number; subtotal: number }[];
};

const TAB = [
  { key: "proses", label: "Perlu diproses", status: ["dibayar", "diproses"] },
  { key: "jalan", label: "Dikirim / siap ambil", status: ["dikirim", "siap_diambil"] },
  { key: "bayar", label: "Menunggu bayar", status: ["menunggu_bayar"] },
  { key: "selesai", label: "Selesai & batal", status: ["selesai", "batal", "kedaluwarsa", "gagal"] },
] as const;

const waktu = (d: string) =>
  new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

export default async function PesananPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireMe(["pengurus"]);
  const tabKey = (await searchParams).tab ?? "proses";
  const tab = TAB.find((t) => t.key === tabKey) ?? TAB[0];
  const supabase = await createClient();
  await supabase.rpc("expire_my_stale_orders"); // pesanan ditinggal > 90 menit → kedaluwarsa, stok kembali

  const { data } = await supabase
    .from("orders")
    .select(
      "id, code, status, buyer_name, buyer_phone, shipping_method, address, buyer_postal_code, distance_km, courier_name, shipping_eta, shipping_cost, tracking_number, subtotal, total, note, payment_type, created_at, paid_at, items:order_items(name, qty, subtotal)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  const semua = (data ?? []) as Order[];
  const hitung = (s: readonly string[]) => semua.filter((o) => s.includes(o.status)).length;
  const daftar = semua.filter((o) => (tab.status as readonly string[]).includes(o.status));
  const omzet = semua.filter((o) => o.paid_at).reduce((s, o) => s + Number(o.subtotal), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pesanan online"
        description="Pesanan dari katalog. Notifikasi pesanan baru juga dikirim ke WhatsApp pengurus."
        icon={ClipboardList}
        actions={<Link href="/katalog" className={btn.outline}><Store /> Lihat toko</Link>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <StatPatch tone="mentega" label="Perlu diproses" value={`${hitung(TAB[0].status)} pesanan`} icon={ClipboardList} />
        <StatPatch tone="pucuk" label="Dalam pengiriman" value={`${hitung(TAB[1].status)} pesanan`} icon={Truck} />
        <StatPatch tone="persik" label="Penjualan online" value={rupiah(omzet)} className="col-span-2 md:col-span-1" />
      </div>

      <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Filter status">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {TAB.map((t) => {
            const on = t.key === tab.key;
            return (
              <Link
                key={t.key}
                href={`/pesanan?tab=${t.key}`}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-base font-semibold",
                  on ? "border-hutan bg-hutan text-white" : "bg-card text-tinta hover:bg-daun-muda",
                )}
              >
                {t.label}
                <span className={cn("rounded-full px-2 text-sm tabular-nums", on ? "bg-white/20" : "bg-muted")}>{hitung(t.status)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {daftar.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Tidak ada pesanan di sini" text="Pesanan baru dari katalog akan muncul otomatis." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {daftar.map((o) => (
            <KartuPesanan key={o.id} o={o} />
          ))}
        </div>
      )}
    </div>
  );
}

function KartuPesanan({ o }: { o: Order }) {
  const st = infoStatus(o.status);
  const kurir = o.shipping_method === "kurir";
  return (
    <article className="flex flex-col rounded-2xl border bg-card">
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-lg font-bold text-tinta">{o.buyer_name}</p>
            <p className="text-sm text-muted-foreground">
              {o.code} · {waktu(o.created_at)}
            </p>
          </div>
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>
        <ul className="space-y-1 text-base text-tinta">
          {o.items.map((i, n) => (
            <li key={n} className="flex justify-between gap-3">
              <span className="min-w-0">{i.qty}× {i.name}</span>
              <span className="shrink-0 tabular-nums">{rupiah(i.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={kurir ? "persik" : "sage"} icon={kurir ? Truck : Store}>
            {kurir ? o.courier_name ?? "Kurir" : "Ambil di posko"}
          </Badge>
          <span className="ml-auto text-lg font-extrabold tabular-nums text-tinta">{rupiah(o.total)}</span>
        </div>
      </div>

      <details className="group border-t">
        <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-base font-semibold text-hutan">
          Detail & ubah status
          <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="space-y-4 border-t p-5">
          <a
            href={linkWa(o.buyer_phone, `Halo ${o.buyer_name}, pesanan ${o.code} dari KriyaPKK`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-base font-semibold text-hutan underline-offset-4 hover:underline"
          >
            <MessageCircle className="size-5" aria-hidden /> WhatsApp {formatHp(o.buyer_phone)}
          </a>
          {kurir && (
            <div className="space-y-1 rounded-xl bg-daun-muda/60 p-3 text-base text-tinta">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-5 shrink-0 text-hutan" aria-hidden />
                <span>
                  {o.address}
                  {o.buyer_postal_code && ` ${o.buyer_postal_code}`}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {o.distance_km != null && `±${Number(o.distance_km).toFixed(1)} km · `}
                {o.shipping_eta && `estimasi ${o.shipping_eta}`}
              </p>
              {o.tracking_number && <p className="text-sm">Resi: <b>{o.tracking_number}</b></p>}
            </div>
          )}
          {o.note && <p className="rounded-xl bg-mentega/60 p-3 text-base text-tinta">Catatan pembeli: {o.note}</p>}
          <div className="divide-y">
            <MoneyRow label="Produk (masuk kas posko)" value={rupiah(o.subtotal)} />
            {kurir && <MoneyRow label="Ongkir (untuk kurir)" value={rupiah(o.shipping_cost)} />}
            <MoneyRow
              label={o.paid_at ? `Dibayar${o.payment_type ? ` · ${o.payment_type.replace(/_/g, " ").toUpperCase()}` : ""}` : "Tagihan"}
              value={rupiah(o.total)}
              strong
            />
          </div>
          <AksiStatus o={o} />
        </div>
      </details>
    </article>
  );
}

function AksiStatus({ o }: { o: Order }) {
  const kurir = o.shipping_method === "kurir";
  switch (o.status) {
    case "menunggu_bayar":
      return (
        <ActionForm action={setOrderStatus.bind(null, o.id, "batal")} submitLabel="Batalkan pesanan (stok kembali)" variant="outline" className="space-y-3">
          <p className="text-sm text-muted-foreground">Pesanan otomatis kedaluwarsa bila tidak dibayar dalam 90 menit.</p>
        </ActionForm>
      );
    case "dibayar":
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ActionForm action={setOrderStatus.bind(null, o.id, "diproses")} submitLabel="Mulai proses" variant="outline" className="space-y-3" />
          {kurir ? (
            <ActionForm action={setOrderStatus.bind(null, o.id, "dikirim")} submitLabel="Tandai dikirim" className="space-y-3 sm:col-span-2">
              <Field label="Nomor resi / kode booking kurir" name="tracking_number" required={false} placeholder="Contoh: GK-123456" />
            </ActionForm>
          ) : (
            <ActionForm action={setOrderStatus.bind(null, o.id, "siap_diambil")} submitLabel="Siap diambil" className="space-y-3" />
          )}
        </div>
      );
    case "diproses":
      return kurir ? (
        <ActionForm action={setOrderStatus.bind(null, o.id, "dikirim")} submitLabel="Tandai dikirim" className="space-y-3">
          <Field label="Nomor resi / kode booking kurir" name="tracking_number" required={false} placeholder="Contoh: GK-123456" />
        </ActionForm>
      ) : (
        <ActionForm action={setOrderStatus.bind(null, o.id, "siap_diambil")} submitLabel="Siap diambil" className="space-y-3" />
      );
    case "dikirim":
    case "siap_diambil":
      return <ActionForm action={setOrderStatus.bind(null, o.id, "selesai")} submitLabel={kurir ? "Sudah diterima pembeli" : "Sudah diambil pembeli"} className="space-y-3" />;
    default:
      return null;
  }
}
