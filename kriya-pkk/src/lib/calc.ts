// Rumus yang SAMA dengan fungsi database _idea_costs & create_deposit (SRS lampiran 10).
// Dipakai untuk pratinjau langsung di layar (FR21); angka resmi tetap dihitung di database.

export const roundUp500 = (n: number) => Math.ceil(n / 500) * 500;

export function depositSubtotal(weightKg: number, pricePerKg: number, eligible: boolean) {
  return eligible ? Math.round(weightKg * pricePerKg) : 0; // FR10: tidak layak = Rp0
}

export type CostInput = {
  materials: { kg: number; valuePerKg: number }[]; // nilai rata-rata stok per kg
  extras: { price: number; qty?: number }[];       // bahan tambahan beli di warung
  toolCost: number;                                // porsi alat per unit
  timeHours: number;
  wagePerHour: number;
  margin: number;                                  // 0.4 = 40%
};

export function ideaCost(c: CostInput) {
  const material = Math.round(c.materials.reduce((s, m) => s + m.kg * m.valuePerKg, 0));
  const extra = Math.round(c.extras.reduce((s, e) => s + e.price * (e.qty ?? 1), 0));
  const tool = Math.round(c.toolCost);
  const labor = Math.round(c.timeHours * c.wagePerHour);
  const unitCost = material + extra + tool + labor;           // modal per unit
  const sellPrice = roundUp500(unitCost * (1 + c.margin));    // harga jual
  return { material, extra, tool, labor, unitCost, sellPrice, profitPerUnit: sellPrice - unitCost };
}
