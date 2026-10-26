import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";
import {
  Coins,
  Wallet,
  Clock,
  Calendar,
  Factory,
  CheckCircle2,
  PackageCheck,
} from "lucide-react";

// FR26: anggota melihat upahnya sendiri (RLS hanya mengembalikan baris miliknya)
export default async function UpahPage() {
  const me = await requireMe(["anggota", "pengurus"]);
  const supabase = await createClient();
  const { data: wages } = await supabase
    .from("wages")
    .select(
      "id, amount, hours, created_at, batch:production_batches(ide:ideas(title))",
    )
    .eq("member_id", me.id)
    .order("created_at", { ascending: false });

  const total = (wages ?? []).reduce((s, w) => s + Number(w.amount), 0);
  const wagesList = wages ?? [];

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      {/* Header & Judul */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upah Saya</h1>
          <p className="text-xs text-muted-foreground">
            Rekapitulasi pendapatan hasil produksi kerajinan
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 shadow-2xs">
          <Coins className="h-6 w-6" />
        </div>
      </div>

      {/* Kartu Ringkasan Total Pendapatan */}
      <div className="rounded-2xl border bg-gradient-to-br from-emerald-700 to-teal-800 p-5 text-white shadow-md flex items-center justify-between">
        <div>
          <p className="text-xs text-emerald-100 font-medium">
            Total Pendapatan Upah
          </p>
          <p className="text-2xl font-bold tracking-tight">{rupiah(total)}</p>
        </div>
        <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md shadow-2xs">
          <Wallet className="h-6 w-6 text-emerald-200" />
        </div>
      </div>

      {/* Daftar Riwayat Upah */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
          Riwayat Penerimaan Upah
        </h2>

        {wagesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center space-y-3 shadow-2xs">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <Coins className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Belum ada riwayat penerimaan upah.
              <br />
              Selesaikan tugas produksi kerajinan untuk mendapatkan upah.
            </p>
          </div>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card shadow-2xs overflow-hidden">
            {wagesList.map((w) => {
              const ideaTitle =
                (w.batch as unknown as { ide?: { title: string } } | null)?.ide
                  ?.title ?? "Produksi Kerajinan";

              return (
                <li
                  key={w.id}
                  className="flex items-center justify-between p-4 text-xs sm:text-sm transition-colors hover:bg-muted/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 shrink-0">
                        <Factory className="h-4 w-4" />
                      </span>
                      <p className="font-bold text-foreground">{ideaTitle}</p>
                    </div>

                    <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground pl-7">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {tanggal(w.created_at)}
                      </span>
                      {w.hours && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {w.hours} jam kerja
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-emerald-700">
                      +{rupiah(w.amount)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
