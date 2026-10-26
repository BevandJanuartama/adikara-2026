import Link from "next/link";
import { Banknote, ChevronDown, Coins, Phone, UserCheck, UsersRound } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { EmptyState, Notice, PageHeader, StatPatch, btn } from "@/components/kriya-ui";
import { withdrawBalance } from "@/lib/actions/ops";

// FR14 data warga, FR13 pencairan saldo
export default async function WargaPage() {
  await requireMe(["pengurus"]);
  const supabase = await createClient();
  const { data: residents } = await supabase.from("residents").select("id, name, phone, balance").order("name");
  const list = residents ?? [];
  const totalBalance = list.reduce((s, r) => s + Number(r.balance), 0);
  const withBalance = list.filter((r) => Number(r.balance) > 0).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Warga dan saldo"
        description="Penyetor sampah beserta saldo tabungannya. Buka nama warga untuk mencairkan saldo."
        icon={UsersRound}
        actions={<Link href="/setoran/baru" className={btn.outline}>Tambah lewat setoran</Link>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <StatPatch tone="mentega" label="Total saldo warga" value={rupiah(totalBalance)} icon={Coins} className="col-span-2 md:col-span-1" />
        <StatPatch tone="pucuk" label="Jumlah warga" value={`${list.length} orang`} icon={UsersRound} />
        <StatPatch tone="persik" label="Punya saldo" value={`${withBalance} orang`} icon={Banknote} />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={UserCheck} title="Belum ada warga" text="Warga ditambahkan saat mencatat setoran pertama mereka." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => {
            const saldo = Number(r.balance);
            return (
              <details key={r.id} className="group rounded-2xl border bg-card open:border-sage">
                <summary className="flex cursor-pointer items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-persik text-lg font-bold text-persik-ink">
                      {r.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-tinta">{r.name}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        {r.phone ? (
                          <>
                            <Phone className="size-3.5" aria-hidden /> {r.phone}
                          </>
                        ) : (
                          "Tanpa nomor HP"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-right text-lg font-extrabold tabular-nums text-tinta">{rupiah(saldo)}</span>
                    <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                  </div>
                </summary>
                <div className="border-t p-4">
                  {saldo > 0 ? (
                    <ActionForm action={withdrawBalance.bind(null, r.id)} submitLabel="Cairkan saldo tunai" variant="secondary">
                      <Field label={`Jumlah dicairkan (maks. ${rupiah(saldo)})`} name="amount" type="number" max={saldo} defaultValue={saldo} />
                    </ActionForm>
                  ) : (
                    <Notice>Saldo Rp0, belum ada yang bisa dicairkan.</Notice>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
