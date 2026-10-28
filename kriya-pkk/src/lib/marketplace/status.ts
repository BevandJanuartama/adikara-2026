import type { BadgeTone } from "@/components/kriya-ui";

export type StatusPesanan =
  | "menunggu_bayar" | "dibayar" | "diproses" | "dikirim" | "siap_diambil"
  | "selesai" | "batal" | "kedaluwarsa" | "gagal";

export const STATUS_PESANAN: Record<StatusPesanan, { label: string; tone: BadgeTone }> = {
  menunggu_bayar: { label: "Menunggu pembayaran", tone: "mentega" },
  dibayar: { label: "Dibayar", tone: "pucuk" },
  diproses: { label: "Diproses", tone: "pucuk" },
  dikirim: { label: "Dikirim", tone: "sage" },
  siap_diambil: { label: "Siap diambil", tone: "sage" },
  selesai: { label: "Selesai", tone: "netral" },
  batal: { label: "Dibatalkan", tone: "bata" },
  kedaluwarsa: { label: "Kedaluwarsa", tone: "bata" },
  gagal: { label: "Pembayaran gagal", tone: "bata" },
};

export const infoStatus = (s: string) =>
  STATUS_PESANAN[s as StatusPesanan] ?? { label: s, tone: "netral" as BadgeTone };

// Urutan langkah untuk garis waktu di halaman lacak
export function langkahPesanan(metode: "ambil" | "kurir") {
  return metode === "kurir"
    ? (["menunggu_bayar", "dibayar", "diproses", "dikirim", "selesai"] as StatusPesanan[])
    : (["menunggu_bayar", "dibayar", "diproses", "siap_diambil", "selesai"] as StatusPesanan[]);
}
