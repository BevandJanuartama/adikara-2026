"use client";

import { useActionState, useState } from "react";
import { roundUp500 } from "@/lib/calc";
import { parseDecimal, rupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/components/action-form";

type Extra = { name: string; price: number; qty?: number };

// FR20–FR21: ubah harga bahan tambahan & margin → modal dan harga jual langsung dihitung ulang
export function PricingEditor({ costs, extras: initialExtras, canEdit, action }: {
  costs: { material_cost: number; tool_cost: number; labor_cost: number; margin: number; sell_price: number };
  extras: Extra[];
  canEdit: boolean;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [extras, setExtras] = useState(initialExtras);
  const [marginPct, setMarginPct] = useState(Math.round(costs.margin * 100));
  const [override, setOverride] = useState("");
  const [state, formAction, pending] = useActionState(action, undefined);

  const extraCost = Math.round(extras.reduce((s, e) => s + e.price * (e.qty ?? 1), 0));
  const unitCost = Math.round(costs.material_cost) + extraCost + Math.round(costs.tool_cost) + Math.round(costs.labor_cost);
  const sell = override ? parseDecimal(override) : roundUp500(unitCost * (1 + marginPct / 100));

  const row = (label: string, value: number, bold = false) => (
    <div className={`flex justify-between py-1 text-base ${bold ? "font-bold" : ""}`}><span>{label}</span><span>{rupiah(value)}</span></div>
  );

  return (
    <form action={formAction} className="space-y-3 rounded-xl border p-4">
      <h2 className="text-lg font-semibold">Rincian modal per unit</h2>
      {row("Bahan dari stok (nilai setoran)", costs.material_cost)}
      {extras.map((e, i) => (
        <div key={i} className="flex items-center justify-between gap-2 text-base">
          <span className="flex-1">{e.name}</span>
          {canEdit ? (
            <input inputMode="decimal" className="h-10 w-28 rounded-md border px-2 text-right" value={e.price}
              onChange={(ev) => setExtras(extras.map((x, idx) => (idx === i ? { ...x, price: parseDecimal(ev.target.value) } : x)))} />
          ) : <span>{rupiah(e.price)}</span>}
        </div>
      ))}
      {row("Porsi alat", costs.tool_cost)}
      {row("Upah perajin", costs.labor_cost)}
      <hr />
      {row("Modal (HPP)", unitCost, true)}
      {canEdit && (
        <label className="block text-base">
          Margin: <b>{marginPct}%</b>
          <input type="range" min={0} max={150} step={5} value={marginPct} onChange={(e) => setMarginPct(Number(e.target.value))} className="w-full" />
        </label>
      )}
      {row("Harga jual", sell, true)}
      {row("Laba kas per unit", sell - unitCost)}
      {canEdit && (
        <>
          <input type="hidden" name="extras" value={JSON.stringify(extras)} />
          <input type="hidden" name="margin_percent" value={marginPct} />
          <label className="block space-y-1 text-base">
            <span>Harga jual manual (opsional)</span>
            <input name="sell_price" inputMode="decimal" value={override} onChange={(e) => setOverride(e.target.value)}
              placeholder="kosongkan = otomatis" className="h-12 w-full rounded-md border px-3" />
          </label>
          {state?.error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{state.error}</p>}
          {state?.message && <p className="rounded-lg bg-green-50 p-3 text-green-800">{state.message}</p>}
          <Button type="submit" disabled={pending} className="h-12 w-full text-base">Simpan harga</Button>
        </>
      )}
    </form>
  );
}
