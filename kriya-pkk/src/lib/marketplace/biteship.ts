import "server-only";
import type { TarifKurir } from "@/lib/marketplace/types";

// Cek ongkir Biteship: POST https://api.biteship.com/v1/rates/couriers
// Kurir instan (gojek, grab) memakai koordinat; kurir reguler (jne, sicepat, …) memakai kode pos.
const URL_TARIF = "https://api.biteship.com/v1/rates/couriers";
const KURIR_DEFAULT = "gojek,grab,jne,sicepat,anteraja,jnt";

// company = kode kurir ("gojek"), type = kode layanan ("instant"), eta mis. "1 - 3 jam"
export type Tarif = TarifKurir;

type Lokasi = { lat: number; lng: number; postal?: string | null };
type Barang = { name: string; value: number; weight: number; quantity: number };

const SATUAN: Record<string, string> = { hours: "jam", hour: "jam", days: "hari", day: "hari", minutes: "menit" };

export async function cekTarif(asal: Lokasi, tujuan: Lokasi, items: Barang[]): Promise<Tarif[]> {
  const key = process.env.BITESHIP_API_KEY;
  if (!key) throw new Error("BITESHIP_API_KEY belum diisi di .env.local");

  const body: Record<string, unknown> = {
    origin_latitude: asal.lat,
    origin_longitude: asal.lng,
    destination_latitude: tujuan.lat,
    destination_longitude: tujuan.lng,
    couriers: process.env.BITESHIP_COURIERS || KURIR_DEFAULT,
    items: items.map((i) => ({
      name: i.name.slice(0, 100),
      value: Math.round(i.value),
      weight: Math.max(1, Math.round(i.weight)),
      quantity: i.quantity,
    })),
  };
  if (asal.postal) body.origin_postal_code = Number(asal.postal);
  if (tujuan.postal) body.destination_postal_code = Number(tujuan.postal);

  const res = await fetch(URL_TARIF, {
    method: "POST",
    headers: { Authorization: key, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    message?: string;
    pricing?: Record<string, unknown>[];
  } | null;
  if (!res.ok || !json || json.success === false) {
    throw new Error(`Biteship: ${json?.error ?? json?.message ?? res.statusText}`);
  }

  return (json.pricing ?? [])
    .map((p) => {
      const range = String(p.shipment_duration_range ?? "").trim();
      const unit = String(p.shipment_duration_unit ?? "").trim();
      return {
        company: String(p.company ?? p.courier_code ?? ""),
        type: String(p.type ?? p.courier_service_code ?? ""),
        name: String(p.courier_name ?? p.company ?? ""),
        service: String(p.courier_service_name ?? p.type ?? ""),
        price: Number(p.price ?? 0),
        eta: range ? `${range} ${SATUAN[unit] ?? unit}`.trim() : String(p.duration ?? ""),
        description: p.description ? String(p.description) : undefined,
      } satisfies Tarif;
    })
    .filter((t) => t.company && t.type && t.price > 0)
    .sort((a, b) => a.price - b.price);
}
