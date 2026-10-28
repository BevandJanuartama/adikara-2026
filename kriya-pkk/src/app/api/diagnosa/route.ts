import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GalatBiteship, cekTarif, pesanGalatBiteship } from "@/lib/marketplace/biteship";
import { CORE_BASE, authHeaderMidtrans } from "@/lib/marketplace/midtrans";
import { MIDTRANS_PRODUKSI } from "@/lib/marketplace/midtrans-mode";

// GET /api/diagnosa — cek cepat koneksi toko online. Aktif saat `npm run dev`,
// atau di produksi bila ?kunci= sama dengan CRON_SECRET.
// Tidak menampilkan isi kunci, hanya hasil pengecekan.
type Hasil = { ok: boolean; pesan: string };

async function cekMidtrans(): Promise<Hasil> {
  if (!process.env.MIDTRANS_SERVER_KEY?.trim()) return { ok: false, pesan: "MIDTRANS_SERVER_KEY kosong" };
  if (!process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim()) return { ok: false, pesan: "NEXT_PUBLIC_MIDTRANS_CLIENT_KEY kosong" };
  // Cek status pesanan fiktif: 404 = kunci cocok dengan lingkungan itu, 401 = tidak cocok
  const tanya = async (base: string) => {
    const r = await fetch(`${base}/v2/diagnosa-kriyapkk-0000/status`, {
      headers: { Authorization: authHeaderMidtrans(), Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const j = (await r.json().catch(() => null)) as { status_code?: string } | null;
    return String(j?.status_code ?? r.status);
  };
  try {
    const [sandbox, produksi] = await Promise.all([tanya(CORE_BASE.sandbox), tanya(CORE_BASE.produksi)]);
    const cocok = sandbox === "404" ? "sandbox" : produksi === "404" ? "produksi" : null;
    const mode = MIDTRANS_PRODUKSI ? "produksi" : "sandbox";
    if (!cocok) return { ok: false, pesan: `Server key ditolak di sandbox (${sandbox}) dan produksi (${produksi}). Salin ulang kuncinya dari dashboard Midtrans.` };
    if (cocok !== mode) {
      return { ok: false, pesan: `Kunci ini milik ${cocok.toUpperCase()}, tapi aplikasi berjalan di mode ${mode.toUpperCase()}. Isi NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=${cocok === "produksi"} lalu restart.` };
    }
    return { ok: true, pesan: `Server key valid untuk ${cocok.toUpperCase()} dan cocok dengan mode aplikasi.` };
  } catch (e) {
    return { ok: false, pesan: `Tidak bisa menghubungi Midtrans: ${e instanceof Error ? e.message : e}` };
  }
}

async function cekBiteship(): Promise<Hasil> {
  if (!process.env.BITESHIP_API_KEY?.trim()) return { ok: false, pesan: "BITESHIP_API_KEY kosong" };
  try {
    // Contoh: Dayeuhkolot → Dago (±9 km), 1 barang 250 g
    const tarif = await cekTarif(
      { lat: -6.9741, lng: 107.6309, postal: "40257" },
      { lat: -6.8915, lng: 107.6107, postal: "40135" },
      [{ name: "Uji ongkir", value: 15000, weight: 250, quantity: 1 }],
    );
    if (!tarif.length) return { ok: false, pesan: "Biteship terhubung, tapi tidak ada tarif. Aktifkan kurir di dashboard Biteship." };
    return { ok: true, pesan: `Biteship OK: ${tarif.map((t) => `${t.name} ${t.service} Rp${t.price}`).join(", ")}` };
  } catch (e) {
    if (e instanceof GalatBiteship) return { ok: false, pesan: `${pesanGalatBiteship(e)} [HTTP ${e.status}${e.code ? `, kode ${e.code}` : ""}: ${e.message}]` };
    return { ok: false, pesan: String(e) };
  }
}

async function cekDatabase(): Promise<Hasil> {
  try {
    const db = createAdminClient();
    const { data, error } = await db.rpc("katalog_list", { p_limit: 200 });
    if (error) return { ok: false, pesan: `Fungsi katalog error: ${error.message}. Sudah menjalankan 0002_marketplace.sql?` };
    const list = (data ?? []) as { posko_slug: string }[];
    const slug = list[0]?.posko_slug;
    if (!slug) return { ok: true, pesan: "Database OK, tapi belum ada produk tampil di katalog." };
    const { data: posko } = await db.rpc("katalog_posko", { p_slug: slug });
    const p = posko as { bisa_kirim?: boolean; postal_code?: string | null } | null;
    return {
      ok: true,
      pesan: `Database OK: ${list.length} produk tampil. Posko "${slug}": ${p?.bisa_kirim ? "titik lokasi terisi" : "TITIK LOKASI KOSONG (kurir tidak bisa)"}, kode pos ${p?.postal_code ?? "kosong"}.`,
    };
  } catch (e) {
    return { ok: false, pesan: `Tidak bisa memakai SUPABASE_SECRET_KEY: ${e instanceof Error ? e.message : e}` };
  }
}

// Di Vercel: buka /api/diagnosa?kunci=<isi CRON_SECRET>. Tanpa kunci yang benar → 404.
export async function GET(req: Request) {
  const kunci = new URL(req.url).searchParams.get("kunci") ?? "";
  const rahasia = process.env.CRON_SECRET?.trim() ?? "";
  const boleh = process.env.NODE_ENV !== "production" || (rahasia.length >= 16 && kunci === rahasia);
  if (!boleh) return NextResponse.json({ error: "not found" }, { status: 404 });
  const [database, biteship, midtrans] = await Promise.all([cekDatabase(), cekBiteship(), cekMidtrans()]);
  return NextResponse.json(
    {
      mode_midtrans: MIDTRANS_PRODUKSI ? "produksi" : "sandbox",
      app_url: process.env.NEXT_PUBLIC_APP_URL ?? "(kosong, pakai alamat request)",
      fonnte_token: process.env.FONNTE_API_TOKEN?.trim() ? "terisi" : "KOSONG",
      database,
      biteship,
      midtrans,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
