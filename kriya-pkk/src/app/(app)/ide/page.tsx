import Link from "next/link";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { ideaFromTemplate } from "@/lib/actions/ops";
import { GenerateIdeasButton } from "./generate-button";

type Cap = { idea_id: string; max_units: number; materials_status: { item_type: string; need_kg: number; stock_kg: number }[] };

// FR18–FR19: hanya ide yang stoknya cukup ditampilkan di atas; FR23/FR34: template sebagai mode manual
export default async function IdePage() {
  await requireMe(["pengurus", "anggota"]);
  const supabase = await createClient();
  const [{ data: ideas }, { data: caps }, { data: templates }] = await Promise.all([
    supabase.from("ideas").select("id, title, description, source, unit_cost, sell_price, difficulty, time_hours")
      .eq("is_archived", false).order("created_at", { ascending: false }),
    supabase.from("v_idea_capacity").select("idea_id, max_units, materials_status"),
    supabase.from("idea_templates").select("id, title, difficulty").order("title"),
  ]);
  const capOf = new Map(((caps ?? []) as Cap[]).map((c) => [c.idea_id, c]));
  const list = (ideas ?? []).map((i) => ({ ...i, cap: capOf.get(i.id) }));
  const ready = list.filter((i) => (i.cap?.max_units ?? 0) > 0);
  const notReady = list.filter((i) => (i.cap?.max_units ?? 0) === 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dapur kreasi</h1>
      <GenerateIdeasButton />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Bisa dibuat sekarang</h2>
        {ready.map((i) => (
          <Link key={i.id} href={`/ide/${i.id}`} className="block space-y-1 rounded-xl border p-4">
            <div className="flex justify-between">
              <p className="text-lg font-semibold">{i.title}</p>
              <span className="text-sm">{i.source === "ai" ? "AI" : "Template"}</span>
            </div>
            <p className="text-base text-muted-foreground">{i.description}</p>
            <p className="text-base">
              Modal {rupiah(i.unit_cost)} · Jual <b>{rupiah(i.sell_price)}</b> · maks <b>{i.cap?.max_units}</b> unit · {i.difficulty}
            </p>
          </Link>
        ))}
        {!ready.length && <p className="text-base text-muted-foreground">Belum ada ide dengan stok cukup.</p>}
      </section>

      {notReady.length > 0 && (
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer text-base font-semibold">Stok belum cukup ({notReady.length})</summary>
          <ul className="mt-2 space-y-1">
            {notReady.map((i) => (
              <li key={i.id} className="text-base">
                <Link href={`/ide/${i.id}`} className="underline">{i.title}</Link>{" — kurang: "}
                {(i.cap as Cap | undefined)?.materials_status.filter((m) => m.stock_kg < m.need_kg).map((m) => m.item_type).join(", ")}
              </li>
            ))}
          </ul>
        </details>
      )}

      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer text-base font-semibold">Pilih dari template (tanpa AI)</summary>
        <div className="mt-3 space-y-2">
          {(templates ?? []).map((t) => (
            <ActionForm key={t.id} action={ideaFromTemplate.bind(null, t.id)} submitLabel={`Pakai: ${t.title}`}
              variant="outline" className="" />
          ))}
        </div>
      </details>
    </div>
  );
}
