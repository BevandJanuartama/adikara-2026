export type PoskoToko = {
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  bisa_kirim: boolean;
};

export type TarifKurir = {
  company: string;
  type: string;
  name: string;
  service: string;
  price: number;
  eta: string;
  description?: string;
  kelompok?: "reguler" | "kargo";
};
