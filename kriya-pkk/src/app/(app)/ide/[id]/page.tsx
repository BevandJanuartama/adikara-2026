import { notFound } from "next/navigation";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kg } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { startBatch, updatePricing } from "@/lib/actions/ops";
import { PricingEditor } from "./pricing-editor";
import { GuidePanel } from "./guide-panel";
import {
  Lightbulb,
  Clock,
  Gauge,
  Package,
  Wrench,
  Boxes,
  Play,
  Users,
  ShieldCheck,
} from "lucide-react";

// FR19 detail ide, FR20–FR21 costing, FR22 panduan, FR24 mulai produksi
export default async function IdeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireMe(["pengurus", "anggota"]);
  const supabase = await createClient();
  const [{ data: idea }, { data: cap }, { data: members }] = await Promise.all([
    supabase.from("ideas").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("v_idea_capacity")
      .select("max_units")
      .eq("idea_id", id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),
  ]);
  if (!idea) notFound();
  const isPengurus = me.role === "pengurus";
  const maxUnits = cap?.max_units ?? 0;

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      {/* Header Info Ide */}
      <div className="rounded-2xl border bg-card p-5 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Detail Ide Kerajinan</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {idea.title}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {idea.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t pt-4 text-center">
          <div className="rounded-xl bg-muted/30 p-2.5">
            <p className="text-[11px] text-muted-foreground font-medium">
              Kesulitan
            </p>
            <p className="text-xs font-bold text-foreground mt-0.5 capitalize">
              {idea.difficulty || "-"}
            </p>
          </div>
          <div className="rounded-xl bg-muted/30 p-2.5">
            <p className="text-[11px] text-muted-foreground font-medium">
              Waktu Buat
            </p>
            <p className="text-xs font-bold text-foreground mt-0.5">
              ±{idea.time_hours} jam
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2.5 border border-emerald-100">
            <p className="text-[11px] text-emerald-700 font-medium">
              Maks Unit
            </p>
            <p className="text-xs font-extrabold text-emerald-800 mt-0.5">
              {maxUnits} unit
            </p>
          </div>
        </div>
      </div>

      {/* Bahan & Alat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b pb-2.5">
            <Boxes className="h-4 w-4 text-emerald-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Bahan (per unit)
            </h2>
          </div>
          <ul className="space-y-2">
            {(idea.materials as { item_type: string; kg: number }[]).map(
              (m) => (
                <li
                  key={m.item_type}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-medium capitalize text-foreground">
                    {m.item_type}
                  </span>
                  <span className="font-bold text-emerald-700">{kg(m.kg)}</span>
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b pb-2.5">
            <Wrench className="h-4 w-4 text-emerald-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Alat yang Dibutuhkan
            </h2>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {(idea.tools as string[]).join(", ") || "Tidak ada alat khusus"}
          </p>
        </div>
      </div>

      {/* Pricing Editor Component */}
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

      {/* Guide Panel Component */}
      <GuidePanel ideaId={idea.id} initial={idea.guide} />

      {/* Form Mulai Produksi (Khusus Pengurus) */}
      {isPengurus && (
        <ActionForm
          action={startBatch.bind(null, idea.id)}
          submitLabel="▶ Mulai Batch Produksi"
          className="space-y-4 rounded-2xl border bg-card p-5 shadow-2xs"
        >
          <div className="flex items-center gap-2 border-b pb-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
              <Play className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Mulai Produksi</h2>
              <p className="text-xs text-muted-foreground">
                Tugaskan anggota untuk mengerjakan batch produk ini
              </p>
            </div>
          </div>

          <Field
            label={`Jumlah unit (Maksimal ${maxUnits} unit)`}
            name="qty"
            type="number"
            min={1}
            max={Math.max(1, maxUnits)}
            defaultValue={Math.min(5, Math.max(1, maxUnits))}
          />

          <fieldset className="space-y-2.5 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <legend>Anggota yang Ditugaskan</legend>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2 rounded-xl border bg-muted/20 p-3">
              {(members ?? []).map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2.5 text-xs font-medium cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="members"
                    value={m.id}
                    className="size-4 rounded border-gray-300 accent-primary"
                  />
                  <span className="text-foreground">{m.full_name}</span>
                </label>
              ))}
              {!members?.length && (
                <p className="text-xs text-muted-foreground">
                  Belum ada anggota terdaftar.
                </p>
              )}
            </div>
          </fieldset>
        </ActionForm>
      )}
    </div>
  );
}
