import Link from "next/link";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { ideaFromTemplate } from "@/lib/actions/ops";
import { GenerateIdeasButton } from "./generate-button";
import {
  Sparkles,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  BookTemplate,
  Clock,
  Gauge,
  ArrowRight,
  PackageX,
} from "lucide-react";

type Cap = {
  idea_id: string;
  max_units: number;
  materials_status: { item_type: string; need_kg: number; stock_kg: number }[];
};

// FR18–FR19: hanya ide yang stoknya cukup ditampilkan di atas; FR23/FR34: template sebagai mode manual
export default async function IdePage() {
  await requireMe(["pengurus", "anggota"]);
  const supabase = await createClient();
  const [{ data: ideas }, { data: caps }, { data: templates }] =
    await Promise.all([
      supabase
        .from("ideas")
        .select(
          "id, title, description, source, unit_cost, sell_price, difficulty, time_hours",
        )
        .eq("is_archived", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("v_idea_capacity")
        .select("idea_id, max_units, materials_status"),
      supabase
        .from("idea_templates")
        .select("id, title, difficulty")
        .order("title"),
    ]);
  const capOf = new Map(((caps ?? []) as Cap[]).map((c) => [c.idea_id, c]));
  const list = (ideas ?? []).map((i) => ({ ...i, cap: capOf.get(i.id) }));
  const ready = list.filter((i) => (i.cap?.max_units ?? 0) > 0);
  const notReady = list.filter((i) => (i.cap?.max_units ?? 0) === 0);

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-10">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dapur Kreasi</h1>
          <p className="text-xs text-muted-foreground">
            Rekomendasi produk kerajinan berbasis stok limbah
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 shadow-2xs">
          <Lightbulb className="h-6 w-6" />
        </div>
      </div>

      {/* Tombol Generator AI */}
      <div className="rounded-2xl border bg-gradient-to-br from-emerald-800 to-teal-900 p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-xs font-medium backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            <span>AI Advisor</span>
          </div>
          <h2 className="text-base font-bold">Buat Ide Baru dari Stok</h2>
          <p className="text-xs text-emerald-100/80">
            Biarkan AI menganalisis bahan baku yang tersedia di posko.
          </p>
        </div>
        <div className="w-full sm:w-auto shrink-0">
          <GenerateIdeasButton />
        </div>
      </div>

      {/* Bagian 1: Bisa Dibuat Sekarang */}
      <section className="space-y-3.5">
        <div className="flex items-center gap-2 px-1">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Bisa Dibuat Sekarang ({ready.length})
          </h2>
        </div>

        {ready.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center space-y-3 shadow-2xs">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <PackageX className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Belum ada ide dengan stok cukup.
              <br />
              Silakan lakukan setoran sampah atau gunakan template.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {ready.map((i) => (
              <Link
                key={i.id}
                href={`/ide/${i.id}`}
                className="group relative flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-2xs transition-all hover:border-emerald-500 hover:shadow-md space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground group-hover:text-emerald-700 transition-colors">
                        {i.title}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${i.source === "ai" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}
                      >
                        {i.source === "ai" ? "✨ AI" : "📋 Template"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {i.description}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      Modal:{" "}
                      <strong className="text-foreground">
                        {rupiah(i.unit_cost)}
                      </strong>
                    </span>
                    <span className="text-muted-foreground">
                      Jual:{" "}
                      <strong className="text-emerald-700">
                        {rupiah(i.sell_price)}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-800">
                      Maks {i.cap?.max_units} unit
                    </span>
                    {i.difficulty && (
                      <span className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-muted-foreground">
                        <Gauge className="h-3 w-3" /> {i.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bagian 2: Stok Belum Cukup */}
      {notReady.length > 0 && (
        <details className="group rounded-2xl border bg-card p-4 shadow-2xs">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-bold text-muted-foreground">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Stok Belum
              Cukup ({notReady.length} Ide)
            </span>
            <span className="text-xs group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <ul className="mt-3 divide-y pt-2 border-t space-y-2">
            {notReady.map((i) => {
              const missingMaterials = (
                i.cap as Cap | undefined
              )?.materials_status
                .filter((m) => m.stock_kg < m.need_kg)
                .map((m) => m.item_type)
                .join(", ");

              return (
                <li
                  key={i.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-2 text-xs gap-1"
                >
                  <Link
                    href={`/ide/${i.id}`}
                    className="font-semibold text-foreground hover:underline"
                  >
                    {i.title}
                  </Link>
                  <span className="text-red-600 font-medium">
                    Kurang:{" "}
                    <span className="font-bold">{missingMaterials}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {/* Bagian 3: Pilih dari Template */}
      <details className="group rounded-2xl border bg-card p-4 shadow-2xs">
        <summary className="flex cursor-pointer items-center justify-between text-sm font-bold text-foreground">
          <span className="flex items-center gap-2">
            <BookTemplate className="h-4 w-4 text-emerald-700" /> Pilih dari
            Template Bawaan (Tanpa AI)
          </span>
          <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>
        <div className="mt-3.5 space-y-2.5 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Gunakan ide standar siap pakai untuk mempercepat produksi kelompok
            PKK.
          </p>
          {(templates ?? []).map((t) => (
            <div
              key={t.id}
              className="rounded-xl border bg-muted/20 p-2.5 flex items-center justify-between gap-2"
            >
              <div>
                <p className="text-xs font-bold">{t.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  Kesulitan: {t.difficulty}
                </p>
              </div>
              <ActionForm
                action={ideaFromTemplate.bind(null, t.id)}
                submitLabel={`Gunakan Ide`}
                variant="outline"
                className="h-9 text-xs font-semibold shrink-0"
              />
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
