import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kg, rupiah } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { cancelBatch, finishBatch, payWages } from "@/lib/actions/ops";

// FR25 catat hasil, FR26 upah anggota
export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireMe(["pengurus", "anggota"]);
  const supabase = await createClient();
  const { data: b } = await supabase
    .from("production_batches")
    .select("*, ide:ideas(id, title, labor_cost)")
    .eq("id", id).maybeSingle();
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

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/ide/${ide.id}`} className="text-base underline">← {ide.title}</Link>
        <h1 className="text-2xl font-bold">Batch {b.status === "running" ? "berjalan" : b.status === "done" ? "selesai" : "batal"}</h1>
        <p className="text-base">Rencana {b.qty_planned} unit{b.status === "done" && ` · jadi ${b.qty_done} · gagal ${b.qty_failed}`}</p>
      </div>

      <section className="rounded-xl border p-4 text-base">
        <h2 className="mb-2 text-lg font-semibold">Bahan terpakai & biaya</h2>
        {(b.materials_used as { item_type: string; kg: number; value: number }[]).map((m) => (
          <p key={m.item_type} className="flex justify-between"><span>{m.item_type} {kg(m.kg)}</span><span>{rupiah(m.value)}</span></p>
        ))}
        <p className="flex justify-between"><span>Bahan tambahan</span><span>{rupiah(b.extra_cost_total)}</span></p>
        <p className="flex justify-between"><span>Porsi alat</span><span>{rupiah(b.tool_cost_total)}</span></p>
        <p className="flex justify-between"><span>Upah</span><span>{rupiah(b.wage_total)}</span></p>
        <p className="flex justify-between font-bold"><span>Total biaya</span><span>{rupiah(totalCost)}</span></p>
      </section>

      {canFinish && (
        <ActionForm action={finishBatch.bind(null, id)} submitLabel="✔ Catat hasil produksi" className="space-y-3 rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Catat hasil</h2>
          <Field label="Jumlah jadi" name="done" type="number" min={0} max={b.qty_planned} defaultValue={b.qty_planned} />
          <Field label="Jumlah gagal" name="failed" type="number" min={0} max={b.qty_planned} defaultValue={0} />
        </ActionForm>
      )}

      {isPengurus && b.status !== "cancelled" && (
        <ActionForm action={payWages.bind(null, id)} submitLabel="Catat upah" variant="secondary" className="space-y-3 rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Upah anggota</h2>
          {(wages ?? []).length > 0 && (
            <p className="text-sm text-muted-foreground">Sudah dicatat: {rupiah((wages ?? []).reduce((s, w) => s + Number(w.amount), 0))}</p>
          )}
          {(members ?? []).map((m) => (
            <div key={m.id} className="grid grid-cols-2 gap-2">
              <input type="hidden" name="member_id" value={m.id} />
              <p className="col-span-2 text-base font-semibold">{m.full_name}</p>
              <Field label="Jam kerja" name={`hours_${m.id}`} type="number" step="0.5" required={false} />
              <Field label="Upah (Rp)" name={`amount_${m.id}`} type="number" defaultValue={suggested} />
            </div>
          ))}
        </ActionForm>
      )}

      {isPengurus && b.status === "running" && (
        <ActionForm action={cancelBatch.bind(null, id)} submitLabel="Batalkan batch (bahan kembali ke stok)" variant="outline" />
      )}
    </div>
  );
}
