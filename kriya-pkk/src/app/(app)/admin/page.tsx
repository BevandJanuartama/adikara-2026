import { revalidatePath } from "next/cache";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tanggal, angka } from "@/lib/format";
import {
  Building2,
  ShieldCheck,
  UserCheck,
  UserX,
  Sparkles,
  Cpu,
  Layers,
  Calendar,
  Mail,
  CheckCircle2,
  AlertCircle,
  Activity,
} from "lucide-react";

// FR02 (aktivasi), FR36 (kelola mitra), FR37 (pantau penggunaan AI)
async function setStatus(groupId: string, status: "active" | "inactive") {
  "use server";
  await requireMe(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_group_status", {
    p_group_id: groupId,
    p_status: status,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

type Row = {
  id: string;
  name: string;
  address: string | null;
  status: string;
  created_at: string;
  pengurus_email: string | null;
  members: number;
  quota_scan: number;
  quota_idea: number;
  ai_calls_today: number;
  ai_calls_30d: number;
  tokens_in_30d: number;
  tokens_out_30d: number;
};

export default async function AdminPage() {
  await requireMe(["admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_groups");

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
        <span>Gagal memuat data mitra: {error.message}</span>
      </div>
    );
  }

  const rows = (data as Row[]) || [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      {/* Header & Judul */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Kelola Mitra PKK
          </h1>
          <p className="text-xs text-muted-foreground">
            Panel administrator platform dan pemantauan kuota AI
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 shadow-2xs">
          <Building2 className="h-6 w-6" />
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground">
            Total Mitra
          </p>
          <p className="text-xl font-extrabold text-foreground">
            {rows.length}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground">
            Mitra Aktif
          </p>
          <p className="text-xl font-extrabold text-emerald-700">
            {rows.filter((r) => r.status === "active").length}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-2xl border bg-card p-4 shadow-2xs space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground">
            Total Panggilan AI (30 Hari)
          </p>
          <p className="text-xl font-extrabold text-blue-700">
            {angka(rows.reduce((s, r) => s + r.ai_calls_30d, 0))}
          </p>
        </div>
      </div>

      {/* Daftar Mitra */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
          Daftar Mitra Terdaftar
        </h2>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center space-y-3 shadow-2xs">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Belum ada mitra PKK yang terdaftar dalam sistem.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4">
            {rows.map((g) => {
              const isActive = g.status === "active";
              const totalTokens =
                (g.tokens_in_30d || 0) + (g.tokens_out_30d || 0);

              return (
                <li
                  key={g.id}
                  className="rounded-2xl border bg-card p-5 shadow-2xs space-y-4 transition-all hover:border-emerald-500"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-foreground">
                          {g.name}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${isActive ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-red-100 text-red-800 border-red-200"}`}
                        >
                          {isActive ? (
                            <UserCheck className="h-3 w-3" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                          <span className="capitalize">{g.status}</span>
                        </span>
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />{" "}
                        {g.pengurus_email || "Email tidak tersedia"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                        <Layers className="h-3.5 w-3.5 text-emerald-700" />
                        <span>{g.members} akun</span>
                      </span>
                    </div>
                  </div>

                  {/* Metrik AI & Penggunaan */}
                  <div className="rounded-xl border bg-muted/30 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground border-b pb-2">
                      <Activity className="h-4 w-4 text-emerald-700" />
                      <span>Pantauan Kuota & Penggunaan AI</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">
                          Panggilan AI:
                        </span>
                        <p className="font-semibold text-foreground">
                          Hari ini:{" "}
                          <strong className="text-emerald-700">
                            {g.ai_calls_today}x
                          </strong>{" "}
                          · 30 hari: <strong>{angka(g.ai_calls_30d)}x</strong>
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">
                          Total Token (30 Hari):
                        </span>
                        <p className="font-semibold text-foreground">
                          {angka(totalTokens)} token
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>
                        Kuota Harian: <strong>{g.quota_scan} scan</strong> /{" "}
                        <strong>{g.quota_idea} ide</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Terdaftar:{" "}
                        {tanggal(g.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Tombol Aksi Status */}
                  <div className="flex items-center justify-end pt-1">
                    <form
                      action={setStatus.bind(
                        null,
                        g.id,
                        isActive ? "inactive" : "active",
                      )}
                    >
                      <button
                        type="submit"
                        className={`inline-flex h-9 items-center justify-center rounded-xl px-4 text-xs font-bold shadow-2xs transition-colors ${
                          isActive
                            ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {isActive ? "Nonaktifkan Mitra" : "Aktifkan Mitra"}
                      </button>
                    </form>
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
