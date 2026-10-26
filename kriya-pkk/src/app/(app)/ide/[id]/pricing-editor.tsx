"use client";

import { useState } from "react";
import { useActionState } from "react";
import { roundUp500 } from "@/lib/calc";
import { parseDecimal, rupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/components/action-form";
import {
  Calculator,
  Coins,
  TrendingUp,
  Sliders,
  Save,
  AlertCircle,
  CheckCircle2,
  ReceiptText,
} from "lucide-react";

type Extra = { name: string; price: number; qty?: number };

// FR20–FR21: ubah harga bahan tambahan & margin → modal dan harga jual langsung dihitung ulang
export function PricingEditor({
  costs,
  extras: initialExtras,
  canEdit,
  action,
}: {
  costs: {
    material_cost: number;
    tool_cost: number;
    labor_cost: number;
    margin: number;
    sell_price: number;
  };
  extras: Extra[];
  canEdit: boolean;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [extras, setExtras] = useState(initialExtras);
  const [marginPct, setMarginPct] = useState(Math.round(costs.margin * 100));
  const [override, setOverride] = useState("");
  const [state, formAction, pending] = useActionState(action, undefined);

  const extraCost = Math.round(
    extras.reduce((s, e) => s + e.price * (e.qty ?? 1), 0),
  );
  const unitCost =
    Math.round(costs.material_cost) +
    extraCost +
    Math.round(costs.tool_cost) +
    Math.round(costs.labor_cost);
  const sell = override
    ? parseDecimal(override)
    : roundUp500(unitCost * (1 + marginPct / 100));

  const row = (
    label: string,
    value: number,
    bold = false,
    isProfit = false,
  ) => (
    <div
      className={`flex items-center justify-between py-2 text-xs sm:text-sm ${bold ? "font-bold text-foreground border-t pt-2.5" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span
        className={
          bold
            ? isProfit
              ? "text-emerald-700 text-base"
              : "text-foreground"
            : "font-medium text-foreground"
        }
      >
        {rupiah(value)}
      </span>
    </div>
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl border bg-card p-5 shadow-2xs space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b pb-3">
        <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
          <Calculator className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold">
            Rincian Modal & Harga Jual (HPP)
          </h2>
          <p className="text-xs text-muted-foreground">
            Kalkulasi otomatis biaya produksi per unit
          </p>
        </div>
      </div>

      <div className="space-y-1 divide-y divide-muted/40">
        {row("Bahan dari stok (nilai setoran)", costs.material_cost)}

        {/* Bahan Tambahan */}
        {extras.map((e, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 py-2 text-xs sm:text-sm"
          >
            <span className="flex-1 text-muted-foreground font-medium">
              {e.name}
            </span>
            {canEdit ? (
              <div className="relative w-32">
                <Input
                  inputMode="decimal"
                  className="h-9 pr-7 text-right text-xs font-bold"
                  value={e.price}
                  onChange={(ev) =>
                    setExtras(
                      extras.map((x, idx) =>
                        idx === i
                          ? { ...x, price: parseDecimal(ev.target.value) }
                          : x,
                      ),
                    )
                  }
                />
                <span className="absolute right-2.5 top-2.5 text-[11px] text-muted-foreground">
                  Rp
                </span>
              </div>
            ) : (
              <span className="font-medium text-foreground">
                {rupiah(e.price)}
              </span>
            )}
          </div>
        ))}

        {row("Porsi alat", costs.tool_cost)}
        {row("Upah perajin", costs.labor_cost)}
      </div>

      {/* Total HPP & Harga Jual Highlights */}
      <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
        {row("Total Modal (HPP)", unitCost, true)}
        {row("Harga Jual Rekomendasi", sell, true)}
        {row("Laba Bersih / Unit", sell - unitCost, true, true)}
      </div>

      {/* Margin Slider (Khusus Pengurus) */}
      {canEdit && (
        <div className="space-y-2.5 pt-2 border-t">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
              <Sliders className="h-3.5 w-3.5" /> Margin Keuntungan
            </span>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-800 font-extrabold text-sm">
              {marginPct}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={150}
            step={5}
            value={marginPct}
            onChange={(e) => setMarginPct(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>
      )}

      {/* Field Tambahan & Tombol Simpan */}
      {canEdit && (
        <div className="space-y-3.5 pt-3 border-t">
          <input type="hidden" name="extras" value={JSON.stringify(extras)} />
          <input type="hidden" name="margin_percent" value={marginPct} />

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Harga Jual Manual (Opsional)
            </Label>
            <Input
              name="sell_price"
              inputMode="decimal"
              value={override}
              onChange={(e) => setOverride(e.target.value)}
              placeholder="Kosongkan jika ingin mengikuti kalkulasi otomatis"
              className="h-11 text-xs"
            />
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{state.error}</span>
            </div>
          )}

          {state?.message && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{state.message}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="h-12 w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm gap-2"
          >
            {pending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Menyimpan Harga…</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Simpan Perubahan Harga</span>
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
