import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { cekTarif, type Tarif } from "@/lib/marketplace/biteship";
import { MAKS_JARAK_KM, jarakKm, titikValid, type Titik } from "@/lib/marketplace/geo";
import type { PoskoToko } from "@/lib/marketplace/types";

export type { PoskoToko };

type Produk = { id: string; name: string; sell_price: number; qty: number; weight_grams: number; posko_slug: string };

export class KesalahanToko extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

// Muat posko + produk keranjang dari database (harga & berat TIDAK diambil dari browser)
export async function muatKeranjang(slug: string, items: { id: string; qty: number }[]) {
  const db = createAdminClient();
  const [{ data: posko }, { data: produk }] = await Promise.all([
    db.rpc("katalog_posko", { p_slug: slug }),
    db.rpc("katalog_items", { p_ids: items.map((i) => i.id) }),
  ]);
  if (!posko) throw new KesalahanToko("Posko tidak ditemukan atau toko sedang tutup.", 404);
  const map = new Map(((produk ?? []) as Produk[]).map((p) => [p.id, p]));
  const baris = items.map((i) => {
    const p = map.get(i.id);
    if (!p || p.posko_slug !== slug) throw new KesalahanToko("Ada produk yang sudah tidak dijual. Muat ulang keranjang.");
    if (i.qty > p.qty) throw new KesalahanToko(`Stok ${p.name} tinggal ${p.qty}.`);
    return { ...p, qtyPesan: i.qty };
  });
  return { posko: posko as PoskoToko, baris };
}

export async function hitungOngkir(
  posko: PoskoToko,
  baris: { name: string; sell_price: number; weight_grams: number; qtyPesan: number }[],
  tujuan: Titik & { postal?: string | null },
): Promise<{ jarakKm: number; tarif: Tarif[] }> {
  const asal = { lat: Number(posko.latitude), lng: Number(posko.longitude) };
  if (!posko.bisa_kirim || !titikValid(asal)) {
    throw new KesalahanToko("Posko ini belum mengisi titik lokasi, jadi hanya bisa ambil di posko.");
  }
  if (!titikValid(tujuan)) throw new KesalahanToko("Tentukan titik lokasi pengiriman dulu.");
  const jarak = jarakKm(asal, tujuan);
  if (jarak > MAKS_JARAK_KM) {
    throw new KesalahanToko(
      `Alamat berjarak ${jarak.toFixed(0)} km dari posko. Pengiriman kurir lokal maksimal ${MAKS_JARAK_KM} km, pilih ambil di posko.`,
      422,
    );
  }
  const tarif = await cekTarif(
    { ...asal, postal: posko.postal_code },
    tujuan,
    baris.map((b) => ({ name: b.name, value: b.sell_price, weight: b.weight_grams, quantity: b.qtyPesan })),
  );
  return { jarakKm: jarak, tarif };
}
