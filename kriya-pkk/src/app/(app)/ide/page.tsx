import Link from "next/link";
import { BookDashed, ChevronDown, ChevronRight, Clock, Gauge, Lightbulb, PackageX, Sparkles, TriangleAlert } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { angka, rupiah } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Badge, EmptyState, PageHeader } from "@/components/kriya-ui";
import { ideaFromTemplate } from "@/lib/actions/ops";
import { GenerateIdeasButton } from "./generate-button";

type Cap = {
  idea_id: string;
  max_units: number;
  materials_status: { item_type: string; need_kg: number; stock_kg: number }[];
};

// FR18–FR19: hanya ide yang stoknya cukup ditampilkan di atas; FR23/FR34: template sebagai mode manual
export default async function IdePage() {
  await requireMe(["pengurus", "anggota"]);
  const supabase = await createClient();
  const [{ data: ideas }, { data: caps }, { data: templates }] = await Promise.all([
    supabase
      .from("ideas")
      .select("id, title, description, source, unit_cost, sell_price, difficulty, time_hours")
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
    supabase.from("v_idea_capacity").select("idea_id, max_units, materials_status"),
    supabase.from("idea_templates").select("id, title, difficulty").order("title"),
  ]);
  const capOf = new Map(((caps ?? []) as Cap[]).map((c) => [c.idea_id, c]));
  const list = (ideas ?? []).map((i) => ({ ...i, cap: capOf.get(i.id) as Cap | undefined }));
  const ready = list.filter((i) => (i.cap?.max_units ?? 0) > 0);
  const notReady = list.filter((i) => (i.cap?.max_units ?? 0) === 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Dapur kreasi" description="Ide kerajinan yang bisa dibuat dari stok posko, lengkap dengan modal dan harga jual." icon={Lightbulb} />

      <section className="jahitan rounded-2xl bg-mentega p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="flex items-center gap-2 text-xl font-bold text-tinta">
              <Sparkles className="size-5 text-mentega-ink" aria-hidden /> Minta saran AI
            </h2>
            <p className="mt-1 text-base text-tinta/80">AI membaca ringkasan stok, lalu menyarankan sampai 3 kerajinan beserta bahan dan alatnya.</p>
          </div>
          <div className="shrink-0">
            <GenerateIdeasButton />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-tinta">Bisa dibuat sekarang ({ready.length})</h2>
        {ready.length === 0 ? (
          <EmptyState icon={PackageX} title="Belum ada ide dengan stok cukup" text="Catat setoran lebih dulu, atau pakai template di bawah." />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ready.map((i) => (
              <Link
                key={i.id}
                href={`/ide/${i.id}`}
                className="group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-sage hover:bg-daun-muda/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold leading-snug text-tinta">{i.title}</h3>
                  <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
                {i.description && <p className="mt-1.5 line-clamp-2 text-base text-muted-foreground">{i.description}</p>}
                <div className="mb-4 mt-3 flex flex-wrap gap-1.5">
                  <Badge tone={i.source === "ai" ? "pucuk" : "netral"} icon={i.source === "ai" ? Sparkles : BookDashed}>
                    {i.source === "ai" ? "Saran AI" : "Template"}
                  </Badge>
                  {i.difficulty && <Badge icon={Gauge}>{i.difficulty}</Badge>}
                  {i.time_hours && <Badge icon={Clock}>±{angka(i.time_hours)} jam</Badge>}
                </div>
                <div className="mt-auto grid grid-cols-3 gap-2 border-t pt-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Modal</p>
                    <p className="font-bold tabular-nums text-tinta">{rupiah(i.unit_cost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jual</p>
                    <p className="font-bold tabular-nums text-tinta">{rupiah(i.sell_price)}</p>
                  </div>
                  <div className="rounded-lg bg-pucuk/60 py-1">
                    <p className="text-sm text-pucuk-ink">Maks</p>
                    <p className="font-bold tabular-nums text-tinta">{i.cap?.max_units} unit</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        {notReady.length > 0 && (
          <details className="group rounded-2xl border bg-card">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-base font-bold text-tinta">
              <span className="flex items-center gap-2">
                <TriangleAlert className="size-5 text-mentega-ink" aria-hidden /> Stok belum cukup ({notReady.length})
              </span>
              <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <ul className="divide-y border-t">
              {notReady.map((i) => (
                <li key={i.id} className="px-5 py-3">
                  <Link href={`/ide/${i.id}`} className="font-semibold text-tinta hover:underline">{i.title}</Link>
                  <p className="text-sm text-bata-ink">
                    Kurang: {(i.cap as Cap | undefined)?.materials_status.filter((m) => m.stock_kg < m.need_kg).map((m) => m.item_type).join(", ") || "-"}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        )}

        <details className="group rounded-2xl border bg-card">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-base font-bold text-tinta">
            <span className="flex items-center gap-2">
              <BookDashed className="size-5 text-hutan" aria-hidden /> Pakai template tanpa AI ({templates?.length ?? 0})
            </span>
            <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <ul className="divide-y border-t">
            {(templates ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-tinta">{t.title}</p>
                  <p className="text-sm text-muted-foreground">Tingkat {t.difficulty}</p>
                </div>
                <ActionForm action={ideaFromTemplate.bind(null, t.id)} submitLabel="Pakai" variant="outline" className="w-28 shrink-0" />
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
