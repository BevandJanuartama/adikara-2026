import { CirclePlus, Settings, SlidersVertical, Tags } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm, Field } from "@/components/action-form";
import { Badge, Notice, PageHeader, Panel } from "@/components/kriya-ui";
import { addPriceType, updateGroupSettings, updatePrice } from "@/lib/actions/ops";

// FR05 tabel harga, FR06 upah & margin
export default async function PengaturanPage() {
  const me = await requireMe(["pengurus"]);
  const supabase = await createClient();
  const { data: prices } = await supabase.from("price_table").select("id, item_type, price_per_kg, is_active").order("item_type");

  return (
    <div className="space-y-8">
      <PageHeader title="Harga, upah, dan margin" description="Angka dasar yang dipakai untuk menghitung nilai setoran dan modal produk." icon={Settings} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[21rem_minmax(0,1fr)] xl:items-start">
        <div className="space-y-6 xl:sticky xl:top-10">
          <Panel title="Upah dan margin" description="Nilai awal untuk setiap ide baru" icon={SlidersVertical}>
            <ActionForm action={updateGroupSettings} submitLabel="Simpan">
              <Field label="Upah per jam (Rp)" name="wage_per_hour" type="number" defaultValue={me.group!.wage_per_hour} />
              <Field label="Margin" name="margin_percent" type="number" defaultValue={Math.round(me.group!.default_margin * 100)} min={0} max={300} suffix="%" />
            </ActionForm>
          </Panel>

          <Panel title="Tambah jenis barang" icon={CirclePlus} className="border-dashed">
            <ActionForm action={addPriceType} submitLabel="Tambah jenis" variant="secondary">
              <Field label="Nama jenis" name="item_type" placeholder="Contoh: Botol kaca bening" />
              <Field label="Harga per kg (Rp)" name="price_per_kg" type="number" placeholder="3500" />
            </ActionForm>
          </Panel>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Tags className="size-5 text-hutan" aria-hidden />
            <h2 className="text-lg font-bold text-tinta">Tabel harga per kg ({prices?.length ?? 0} jenis)</h2>
          </div>
          <Notice>Ikuti harga pengepul setempat. Perubahan hanya berlaku untuk setoran berikutnya.</Notice>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {(prices ?? []).map((p) => (
              <ActionForm key={p.id} action={updatePrice.bind(null, p.id)} submitLabel="Simpan harga" variant="outline" className="space-y-4 rounded-2xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-bold text-tinta">{p.item_type}</p>
                  {!p.is_active && <Badge>Nonaktif</Badge>}
                </div>
                <Field label="Harga per kg (Rp)" name="price_per_kg" type="number" defaultValue={Number(p.price_per_kg)} />
                <label className="flex cursor-pointer items-center gap-2.5 text-base text-tinta">
                  <input type="checkbox" name="is_active" defaultChecked={p.is_active} className="size-5 accent-hutan" />
                  Dipakai di setoran
                </label>
              </ActionForm>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
