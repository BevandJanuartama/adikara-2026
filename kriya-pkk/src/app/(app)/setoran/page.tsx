import Link from "next/link";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";
import {
  History,
  Plus,
  Wallet,
  Banknote,
  CheckCircle2,
  Clock,
  XCircle,
  Recycle,
  PackageOpen,
  ArrowRight,
} from "lucide-react";

const STATUS: Record<string, { label: string; icon: any; color: string }> = {
  draft: {
    label: "Draft",
    icon: Clock,
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  approved: {
    label: "Disetujui",
    icon: CheckCircle2,
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  cancelled: {
    label: "Batal",
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200",
  },
};

export default async function SetoranPage() {
  await requireMe(["pengurus"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("deposits")
    .select(
      "id, status, total, paid_cash, created_at, warga:residents(name), deposit_items(item_type, weight_kg)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      {/* Header & Tombol Setor Baru */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Setoran</h1>
          <p className="text-xs text-muted-foreground">
            Daftar transaksi sampah anorganik warga
          </p>
        </div>
        <Link
          href="/setoran/baru"
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Setor Baru</span>
        </Link>
      </div>

      {/* Daftar Riwayat Setoran */}
      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center space-y-3 shadow-2xs">
          <div className="rounded-full bg-muted p-3 text-muted-foreground">
            <PackageOpen className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Belum ada riwayat setoran sampah.
            <br />
            Mulai catat setoran warga sekarang.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {data.map((d) => {
            const statusMeta = STATUS[d.status] || STATUS.draft;
            const StatusIcon = statusMeta.icon;
            const residentName =
              (d.warga as unknown as { name: string } | null)?.name ??
              "Warga Umum";
            const itemsList =
              (d.deposit_items as { item_type: string; weight_kg: number }[]) ||
              [];

            return (
              <li
                key={d.id}
                className="group rounded-2xl border bg-card p-4 shadow-2xs transition-all hover:border-emerald-500 hover:shadow-md space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      {residentName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tanggal(d.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-extrabold text-emerald-700">
                      {rupiah(d.total)}
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusMeta.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        <span>{statusMeta.label}</span>
                      </span>
                      {d.status === "approved" && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${d.paid_cash ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-blue-50 text-blue-800 border border-blue-200"}`}
                        >
                          {d.paid_cash ? (
                            <Banknote className="h-3 w-3" />
                          ) : (
                            <Wallet className="h-3 w-3" />
                          )}
                          <span>{d.paid_cash ? "Tunai" : "Saldo"}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-muted/30 p-2.5 text-xs">
                  <Recycle className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span className="text-muted-foreground line-clamp-1">
                    {itemsList
                      .map((i) => `${i.item_type} (${i.weight_kg} kg)`)
                      .join(" · ") || "Tidak ada rincian item"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
