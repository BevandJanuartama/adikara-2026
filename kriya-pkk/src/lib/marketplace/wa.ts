// "0812-3456-7890" → "6281234567890" (format WhatsApp); null bila tidak valid
export function normalisasiWa(input: string | null | undefined): string | null {
  let v = String(input ?? "").replace(/\D/g, "");
  if (!v) return null;
  if (v.startsWith("0")) v = "62" + v.slice(1);
  else if (v.startsWith("8")) v = "62" + v;
  return /^62\d{8,13}$/.test(v) ? v : null;
}

export const linkWa = (nomor: string, pesan?: string) =>
  `https://wa.me/${nomor}${pesan ? `?text=${encodeURIComponent(pesan)}` : ""}`;

// tampilkan 6281234567890 sebagai 0812-3456-7890
export function formatHp(nomor: string | null | undefined): string {
  if (!nomor) return "-";
  const lokal = nomor.startsWith("62") ? "0" + nomor.slice(2) : nomor;
  return lokal.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}
