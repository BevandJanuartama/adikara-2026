import "server-only";
import type { TarifKurir } from "@/lib/marketplace/types";

// Cek ongkir Biteship: POST https://api.biteship.com/v1/rates/couriers (header Authorization: <API key>)
// Kurir instan (gojek, grab, paxel, lalamove, borzo) wajib koordinat; kurir reguler lebih akurat dengan kode pos.
const URL_TARIF = "https://api.biteship.com/v1/rates/couriers";
const KURIR_DEFAULT = "gojek,grab,jne,sicepat,anteraja,jnt";

export type Tarif = TarifKurir;

const NAMA_KURIR: Record<string, string> = {
  gojek: "GoSend", grab: "GrabExpress", jne: "JNE", sicepat: "SiCepat", anteraja: "AnterAja", jnt: "J&T",
  pos: "POS Indonesia", tiki: "TIKI", ninja: "Ninja Xpress", lion: "Lion Parcel", paxel: "Paxel",
  lalamove: "Lalamove", borzo: "Borzo", idexpress: "ID Express", sap: "SAP Express",
};
const SATUAN: Record<string, string> = { hours: "jam", hour: "jam", days: "hari", day: "hari", minutes: "menit" };

// Error dari Biteship, membawa kode resmi (mis. 40001010 = belum ada kurir aktif untuk lokasi itu)
export class GalatBiteship extends Error {
  constructor(message: string, public status: number, public code?: number) {
    super(message);
  }
}

type Lokasi = { lat: number; lng: number; postal?: string | null };
type Barang = { name: string; value: number; weight: number; quantity: number };

export async function cekTarif(asal: Lokasi, tujuan: Lokasi, items: Barang[], pakaiKodePos = true): Promise<Tarif[]> {
  const key = process.env.BITESHIP_API_KEY?.trim();
  if (!key) throw new GalatBiteship("BITESHIP_API_KEY belum diisi di .env.local", 500);

  const body: Record<string, unknown> = {
    origin_latitude: asal.lat,
    origin_longitude: asal.lng,
    destination_latitude: tujuan.lat,
    destination_longitude: tujuan.lng,
    couriers: (process.env.BITESHIP_COURIERS || KURIR_DEFAULT).replace(/\s/g, ""),
    items: items.map((i) => ({
      name: i.name.slice(0, 100),
      value: Math.max(1, Math.round(i.value)),
      weight: Math.max(1, Math.round(i.weight)),
      quantity: i.quantity,
    })),
  };
  if (pakaiKodePos && asal.postal && tujuan.postal) {
    body.origin_postal_code = Number(asal.postal);
    body.destination_postal_code = Number(tujuan.postal);
  }

  let res: Response;
  try {
    res = await fetch(URL_TARIF, {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    throw new GalatBiteship(`Tidak bisa menghubungi Biteship (${e instanceof Error ? e.message : "jaringan"})`, 503);
  }
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    message?: string;
    code?: number;
    pricing?: Record<string, unknown>[];
  } | null;
  if (!res.ok || !json || json.success === false) {
    console.warn("[biteship] gagal", res.status, json?.code, json?.error ?? json?.message);
    throw new GalatBiteship(json?.error ?? json?.message ?? res.statusText, res.status, json?.code);
  }

  return (json.pricing ?? [])
    .map((p) => {
      const company = String(p.company ?? p.courier_code ?? "");
      const range = String(p.shipment_duration_range ?? "").trim();
      const unit = String(p.shipment_duration_unit ?? "").trim();
      return {
        company,
        type: String(p.type ?? p.courier_service_code ?? ""),
        name: String(p.courier_name ?? NAMA_KURIR[company] ?? company.toUpperCase()),
        service: String(p.courier_service_name ?? p.type ?? ""),
        price: Number(p.price ?? 0),
        eta: range ? `${range} ${SATUAN[unit] ?? unit}`.trim() : String(p.duration ?? ""),
        description: p.description ? String(p.description) : undefined,
      } satisfies Tarif;
    })
    .filter((t) => t.company && t.type && t.price > 0)
    .sort((a, b) => a.price - b.price);
}

// Pesan yang bisa dipahami pengguna (kode error resmi Biteship)
export function pesanGalatBiteship(e: GalatBiteship): string {
  if (e.status === 401 || e.status === 403) {
    return "API key Biteship ditolak. Periksa BITESHIP_API_KEY (tanpa spasi/tanda kutip) dan pastikan akun Biteship aktif.";
  }
  switch (e.code) {
    case 40001010:
      return "Belum ada kurir aktif untuk lokasi ini. Aktifkan kurir (GoSend, GrabExpress, JNE, dll.) di dashboard Biteship, atau pilih ambil di posko.";
    case 40001001:
      return "Kode pos tidak dikenali Biteship. Periksa kode pos posko dan alamat tujuan.";
    case 40001002:
      return "Data ongkir belum lengkap (titik lokasi, kode pos, atau berat produk).";
  }
  if (e.status >= 500 && e.status !== 503) return "Layanan Biteship sedang bermasalah. Coba lagi sebentar.";
  return `Biteship: ${e.message}`;
}
