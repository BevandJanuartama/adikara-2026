import { notFound } from "next/navigation";
import { CircleCheck, ClipboardCheck, Coins, CirclePlay, Receipt, CircleX } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kg, rupiah } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { FotoUpload } from "@/components/foto-upload";
import { Badge, MoneyRow, PageHeader, Panel } from "@/components/kriya-ui";
import { cancelBatch, finishBatch, payWages } from "@/lib/actions/ops";

// FR25 catat hasil, FR26 upah anggota
export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireMe(["pengurus", "anggota"]);
  const supabase = await createClient();
  const { data: b } = await supabase
    .from("production_batches")
    .select("*, ide:ideas(id, title, labor_cost)")
    .eq("id", id)
    .maybeSingle();
  if (!b) notFound();

  const assigned: string[] = b.assigned_members ?? [];
  const [{ data: members }, { data: wages }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", assigned.length ? assigned : [me.id]),
    supabase.from("wages").select("member_id, amount, hours").eq("batch_id", id),
  ]);
  const ide = b.ide as { id: string; title: string; labor_cost: number };
  const isPengurus = me.role === "pengurus";
  const canFinish = b.status === "running" && (isPengurus || assigned.includes(me.id));
  const units = b.status === "done" ? b.qty_done + b.qty_failed : b.qty_planned;
  const suggested = assigned.length ? Math.round((Number(ide.labor_cost) * units) / assigned.length) : 0;
  const totalCost = Number(b.material_value) + Number(b.extra_cost_total) + Number(b.tool_cost_total) + Number(b.wage_total);
  const paid = (wages ?? []).reduce((s, w) => s + Number(w.amount), 0);
  const status =
    b.status === "running"
      ? { label: "Berjalan", tone: "mentega" as const, icon: CirclePlay }
      : b.status === "done"
        ? { label: "Selesai", tone: "pucuk" as const, icon: CircleCheck }
        : { label: "Batal", tone: "bata" as const, icon: CircleX };

  return (
    <div className="space-y-6">
      <PageHeader back={{ href: "/produksi", label: "Produksi" }} title={ide.title} description={`Batch ${b.qty_planned} unit`} />

      <div className="flex flex-wrap gap-2">
        <Badge tone={status.tone} icon={status.icon}>{status.label}</Badge>
        {b.status === "done" && <Badge tone="sage">Jadi {b.qty_done}, gagal {b.qty_failed}</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
        <Panel title="Bahan terpakai dan biaya" icon={Receipt}>
          <div className="divide-y">
            {(b.materials_used as { item_type: string; kg: number; value: number }[]).map((m) => (
              <MoneyRow key={m.item_type} label={`${m.item_type} (${kg(m.kg)})`} value={rupiah(m.value)} />
            ))}
            <MoneyRow label="Bahan tambahan" value={rupiah(b.extra_cost_total)} />
            <MoneyRow label="Porsi alat" value={rupiah(b.tool_cost_total)} />
            <MoneyRow label="Upah tercatat" value={rupiah(b.wage_total)} />
            <MoneyRow label="Total biaya" value={rupiah(totalCost)} strong />
          </div>
        </Panel>

        <div className="space-y-6">
          {canFinish && (
            <Panel title="Catat hasil" description="Unit gagal tetap dihitung sebagai biaya." icon={ClipboardCheck}>
              <ActionForm action={finishBatch.bind(null, id)} submitLabel="Simpan hasil produksi">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Jumlah jadi" name="done" type="number" min={0} max={b.qty_planned} defaultValue={b.qty_planned} />
                  <Field label="Jumlah gagal" name="failed" type="number" min={0} max={b.qty_planned} defaultValue={0} />
                </div>
                <FotoUpload groupId={me.group!.id} label="Foto hasil karya" />
                <p className="text-sm text-muted-foreground">Foto ini dipakai sebagai foto produk di katalog online.</p>
              </ActionForm>
            </Panel>
          )}

          {isPengurus && b.status !== "cancelled" && (
            <Panel
              title="Upah anggota"
              description={paid > 0 ? `Sudah tercatat ${rupiah(paid)}` : "Saran upah dihitung dari estimasi ide."}
              icon={Coins}
            >
              <ActionForm action={payWages.bind(null, id)} submitLabel="Catat upah" variant="secondary">
                {(members ?? []).map((m) => (
                  <fieldset key={m.id} className="rounded-xl bg-daun-muda/60 p-3">
                    <legend className="sr-only">{m.full_name}</legend>
                    <input type="hidden" name="member_id" value={m.id} />
                    <p className="mb-2 text-base font-semibold text-tinta">{m.full_name}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Jam kerja" name={`hours_${m.id}`} type="number" step="0.5" required={false} />
                      <Field label="Upah (Rp)" name={`amount_${m.id}`} type="number" defaultValue={suggested} />
                    </div>
                  </fieldset>
                ))}
              </ActionForm>
            </Panel>
          )}

          {isPengurus && b.status === "running" && (
            <ActionForm action={cancelBatch.bind(null, id)} submitLabel="Batalkan batch, bahan kembali ke stok" variant="destructive" />
          )}
        </div>
      </div>
    </div>
  );
}
