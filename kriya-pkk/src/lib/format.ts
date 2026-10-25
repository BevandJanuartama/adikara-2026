const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

export const rupiah = (n: number | string | null | undefined) => idr.format(Number(n ?? 0));
export const kg = (n: number | string | null | undefined) => `${num.format(Number(n ?? 0))} kg`;
export const angka = (n: number | string | null | undefined) => num.format(Number(n ?? 0));

// "2,5" → 2.5 (warga sering mengetik koma)
export const parseDecimal = (s: string) => {
  const v = parseFloat(s.replace(",", "."));
  return Number.isFinite(v) ? v : 0;
};

export const tanggal = (d: string | Date) =>
  new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
