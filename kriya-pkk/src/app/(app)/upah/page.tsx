import { Calendar, Clock, Coins, Factory, Wallet } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";
import { EmptyState, PageHeader, StatPatch } from "@/components/kriya-ui";

// FR26: anggota melihat upahnya sendiri (RLS hanya mengembalikan baris miliknya)
export default async function UpahPage() {
  const me = await requireMe(["anggota", "pengurus"]);
  const supabase = await createClient();
  const { data: wages } = await supabase
    .from("wages")
    .select("id, amount, hours, created_at, batch:production_batches(ide:ideas(title))")
    .eq("member_id", me.id)
    .order("created_at", { ascending: false });
  const list = wages ?? [];
  const total = list.reduce((s, w) => s + Number(w.amount), 0);
  const hours = list.reduce((s, w) => s + Number(w.hours ?? 0), 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Upah saya" description="Upah dari setiap batch produksi yang kamu kerjakan." icon={Coins} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <StatPatch tone="persik" label="Total upah" value={rupiah(total)} icon={Wallet} className="col-span-2 md:col-span-1" />
        <StatPatch tone="pucuk" label="Batch dikerjakan" value={`${list.length} batch`} icon={Factory} />
        <StatPatch tone="mentega" label="Jam tercatat" value={`${hours} jam`} icon={Clock} />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Coins} title="Belum ada upah" text="Upah tercatat setelah pengurus menyimpan upah untuk batch produksi." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {list.map((w) => {
            const title = (w.batch as unknown as { ide?: { title: string } } | null)?.ide?.title ?? "Produksi kerajinan";
            return (
              <li key={w.id} className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-daun-muda text-hutan">
                    <Factory className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-tinta">{title}</p>
                    <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" aria-hidden /> {tanggal(w.created_at)}</span>
                      {w.hours ? <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden /> {w.hours} jam</span> : null}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-lg font-extrabold tabular-nums text-tinta">{rupiah(w.amount)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
