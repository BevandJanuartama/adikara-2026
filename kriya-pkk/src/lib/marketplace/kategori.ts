import { CookingPot, Scissors, SprayCan, Sprout, type LucideIcon } from "lucide-react";

// Kategori produk olahan limbah di katalog (sama dengan constraint database)
export const KATEGORI = [
  { key: "kuliner", label: "Kuliner", icon: CookingPot, tone: "persik" },
  { key: "kerajinan", label: "Kerajinan", icon: Scissors, tone: "mentega" },
  { key: "pupuk", label: "Pupuk", icon: Sprout, tone: "pucuk" },
  { key: "kebersihan", label: "Kebersihan", icon: SprayCan, tone: "sage" },
] as const satisfies readonly { key: string; label: string; icon: LucideIcon; tone: string }[];

export type Kategori = (typeof KATEGORI)[number]["key"];

export const isKategori = (v: unknown): v is Kategori => KATEGORI.some((k) => k.key === v);
export const infoKategori = (k: string) => KATEGORI.find((x) => x.key === k) ?? KATEGORI[1];
