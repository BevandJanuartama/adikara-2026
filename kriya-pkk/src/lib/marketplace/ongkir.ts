import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { GalatBiteship, cekTarif, pesanGalatBiteship, type Tarif } from "@/lib/marketplace/biteship";
import { MAKS_JARAK_KM, jarakKm, titikValid, type Titik } from "@/lib/marketplace/geo";
import { tarifManual, type RincianBerat } from "@/lib/marketplace/ongkir-manual";
import type { PoskoToko } from "@/lib/marketplace/types";

export type { PoskoToko };

type Produk = {
  id: string;
  name: string;
  sell_price: number;
  qty: number;
  weight_grams: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  posko_slug: string;
};

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

// Mode ongkir: "manual" (default, tabel tarif di ongkir-manual.ts) atau "biteship" (API Biteship)
export const MODE_ONGKIR = process.env.ONGKIR_MODE === "biteship" ? "biteship" : "manual";

export async function hitungOngkir(
  posko: PoskoToko,
  baris: {
    name: string;
    sell_price: number;
    weight_grams: number;
    qtyPesan: number;
    length_cm?: number | null;
    width_cm?: number | null;
    height_cm?: number | null;
  }[],
  tujuan: Titik & { postal?: string | null },
): Promise<{ jarakKm: number; tarif: Tarif[]; berat?: RincianBerat; jarakTagihKm?: number }> {
  const asal = { lat: Number(posko.latitude), lng: Number(posko.longitude) };
  if (!posko.bisa_kirim || !titikValid(asal)) {
    throw new KesalahanToko("Posko ini belum mengisi titik lokasi, jadi hanya bisa ambil di posko.");
  }
  if (!titikValid(tujuan)) throw new KesalahanToko("Tentukan titik lokasi pengiriman dulu.");
  const jarak = jarakKm(asal, tujuan);
  if (jarak > MAKS_JARAK_KM) {
    throw new KesalahanToko(
      `Alamat berjarak ${jarak.toFixed(0)} km dari posko. Pengiriman maksimal ${MAKS_JARAK_KM} km, pilih ambil di posko.`,
      422,
    );
  }
  if (MODE_ONGKIR === "manual") {
    const m = tarifManual(
      jarak,
      baris.map((b) => ({ weight_grams: b.weight_grams, qty: b.qtyPesan, length_cm: b.length_cm, width_cm: b.width_cm, height_cm: b.height_cm })),
    );
    return { jarakKm: jarak, tarif: m.tarif, berat: m.berat, jarakTagihKm: m.jarakTagihKm };
  }

  const barang = baris.map((b) => ({ name: b.name, value: Number(b.sell_price), weight: b.weight_grams, quantity: b.qtyPesan }));
  try {
    let tarif: Tarif[];
    try {
      tarif = await cekTarif({ ...asal, postal: posko.postal_code }, tujuan, barang);
    } catch (e) {
      // kode pos tidak dikenali → ulangi pakai titik koordinat saja
      if (e instanceof GalatBiteship && e.code === 40001001) tarif = await cekTarif(asal, tujuan, barang, false);
      else throw e;
    }
    return { jarakKm: jarak, tarif };
  } catch (e) {
    if (e instanceof GalatBiteship) throw new KesalahanToko(pesanGalatBiteship(e), e.status >= 500 ? 502 : 422);
    throw e;
  }
}
