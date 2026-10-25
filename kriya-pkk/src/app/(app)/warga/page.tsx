import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { withdrawBalance } from "@/lib/actions/ops";

// FR14 data warga, FR13 pencairan saldo
export default async function WargaPage() {
  await requireMe(["pengurus"]);
  const supabase = await createClient();
  const { data: residents } = await supabase.from("residents").select("id, name, phone, balance").order("name");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Warga & saldo</h1>
      <p className="text-base text-muted-foreground">Warga baru ditambahkan dari menu Setor.</p>
      {(residents ?? []).map((r) => (
        <details key={r.id} className="rounded-xl border p-4">
          <summary className="flex cursor-pointer justify-between text-lg">
            <span className="font-semibold">{r.name}</span>
            <span>{rupiah(r.balance)}</span>
          </summary>
          <div className="mt-3">
            {r.phone && <p className="mb-2 text-sm text-muted-foreground">HP: {r.phone}</p>}
            {Number(r.balance) > 0 && (
              <ActionForm action={withdrawBalance.bind(null, r.id)} submitLabel="Cairkan saldo" variant="secondary">
                <Field label="Jumlah (Rp)" name="amount" type="number" max={Number(r.balance)} defaultValue={Number(r.balance)} />
              </ActionForm>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
