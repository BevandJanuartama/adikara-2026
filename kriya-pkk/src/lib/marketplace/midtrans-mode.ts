// Mode Midtrans ditentukan env, BUKAN dari awalan kunci: sebagian akun sandbox
// mendapat kunci "Mid-server-…" tanpa awalan "SB-", sama seperti kunci produksi.
// Kosong / "false" = sandbox. Isi "true" hanya saat memakai kunci produksi.
export const MIDTRANS_PRODUKSI = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

export const SNAP_JS_URL = MIDTRANS_PRODUKSI
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";
