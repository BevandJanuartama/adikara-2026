import { notFound } from "next/navigation";
import { Boxes, Clock, Gauge, PackageCheck, Play, Users, Wrench } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { angka, kg } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { Badge, Notice, PageHeader, Panel } from "@/components/kriya-ui";
import { startBatch, updatePricing } from "@/lib/actions/ops";
import { PricingEditor } from "./pricing-editor";
import { GuidePanel } from "./guide-panel";

// FR19 detail ide, FR20–FR21 costing, FR22 panduan, FR24 mulai produksi
// HP: info → bahan → harga → panduan → produksi. Desktop: kiri info/bahan/panduan, kanan harga/produksi.
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
  const materials = (idea.materials ?? []) as { item_type: string; kg: number }[];
  const tools = (idea.tools ?? []) as string[];

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/ide", label: "Dapur kreasi" }}
        title={idea.title}
        description={idea.description}
      />

      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
        <div className="contents xl:flex xl:flex-col xl:gap-6">
          <div className="order-1 flex flex-wrap gap-2">
            <Badge tone={maxUnits > 0 ? "pucuk" : "bata"} icon={PackageCheck}>
              {maxUnits > 0 ? `Stok cukup untuk ${maxUnits} unit` : "Stok belum cukup"}
            </Badge>
            {idea.difficulty && <Badge icon={Gauge}>Tingkat {idea.difficulty}</Badge>}
            <Badge icon={Clock}>±{angka(idea.time_hours)} jam per unit</Badge>
          </div>

          <div className="order-2 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Panel title="Bahan dari stok" description="Kebutuhan per 1 unit" icon={Boxes}>
              <ul className="divide-y">
                {materials.map((m) => (
                  <li key={m.item_type} className="flex justify-between gap-3 py-2.5 first:pt-0 last:pb-0 text-base">
                    <span className="text-tinta">{m.item_type}</span>
                    <span className="font-bold tabular-nums text-tinta">{kg(m.kg)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Alat" description="Siapkan sebelum mulai" icon={Wrench}>
              {tools.length ? (
                <ul className="flex flex-wrap gap-2">
                  {tools.map((t) => (
                    <li key={t} className="rounded-lg bg-daun-muda px-3 py-1.5 text-base text-tinta">{t}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-base text-muted-foreground">Tidak ada alat khusus.</p>
              )}
            </Panel>
          </div>

          <div className="order-4">
            <GuidePanel ideaId={idea.id} initial={idea.guide} />
          </div>
        </div>

        <div className="contents xl:sticky xl:top-10 xl:flex xl:flex-col xl:gap-6">
          <div className="order-3">
            <PricingEditor
              costs={{
                material_cost: Number(idea.material_cost),
                tool_cost: Number(idea.tool_cost),
                labor_cost: Number(idea.labor_cost),
                margin: Number(idea.margin),
                sell_price: Number(idea.sell_price),
              }}
              extras={idea.extras}
              canEdit={isPengurus}
              action={updatePricing.bind(null, idea.id)}
            />
          </div>

          {isPengurus && (
            <div className="order-5">
              <Panel title="Mulai produksi" description="Bahan langsung dipotong dari stok." icon={Play}>
                {maxUnits === 0 ? (
                  <Notice tone="warning">Stok bahan belum cukup untuk 1 unit.</Notice>
                ) : (
                  <ActionForm action={startBatch.bind(null, idea.id)} submitLabel="Mulai produksi">
                    <Field
                      label={`Jumlah unit (maks. ${maxUnits})`}
                      name="qty"
                      type="number"
                      min={1}
                      max={Math.max(1, maxUnits)}
                      defaultValue={Math.min(5, Math.max(1, maxUnits))}
                      suffix="unit"
                    />
                    <fieldset>
                      <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-tinta">
                        <Users className="size-4" aria-hidden /> Anggota yang ditugaskan
                      </legend>
                      <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border p-2">
                        {(members ?? []).map((m) => (
                          <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-base text-tinta hover:bg-daun-muda">
                            <input type="checkbox" name="members" value={m.id} className="size-5 accent-hutan" />
                            {m.full_name}
                          </label>
                        ))}
                        {!members?.length && <p className="px-2 py-2 text-base text-muted-foreground">Belum ada anggota.</p>}
                      </div>
                    </fieldset>
                  </ActionForm>
                )}
              </Panel>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
