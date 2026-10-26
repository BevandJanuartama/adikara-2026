import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { withdrawBalance } from "@/lib/actions/ops";
import {
  UsersRound,
  Wallet,
  Phone,
  Banknote,
  UserCheck,
  ChevronDown,
  Coins,
} from "lucide-react";

// FR14 data warga, FR13 pencairan saldo
export default async function WargaPage() {
  await requireMe(["pengurus"]);
  const supabase = await createClient();
  const { data: residents } = await supabase
    .from("residents")
    .select("id, name, phone, balance")
    .order("name");

  const totalBalance = (residents ?? []).reduce(
    (s, r) => s + Number(r.balance),
    0,
  );

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      {/* Header & Total Saldo Warga */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Data Warga & Saldo
          </h1>
          <p className="text-xs text-muted-foreground">
            Kelola penyetor dan pencairan tabungan sampah
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 shadow-2xs">
          <UsersRound className="h-6 w-6" />
        </div>
      </div>

      {/* Kartu Ringkasan Total Saldo */}
      <div className="rounded-2xl border bg-gradient-to-br from-emerald-700 to-teal-800 p-5 text-white shadow-md flex items-center justify-between">
        <div>
          <p className="text-xs text-emerald-100 font-medium">
            Total Saldo Warga Keseluruhan
          </p>
          <p className="text-2xl font-bold tracking-tight">
            {rupiah(totalBalance)}
          </p>
        </div>
        <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md shadow-2xs">
          <Coins className="h-6 w-6 text-emerald-200" />
        </div>
      </div>

      {/* Catatan Warga Baru */}
      <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground flex items-center gap-2">
        <span className="font-semibold text-foreground">💡 Info:</span>
        <span>Warga baru dapat ditambahkan langsung melalui menu Setoran.</span>
      </div>

      {/* Daftar Warga */}
      {!residents || residents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center space-y-3 shadow-2xs">
          <div className="rounded-full bg-muted p-3 text-muted-foreground">
            <UserCheck className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Belum ada data warga terdaftar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {residents.map((r) => {
            const balanceNum = Number(r.balance);
            return (
              <details
                key={r.id}
                className="group rounded-2xl border bg-card p-4 shadow-2xs transition-all hover:border-emerald-500"
              >
                <summary className="flex cursor-pointer items-center justify-between list-none">
                  <div className="space-y-0.5">
                    <p className="text-base font-bold text-foreground group-hover:text-emerald-700 transition-colors">
                      {r.name}
                    </p>
                    {r.phone ? (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {r.phone}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/60">
                        Tidak ada nomor HP
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Saldo</p>
                      <p className="text-base font-extrabold text-emerald-700">
                        {rupiah(balanceNum)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted p-1 text-muted-foreground group-open:rotate-180 transition-transform">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </summary>

                <div className="mt-4 border-t pt-4 space-y-3">
                  {balanceNum > 0 ? (
                    <ActionForm
                      action={withdrawBalance.bind(null, r.id)}
                      submitLabel="Cairkan Saldo Tunai"
                      variant="secondary"
                      className="space-y-3 rounded-xl border bg-muted/20 p-4"
                    >
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-emerald-700" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Form Pencairan Saldo
                        </h3>
                      </div>
                      <Field
                        label={`Jumlah Pencairan (Maks ${rupiah(balanceNum)})`}
                        name="amount"
                        type="number"
                        max={balanceNum}
                        defaultValue={balanceNum}
                      />
                    </ActionForm>
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-2">
                      Saldo warga saat ini Rp0 (tidak ada saldo untuk
                      dicairkan).
                    </p>
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
