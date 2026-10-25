import Link from "next/link";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tanggal } from "@/lib/format";

const STATUS: Record<string, string> = { running: "Berjalan", done: "Selesai", cancelled: "Batal" };

export default async function ProduksiPage() {
  await requireMe(["pengurus", "anggota"]);
  const supabase = await createClient();
  const { data: batches } = await supabase
    .from("production_batches")
    .select("id, status, qty_planned, qty_done, qty_failed, started_at, ide:ideas(title)")
    .order("started_at", { ascending: false }).limit(50);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Produksi</h1>
      <p className="text-base text-muted-foreground">Mulai produksi baru dari halaman detail ide.</p>
      <ul className="divide-y rounded-xl border">
        {(batches ?? []).map((b) => (
          <li key={b.id}>
            <Link href={`/produksi/${b.id}`} className="block p-4">
              <div className="flex justify-between">
                <p className="text-lg font-semibold">{(b.ide as unknown as { title: string } | null)?.title}</p>
                <span className="text-base">{STATUS[b.status]}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {tanggal(b.started_at)} · rencana {b.qty_planned}
                {b.status === "done" && ` · jadi ${b.qty_done}, gagal ${b.qty_failed}`}
              </p>
            </Link>
          </li>
        ))}
        {!batches?.length && <li className="p-4 text-muted-foreground">Belum ada produksi.</li>}
      </ul>
    </div>
  );
}
