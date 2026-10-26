import Link from "next/link";
import { Banknote, CircleCheck, Clock, History, PackageOpen, Plus, Wallet, CircleX, type LucideIcon } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";
import { Badge, EmptyState, PageHeader, btn, type BadgeTone } from "@/components/kriya-ui";

const STATUS: Record<string, { label: string; icon: LucideIcon; tone: BadgeTone }> = {
  draft: { label: "Draft", icon: Clock, tone: "mentega" },
  approved: { label: "Disetujui", icon: CircleCheck, tone: "pucuk" },
  cancelled: { label: "Batal", icon: CircleX, tone: "bata" },
};

type Item = { item_type: string; weight_kg: number };

export default async function SetoranPage() {
  await requireMe(["pengurus"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("deposits")
    .select("id, status, total, paid_cash, created_at, warga:residents(name), deposit_items(item_type, weight_kg)")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []).map((d) => ({
    ...d,
    name: (d.warga as unknown as { name: string } | null)?.name ?? "Warga",
    items: ((d.deposit_items as Item[]) ?? []).map((i) => `${i.item_type} ${i.weight_kg} kg`).join(", "),
    meta: STATUS[d.status] ?? STATUS.draft,
  }));

  const PayBadge = ({ paidCash }: { paidCash: boolean }) => (
    <Badge tone={paidCash ? "persik" : "sage"} icon={paidCash ? Banknote : Wallet}>{paidCash ? "Tunai" : "Saldo"}</Badge>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Riwayat setoran"
        description="50 setoran terakhir dari warga."
        icon={History}
        actions={<Link href="/setoran/baru" className={btn.primary}><Plus /> Setor baru</Link>}
      />

      {rows.length === 0 ? (
        <EmptyState icon={PackageOpen} title="Belum ada setoran" text="Setoran yang dicatat akan muncul di sini." />
      ) : (
        <>
          {/* HP & tablet: kartu */}
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
            {rows.map((d) => (
              <li key={d.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-tinta">{d.name}</p>
                    <p className="text-sm text-muted-foreground">{tanggal(d.created_at)}</p>
                  </div>
                  <p className="shrink-0 text-lg font-extrabold tabular-nums text-tinta">{rupiah(d.total)}</p>
                </div>
                <p className="mt-2 text-base text-muted-foreground">{d.items || "Tanpa rincian"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={d.meta.tone} icon={d.meta.icon}>{d.meta.label}</Badge>
                  {d.status === "approved" && <PayBadge paidCash={d.paid_cash} />}
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: tabel */}
          <div className="hidden overflow-hidden rounded-2xl border bg-card lg:block">
            <table className="w-full text-left text-base">
              <thead className="border-b bg-daun-muda/60 text-sm text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Warga</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Tanggal</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Barang</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((d) => (
                  <tr key={d.id} className="hover:bg-daun-muda/40">
                    <td className="px-5 py-3.5 font-semibold text-tinta">{d.name}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">{tanggal(d.created_at)}</td>
                    <td className="max-w-xs px-5 py-3.5 text-muted-foreground">{d.items || "-"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={d.meta.tone} icon={d.meta.icon}>{d.meta.label}</Badge>
                        {d.status === "approved" && <PayBadge paidCash={d.paid_cash} />}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-bold tabular-nums text-tinta">{rupiah(d.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
