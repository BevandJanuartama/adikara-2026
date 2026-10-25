// Jalankan: npx tsx --test src/lib/calc.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { roundUp500, depositSubtotal, ideaCost } from "./calc";

test("pembulatan ke atas kelipatan Rp500", () => {
  assert.equal(roundUp500(15750), 16000);
  assert.equal(roundUp500(16000), 16000);
  assert.equal(roundUp500(1), 500);
});

test("subtotal setoran = berat × harga, barang tidak layak = 0", () => {
  assert.equal(depositSubtotal(2.5, 3000, true), 7500);
  assert.equal(depositSubtotal(1.333, 1500, true), 2000);
  assert.equal(depositSubtotal(3, 3000, false), 0);
});

test("modal & harga jual pouch perca (sama dengan hasil fungsi database)", () => {
  const r = ideaCost({
    materials: [{ kg: 0.25, valuePerKg: 3000 }],
    extras: [{ price: 2000 }, { price: 500 }],
    toolCost: 500,
    timeHours: 0.6,
    wagePerHour: 12500,
    margin: 0.4,
  });
  assert.deepEqual(
    { material: r.material, extra: r.extra, tool: r.tool, labor: r.labor, unitCost: r.unitCost, sellPrice: r.sellPrice },
    { material: 750, extra: 2500, tool: 500, labor: 7500, unitCost: 11250, sellPrice: 16000 },
  );
});
