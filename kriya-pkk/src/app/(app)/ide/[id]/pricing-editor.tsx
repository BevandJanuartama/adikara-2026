"use client";

import { useActionState, useState } from "react";
import { Calculator, Save } from "lucide-react";
import { roundUp500 } from "@/lib/calc";
import { parseDecimal, rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FormState } from "@/components/action-form";
import { MoneyRow, Notice, Panel, btn, inputClass, labelClass } from "@/components/kriya-ui";

type Extra = { name: string; price: number; qty?: number };

// FR20–FR21: ubah harga bahan tambahan & margin → modal dan harga jual langsung dihitung ulang
export function PricingEditor({
  costs,
  extras: initialExtras,
  canEdit,
  action,
}: {
  costs: { material_cost: number; tool_cost: number; labor_cost: number; margin: number; sell_price: number };
  extras: Extra[];
  canEdit: boolean;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [extras, setExtras] = useState(initialExtras ?? []);
  const [marginPct, setMarginPct] = useState(Math.round(costs.margin * 100));
  const [override, setOverride] = useState("");
  const [state, formAction, pending] = useActionState(action, undefined);

  const extraCost = Math.round(extras.reduce((s, e) => s + e.price * (e.qty ?? 1), 0));
  const unitCost = Math.round(costs.material_cost) + extraCost + Math.round(costs.tool_cost) + Math.round(costs.labor_cost);
  const sell = override ? parseDecimal(override) : roundUp500(unitCost * (1 + marginPct / 100));
  const profit = sell - unitCost;

  return (
    <Panel title="Modal dan harga jual" description="Per 1 unit, dihitung ulang saat angka diubah" icon={Calculator}>
      <form action={formAction} className="space-y-4">
        <div className="divide-y">
          <MoneyRow label="Bahan dari stok" value={rupiah(costs.material_cost)} />
          {extras.map((e, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 text-base text-muted-foreground">{e.name}</span>
              {canEdit ? (
                <span className="relative w-32 shrink-0">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">Rp</span>
                  <input
                    inputMode="decimal"
                    aria-label={`Harga ${e.name}`}
                    className={cn(inputClass, "h-10 pl-9 text-right font-semibold")}
                    value={e.price}
                    onChange={(ev) => setExtras(extras.map((x, idx) => (idx === i ? { ...x, price: parseDecimal(ev.target.value) } : x)))}
                  />
                </span>
              ) : (
                <span className="font-semibold tabular-nums text-tinta">{rupiah(e.price)}</span>
              )}
            </div>
          ))}
          <MoneyRow label="Porsi alat" value={rupiah(costs.tool_cost)} />
          <MoneyRow label="Upah perajin" value={rupiah(costs.labor_cost)} />
          <MoneyRow label="Modal" value={rupiah(unitCost)} strong />
        </div>

        <div className="jahitan grid grid-cols-2 gap-3 rounded-xl bg-pucuk p-4">
          <div>
            <p className="text-sm font-semibold text-pucuk-ink">Harga jual</p>
            <p className="text-2xl font-extrabold tabular-nums text-tinta">{rupiah(sell)}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-pucuk-ink">Laba per unit</p>
            <p className={cn("text-2xl font-extrabold tabular-nums", profit < 0 ? "text-bata-ink" : "text-tinta")}>{rupiah(profit)}</p>
          </div>
        </div>

        {canEdit && (
          <>
            <label className="block space-y-2">
              <span className="flex items-center justify-between">
                <span className={labelClass}>Margin</span>
                <span className="rounded-md bg-mentega px-2 py-0.5 text-base font-bold tabular-nums text-tinta">{marginPct}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={150}
                step={5}
                value={marginPct}
                onChange={(e) => setMarginPct(Number(e.target.value))}
                className="w-full cursor-pointer accent-hutan"
              />
            </label>

            <input type="hidden" name="extras" value={JSON.stringify(extras)} />
            <input type="hidden" name="margin_percent" value={marginPct} />

            <label className="block space-y-1.5">
              <span className={labelClass}>
                Harga jual manual <span className="font-normal text-muted-foreground">(opsional)</span>
              </span>
              <input
                name="sell_price"
                inputMode="decimal"
                value={override}
                onChange={(e) => setOverride(e.target.value)}
                placeholder="Kosongkan untuk otomatis"
                className={inputClass}
              />
            </label>

            {state?.error && <Notice tone="error">{state.error}</Notice>}
            {state?.message && <Notice tone="success">{state.message}</Notice>}

            <button type="submit" disabled={pending} className={cn(btn.primary, "w-full")}>
              <Save /> {pending ? "Menyimpan…" : "Simpan harga"}
            </button>
          </>
        )}
      </form>
    </Panel>
  );
}
