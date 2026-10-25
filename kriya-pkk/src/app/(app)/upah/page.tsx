import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";

// FR26: anggota melihat upahnya sendiri (RLS hanya mengembalikan baris miliknya)
export default async function UpahPage() {
  const me = await requireMe(["anggota", "pengurus"]);
  const supabase = await createClient();
  const { data: wages } = await supabase
    .from("wages")
    .select("id, amount, hours, created_at, batch:production_batches(ide:ideas(title))")
    .eq("member_id", me.id)
    .order("created_at", { ascending: false });
  const total = (wages ?? []).reduce((s, w) => s + Number(w.amount), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Upah saya</h1>
      <p className="text-xl">Total: <b>{rupiah(total)}</b></p>
      <ul className="divide-y rounded-xl border">
        {(wages ?? []).map((w) => (
          <li key={w.id} className="flex justify-between p-4 text-base">
            <span>
              {tanggal(w.created_at)} · {(w.batch as unknown as { ide: { title: string } } | null)?.ide?.title}
              {w.hours && ` · ${w.hours} jam`}
            </span>
            <b>{rupiah(w.amount)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
