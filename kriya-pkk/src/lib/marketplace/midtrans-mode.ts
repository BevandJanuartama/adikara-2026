// Mode Midtrans ditentukan env, BUKAN dari awalan kunci: sebagian akun sandbox
// mendapat kunci "Mid-server-…" tanpa awalan "SB-", sama seperti kunci produksi.
// Kosong / "false" = sandbox. Isi "true" hanya saat memakai kunci produksi.
//
// Dibaca SAAT BERJALAN di server (nama env lewat variabel, jadi tidak "ditanam" saat build).
// Dengan begitu nilai lama dari cache build (.next) tidak terbawa. Browser menerima mode
// dari server lewat props, bukan membaca env sendiri.
const NAMA_ENV = ["MIDTRANS_IS_PRODUCTION", "NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION"];

export function midtransProduksi(): boolean {
  const v = NAMA_ENV.map((k) => process.env[k]).find((x) => x !== undefined && x !== "");
  return String(v ?? "").trim().toLowerCase() === "true";
}

export const snapJsUrl = (produksi: boolean) =>
  produksi ? "https://app.midtrans.com/snap/snap.js" : "https://app.sandbox.midtrans.com/snap/snap.js";

// Data yang dikirim server ke tombol bayar di browser
export type KonfigSnap = { clientKey: string; produksi: boolean };
