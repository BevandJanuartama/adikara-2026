"use client";

import { ActionForm, Field } from "@/components/action-form";
import { inputClass, labelClass } from "@/components/kriya-ui";
import { FotoUpload } from "@/components/foto-upload";
import { KATEGORI } from "@/lib/marketplace/kategori";
import { saveProduct } from "@/lib/actions/ops";
import { cn } from "@/lib/utils";

export type ProdukForm = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  waste_materials: string[];
  weight_grams: number;
  sell_price: number;
  unit_cost: number;
  qty: number;
  photo_path: string | null;
  is_listed: boolean;
};

// Tambah / ubah produk + atur tampil di katalog online
export function ProductForm({ groupId, p }: { groupId: string; p?: ProdukForm }) {
  return (
    <ActionForm action={saveProduct.bind(null, p?.id ?? null)} submitLabel={p ? "Simpan perubahan" : "Tambah produk"} className="space-y-4">
      <Field label="Nama produk" name="name" defaultValue={p?.name ?? ""} placeholder="Contoh: Sabun cuci piring jelantah" />
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 block space-y-1.5 sm:col-span-1">
          <span className={labelClass}>Kategori</span>
          <select name="category" defaultValue={p?.category ?? "kerajinan"} className={inputClass}>
            {KATEGORI.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Harga jual (Rp)" name="sell_price" type="number" min={0} defaultValue={p ? Number(p.sell_price) : ""} />
        </div>
        <Field label="Stok" name="qty" type="number" min={0} defaultValue={p?.qty ?? 0} suffix="unit" />
        <Field label="Berat" name="weight_grams" type="number" min={1} defaultValue={p?.weight_grams ?? 250} suffix="gram" />
      </div>
      <Field label="Modal per unit (Rp)" name="unit_cost" type="number" min={0} required={false} defaultValue={p ? Number(p.unit_cost) : ""} />
      <Field
        label="Bahan limbah (pisahkan dengan koma)"
        name="waste_materials"
        defaultValue={p?.waste_materials.join(", ") ?? ""}
        placeholder="Minyak jelantah, kulit jeruk"
      />
      <label className="block space-y-1.5">
        <span className={labelClass}>
          Deskripsi <span className="font-normal text-muted-foreground">(opsional)</span>
        </span>
        <textarea
          name="description"
          rows={3}
          defaultValue={p?.description ?? ""}
          placeholder="Ukuran, rasa/aroma, cara pakai, keunggulan"
          className={cn(inputClass, "h-auto py-3")}
        />
      </label>
      <FotoUpload groupId={groupId} awal={p?.photo_path} />
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-daun-muda/60 px-4 py-3 text-base font-semibold text-tinta">
        <input type="checkbox" name="is_listed" defaultChecked={p?.is_listed ?? true} className="size-5 accent-hutan" />
        Tampilkan di katalog online
      </label>
    </ActionForm>
  );
}
