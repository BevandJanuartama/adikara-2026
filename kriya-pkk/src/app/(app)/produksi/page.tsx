import Link from "next/link";
import { Boxes, Calendar, CircleCheck, ChevronRight, Factory, CirclePlay, CircleX, type LucideIcon } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tanggal } from "@/lib/format";
import { Badge, EmptyState, Notice, PageHeader, btn, type BadgeTone } from "@/components/kriya-ui";

const STATUS: Record<string, { label: string; icon: LucideIcon; tone: BadgeTone }> = {
  running: { label: "Berjalan", icon: CirclePlay, tone: "mentega" },
  done: { label: "Selesai", icon: CircleCheck, tone: "pucuk" },
  cancelled: { label: "Batal", icon: CircleX, tone: "bata" },
};

export default async function ProduksiPage() {
  await requireMe(["pengurus", "anggota"]);
  const supabase = await createClient();
  const { data: batches } = await supabase
    .from("production_batches")
    .select("id, status, qty_planned, qty_done, qty_failed, started_at, ide:ideas(title)")
    .order("started_at", { ascending: false })
    .limit(50);
  const rows = batches ?? [];
  const running = rows.filter((b) => b.status === "running");
  const others = rows.filter((b) => b.status !== "running");

  const Card = ({ b }: { b: (typeof rows)[number] }) => {
    const meta = STATUS[b.status] ?? STATUS.running;
    const title = (b.ide as unknown as { title: string } | null)?.title ?? "Kerajinan";
    const pct = b.status === "done" ? Math.round((b.qty_done / Math.max(1, b.qty_planned)) * 100) : null;
    return (
      <Link
        href={`/produksi/${b.id}`}
        className="group flex h-full flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-sage hover:bg-daun-muda/40"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-snug text-tinta">{title}</h3>
          <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={meta.tone} icon={meta.icon}>{meta.label}</Badge>
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="size-4" aria-hidden /> {tanggal(b.started_at)}
          </span>
        </div>
        <p className="mt-4 text-base text-muted-foreground">
          Rencana <span className="font-bold text-tinta">{b.qty_planned} unit</span>
          {b.status === "done" && (
            <>
              , jadi <span className="font-bold text-tinta">{b.qty_done}</span>
              {b.qty_failed ? `, gagal ${b.qty_failed}` : ""}
            </>
          )}
        </p>
        {pct !== null && (
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-daun-muda" aria-hidden>
            <div className="h-full rounded-full bg-sage" style={{ width: `${pct}%` }} />
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Produksi" description="Batch kerajinan yang sedang dan sudah dikerjakan." icon={Factory} />

      {rows.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Belum ada produksi"
          text="Mulai produksi dari halaman detail ide di Dapur kreasi."
          action={<Link href="/ide" className={btn.primary}>Buka Dapur kreasi</Link>}
        />
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-lg font-bold text-tinta">Sedang berjalan ({running.length})</h2>
            {running.length === 0 ? (
              <Notice>Tidak ada batch yang berjalan. Mulai produksi baru dari Dapur kreasi.</Notice>
            ) : (
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {running.map((b) => <li key={b.id}><Card b={b} /></li>)}
              </ul>
            )}
          </section>
          {others.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-tinta">Riwayat</h2>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {others.map((b) => <li key={b.id}><Card b={b} /></li>)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
