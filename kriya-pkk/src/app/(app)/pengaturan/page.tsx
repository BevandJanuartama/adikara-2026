import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm, Field } from "@/components/action-form";
import { addPriceType, updateGroupSettings, updatePrice } from "@/lib/actions/ops";

// FR05 tabel harga, FR06 upah & margin
export default async function PengaturanPage() {
  const me = await requireMe(["pengurus"]);
  const supabase = await createClient();
  const { data: prices } = await supabase
    .from("price_table").select("id, item_type, price_per_kg, is_active").order("item_type");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Upah & margin default</h2>
        <ActionForm action={updateGroupSettings} submitLabel="Simpan pengaturan" className="space-y-3 rounded-xl border p-4">
          <Field label="Upah per jam (Rp)" name="wage_per_hour" type="number" defaultValue={me.group!.wage_per_hour} />
          <Field label="Margin default (%)" name="margin_percent" type="number" defaultValue={Math.round(me.group!.default_margin * 100)} min={0} max={300} />
        </ActionForm>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tabel harga per kg</h2>
        <p className="text-base text-muted-foreground">Ikuti harga pengepul setempat. Perubahan berlaku untuk setoran berikutnya.</p>
        {(prices ?? []).map((p) => (
          <ActionForm key={p.id} action={updatePrice.bind(null, p.id)} submitLabel="Simpan" variant="outline"
            className="space-y-2 rounded-xl border p-4">
            <p className="text-lg font-semibold">{p.item_type}</p>
            <Field label="Harga per kg (Rp)" name="price_per_kg" type="number" defaultValue={Number(p.price_per_kg)} />
            <label className="flex items-center gap-2 text-base">
              <input type="checkbox" name="is_active" defaultChecked={p.is_active} className="size-5" /> Aktif
            </label>
          </ActionForm>
        ))}
        <ActionForm action={addPriceType} submitLabel="Tambah jenis" className="space-y-2 rounded-xl border border-dashed p-4">
          <Field label="Jenis barang baru" name="item_type" placeholder="mis. Botol kaca bening" />
          <Field label="Harga per kg (Rp)" name="price_per_kg" type="number" />
        </ActionForm>
      </section>
    </div>
  );
}
