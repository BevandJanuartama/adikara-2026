import Link from "next/link";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tanggal } from "@/lib/format";
import {
  Factory,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  PackageCheck,
  ChevronRight,
  Boxes,
} from "lucide-react";

const STATUS: Record<string, { label: string; icon: any; color: string }> = {
  running: {
    label: "Berjalan",
    icon: PlayCircle,
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  done: {
    label: "Selesai",
    icon: CheckCircle2,
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  cancelled: {
    label: "Batal",
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200",
  },
};

export default async function ProduksiPage() {
  await requireMe(["pengurus", "anggota"]);
  const supabase = await createClient();
  const { data: batches } = await supabase
    .from("production_batches")
    .select(
      "id, status, qty_planned, qty_done, qty_failed, started_at, ide:ideas(title)",
    )
    .order("started_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      {/* Header & Judul */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Produksi</h1>
          <p className="text-xs text-muted-foreground">
            Pantau batch dan progres pembuatan kerajinan
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 shadow-2xs">
          <Factory className="h-6 w-6" />
        </div>
      </div>

      {/* Informasi Bantuan */}
      <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground flex items-center gap-2">
        <span className="font-semibold text-foreground">💡 Info:</span>
        <span>
          Mulai produksi baru dapat dilakukan melalui menu Detail Ide di Dapur
          Kreasi.
        </span>
      </div>

      {/* Daftar Batch Produksi */}
      {!batches || batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center space-y-3 shadow-2xs">
          <div className="rounded-full bg-muted p-3 text-muted-foreground">
            <Boxes className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Belum ada data produksi.
            <br />
            Mulai batch dari halaman Dapur Kreasi.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {batches.map((b) => {
            const statusMeta = STATUS[b.status] || STATUS.running;
            const StatusIcon = statusMeta.icon;
            const ideaTitle =
              (b.ide as unknown as { title: string } | null)?.title ??
              "Kerajinan Tanpa Nama";

            return (
              <li key={b.id}>
                <Link
                  href={`/produksi/${b.id}`}
                  className="group flex items-center justify-between rounded-2xl border bg-card p-4 shadow-2xs transition-all hover:border-emerald-500 hover:shadow-md"
                >
                  <div className="space-y-1.5 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-foreground group-hover:text-emerald-700 transition-colors">
                        {ideaTitle}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusMeta.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        <span>{statusMeta.label}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />{" "}
                        {tanggal(b.started_at)}
                      </span>
                      <span>·</span>
                      <span>
                        Rencana:{" "}
                        <strong className="text-foreground">
                          {b.qty_planned} unit
                        </strong>
                      </span>
                      {b.status === "done" && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold">
                            Jadi {b.qty_done}{" "}
                            {b.qty_failed ? `(Gagal ${b.qty_failed})` : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted p-2 text-muted-foreground group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
