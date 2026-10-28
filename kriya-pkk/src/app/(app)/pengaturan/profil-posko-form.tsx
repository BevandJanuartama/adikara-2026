"use client";

import { ActionForm, Field } from "@/components/action-form";
import { LokasiInput } from "@/components/toko/lokasi-input";
import { updateShopProfile } from "@/lib/actions/ops";
import { formatHp } from "@/lib/marketplace/wa";

type Profil = {
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  whatsapp: string | null;
  latitude: number | null;
  longitude: number | null;
  shop_open: boolean;
};

// Data posko untuk toko online: alamat ambil di tempat, titik asal ongkir, WA notifikasi pesanan
export function ProfilPoskoForm({ g }: { g: Profil }) {
  return (
    <ActionForm action={updateShopProfile} submitLabel="Simpan profil posko" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nama posko" name="name" defaultValue={g.name} />
        <Field
          label="WhatsApp pengurus (notifikasi pesanan)"
          name="whatsapp"
          type="tel"
          defaultValue={g.whatsapp ? formatHp(g.whatsapp) : ""}
          placeholder="0812xxxxxxxx"
        />
        <div className="md:col-span-2">
          <Field label="Alamat posko" name="address" defaultValue={g.address ?? ""} placeholder="Jalan, RT/RW, kelurahan, kecamatan" />
        </div>
        <Field label="Kota / kabupaten" name="city" defaultValue={g.city ?? ""} placeholder="Kab. Bandung" />
        <Field label="Kode pos" name="postal_code" defaultValue={g.postal_code ?? ""} placeholder="40257" required={false} />
      </div>
      <LokasiInput
        label="Titik lokasi posko"
        wajib
        awal={g.latitude != null && g.longitude != null ? { lat: g.latitude, lng: g.longitude } : null}
        namaLat="latitude"
        namaLng="longitude"
        bantuan="Dipakai sebagai titik jemput kurir dan peta di katalog. Pengiriman dibatasi 150 km dari titik ini."
      />
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-daun-muda/60 p-4 text-base text-tinta">
        <input type="checkbox" name="shop_open" defaultChecked={g.shop_open} className="mt-0.5 size-5 accent-hutan" />
        <span>
          <span className="font-semibold">Toko online buka</span>
          <span className="block text-sm text-muted-foreground">Matikan sementara bila posko libur. Produk tidak tampil di katalog.</span>
        </span>
      </label>
    </ActionForm>
  );
}
