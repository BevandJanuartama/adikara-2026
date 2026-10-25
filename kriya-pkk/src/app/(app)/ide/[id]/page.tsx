import { notFound } from "next/navigation";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kg } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { startBatch, updatePricing } from "@/lib/actions/ops";
import { PricingEditor } from "./pricing-editor";
import { GuidePanel } from "./guide-panel";

// FR19 detail ide, FR20–FR21 costing, FR22 panduan, FR24 mulai produksi
export default async function IdeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireMe(["pengurus", "anggota"]);
  const supabase = await createClient();
  const [{ data: idea }, { data: cap }, { data: members }] = await Promise.all([
    supabase.from("ideas").select("*").eq("id", id).maybeSingle(),
    supabase.from("v_idea_capacity").select("max_units").eq("idea_id", id).maybeSingle(),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);
  if (!idea) notFound();
  const isPengurus = me.role === "pengurus";
  const maxUnits = cap?.max_units ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{idea.title}</h1>
        <p className="text-base text-muted-foreground">{idea.description}</p>
        <p className="text-base">Tingkat: {idea.difficulty} · ±{idea.time_hours} jam/unit · bisa dibuat maks <b>{maxUnits}</b> unit</p>
      </div>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 text-lg font-semibold">Bahan dari stok (per unit)</h2>
        <ul className="list-disc pl-5 text-base">
          {(idea.materials as { item_type: string; kg: number }[]).map((m) => <li key={m.item_type}>{m.item_type}: {kg(m.kg)}</li>)}
        </ul>
        <h2 className="mb-2 mt-3 text-lg font-semibold">Alat</h2>
        <p className="text-base">{(idea.tools as string[]).join(", ") || "-"}</p>
      </section>

      <PricingEditor
        costs={{
          material_cost: Number(idea.material_cost), tool_cost: Number(idea.tool_cost),
          labor_cost: Number(idea.labor_cost), margin: Number(idea.margin), sell_price: Number(idea.sell_price),
        }}
        extras={idea.extras}
        canEdit={isPengurus}
        action={updatePricing.bind(null, idea.id)}
      />

      <GuidePanel ideaId={idea.id} initial={idea.guide} />

      {isPengurus && (
        <ActionForm action={startBatch.bind(null, idea.id)} submitLabel="▶ Mulai produksi" className="space-y-3 rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Mulai produksi</h2>
          <Field label={`Jumlah unit (maks ${maxUnits})`} name="qty" type="number" min={1} max={Math.max(1, maxUnits)} defaultValue={Math.min(5, Math.max(1, maxUnits))} />
          <fieldset className="space-y-1">
            <legend className="text-base">Anggota yang ditugaskan</legend>
            {(members ?? []).map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-base">
                <input type="checkbox" name="members" value={m.id} className="size-5" /> {m.full_name}
              </label>
            ))}
          </fieldset>
        </ActionForm>
      )}
    </div>
  );
}
