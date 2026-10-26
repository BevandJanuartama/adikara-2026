import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm, Field } from "@/components/action-form";
import {
  addPriceType,
  updateGroupSettings,
  updatePrice,
} from "@/lib/actions/ops";
import {
  Settings,
  Coins,
  Sliders,
  Tags,
  PlusCircle,
  CheckCircle2,
  Store,
  Layers,
} from "lucide-react";

// FR05 tabel harga, FR06 upah & margin
export default async function PengaturanPage() {
  const me = await requireMe(["pengurus"]);
  const supabase = await createClient();
  const { data: prices } = await supabase
    .from("price_table")
    .select("id, item_type, price_per_kg, is_active")
    .order("item_type");

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      {/* Header & Judul */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pengaturan Sistem
          </h1>
          <p className="text-xs text-muted-foreground">
            Kelola parameter operasional, upah, margin, dan tabel harga sampah
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 shadow-2xs">
          <Settings className="h-6 w-6" />
        </div>
      </div>

      {/* Bagian 1: Upah & Margin Default */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sliders className="h-4 w-4 text-emerald-700" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Upah & Margin Default
          </h2>
        </div>

        <ActionForm
          action={updateGroupSettings}
          submitLabel="Simpan Pengaturan Umum"
          className="space-y-4 rounded-2xl border bg-card p-5 shadow-2xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Upah per Jam (Rp)"
              name="wage_per_hour"
              type="number"
              defaultValue={me.group!.wage_per_hour}
            />
            <Field
              label="Margin Default (%)"
              name="margin_percent"
              type="number"
              defaultValue={Math.round(me.group!.default_margin * 100)}
              min={0}
              max={300}
            />
          </div>
        </ActionForm>
      </section>

      {/* Bagian 2: Tabel Harga per Kg */}
      <section className="space-y-3.5 pt-2">
        <div className="flex items-center gap-2 px-1">
          <Tags className="h-4 w-4 text-emerald-700" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Tabel Harga Sampah per Kg
          </h2>
        </div>

        <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground flex items-center gap-2">
          <span className="font-semibold text-foreground">💡 Info:</span>
          <span>
            Ikuti harga pengepul setempat. Perubahan berlaku untuk setoran
            berikutnya.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {(prices ?? []).map((p) => (
            <ActionForm
              key={p.id}
              action={updatePrice.bind(null, p.id)}
              submitLabel="Simpan Perubahan Harga"
              variant="outline"
              className="space-y-3 rounded-2xl border bg-card p-4 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b pb-2.5">
                <p className="text-sm font-bold capitalize text-foreground">
                  {p.item_type}
                </p>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={p.is_active}
                    className="size-4 rounded border-gray-300 accent-primary"
                  />
                  <span>Aktif</span>
                </label>
              </div>

              <Field
                label="Harga per Kg (Rp)"
                name="price_per_kg"
                type="number"
                defaultValue={Number(p.price_per_kg)}
              />
            </ActionForm>
          ))}
        </div>

        {/* Formulir Tambah Jenis Barang Baru */}
        <ActionForm
          action={addPriceType}
          submitLabel="Tambah Jenis Barang Baru"
          className="space-y-3 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/20 p-5 mt-4"
        >
          <div className="flex items-center gap-2 border-b pb-2.5">
            <PlusCircle className="h-4 w-4 text-emerald-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Tambah Jenis Barang / Material
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Jenis Barang Baru"
              name="item_type"
              placeholder="Contoh: Botol Kaca Bening"
            />
            <Field
              label="Harga per Kg (Rp)"
              name="price_per_kg"
              type="number"
              placeholder="Contoh: 3500"
            />
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
