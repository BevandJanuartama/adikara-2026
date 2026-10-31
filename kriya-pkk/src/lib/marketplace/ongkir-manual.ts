// Ongkir manual (tarif simulasi) ekspedisi untuk jarak ≤ 150 km dari posko.
// Hanya ekspedisi yang memberi nomor resi (tanpa ojek online/kurir instan).
// Dipakai di server saat checkout, jadi angka di browser tidak bisa diakali.
// Ubah angka tarif di MATRIKS bila ingin menyesuaikan.
import type { TarifKurir } from "@/lib/marketplace/types";

// Jarak jalan biasanya lebih panjang dari garis lurus antar-koordinat.
// 1,3 = perkiraan umum di perkotaan. Isi 1 bila ingin memakai jarak garis lurus apa adanya.
export const FAKTOR_JALAN = 1.3;
export const PEMBAGI_VOLUMETRIK = 6000; // darat/reguler
export const TOLERANSI_KG = 0.3; // ≤ 1,30 kg → 1 kg; 1,31–2,30 kg → 2 kg, dst.

export type BarangKirim = {
  weight_grams: number;
  qty: number;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
};

export type RincianBerat = {
  aktualKg: number;      // berat timbangan
  volumetrikKg: number;  // P × L × T / 6000 (hanya produk yang ukuran kemasannya diisi)
  dikenakanKg: number;   // max(aktual, volumetrik)
  dibulatkanKg: number;  // setelah toleransi 0,3 kg, minimal 1 kg
};

const dua = (n: number) => Math.round(n * 100) / 100;

export function bulatkanBerat(kg: number): number {
  const k = dua(Math.max(0, kg));
  const bulat = Math.floor(k);
  const sisa = dua(k - bulat);
  return Math.max(1, sisa > TOLERANSI_KG ? bulat + 1 : bulat);
}

export function hitungBerat(barang: BarangKirim[]): RincianBerat {
  const aktualKg = dua(barang.reduce((s, b) => s + (b.weight_grams * b.qty) / 1000, 0));
  const volumetrikKg = dua(
    barang.reduce((s, b) => {
      if (!b.length_cm || !b.width_cm || !b.height_cm) return s;
      return s + (b.length_cm * b.width_cm * b.height_cm * b.qty) / PEMBAGI_VOLUMETRIK;
    }, 0),
  );
  const dikenakanKg = Math.max(aktualKg, volumetrikKg);
  return { aktualKg, volumetrikKg, dikenakanKg, dibulatkanKg: bulatkanBerat(dikenakanKg) };
}

// Jarak yang ditagihkan: jarak jalan, dibulatkan ke atas per km
export const jarakTagihKm = (jarakGarisLurusKm: number) => Math.max(1, Math.ceil(jarakGarisLurusKm * FAKTOR_JALAN));

type Layanan = {
  company: string;
  type: string;
  name: string;
  service: string;
  eta: string;
  kelompok: "reguler" | "kargo";
  // D = jarak tagih (km), W = berat dibulatkan (kg)
  harga: (D: number, W: number) => number;
};

export const MATRIKS: Layanan[] = [
  // Ekspedisi reguler (minimal 1 kg)
  { company: "jne", type: "reg", name: "JNE", service: "REG", eta: "1 - 2 hari", kelompok: "reguler",
    harga: (D, W) => 8000 + D * 50 + (W - 1) * 7000 },
  { company: "jne", type: "yes", name: "JNE", service: "YES", eta: "1 hari", kelompok: "reguler",
    harga: (D, W) => 15000 + D * 80 + (W - 1) * 10000 },
  { company: "jnt", type: "ez", name: "J&T", service: "EZ", eta: "1 - 2 hari", kelompok: "reguler",
    harga: (D, W) => 9000 + D * 50 + (W - 1) * 7500 },
  { company: "sicepat", type: "reg", name: "SiCepat", service: "REG", eta: "1 - 2 hari", kelompok: "reguler",
    harga: (D, W) => 8500 + D * 50 + (W - 1) * 7000 },
  { company: "pos", type: "kilat_khusus", name: "Pos Indonesia", service: "Kilat Khusus", eta: "1 - 2 hari", kelompok: "reguler",
    harga: (D, W) => 7500 + D * 40 + (W - 1) * 6500 },
  // Kargo (minimal ditagih 10 kg)
  { company: "jne", type: "jtr", name: "JNE", service: "JTR (Kargo)", eta: "2 - 3 hari", kelompok: "kargo",
    harga: (D, W) => 25000 + D * 100 + Math.max(0, W - 10) * 2000 },
  { company: "sicepat", type: "gokil", name: "SiCepat", service: "GOKIL (Kargo)", eta: "2 - 3 hari", kelompok: "kargo",
    harga: (D, W) => 25000 + D * 100 + Math.max(0, W - 10) * 2000 },
];

const URUTAN = { reguler: 0, kargo: 1 } as const;

export function tarifManual(jarakGarisLurusKm: number, barang: BarangKirim[]): {
  tarif: TarifKurir[];
  berat: RincianBerat;
  jarakTagihKm: number;
} {
  const berat = hitungBerat(barang);
  const D = jarakTagihKm(jarakGarisLurusKm);
  const W = berat.dibulatkanKg;
  const tarif = MATRIKS.map((l) => ({
    company: l.company,
    type: l.type,
    name: l.name,
    service: l.service,
    eta: l.eta,
    kelompok: l.kelompok,
    price: Math.round(l.harga(D, W)),
  }))
    // urut per kelompok (reguler, lalu kargo), lalu termurah
    .sort((a, b) => URUTAN[a.kelompok] - URUTAN[b.kelompok] || a.price - b.price);
  return { tarif, berat, jarakTagihKm: D };
}
