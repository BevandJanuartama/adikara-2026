import { revalidatePath } from "next/cache";
import { Activity, Building2, Calendar, CircleCheck, Clock, Cpu, Mail, UserCheck, UserX, Users } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tanggal, angka } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge, EmptyState, Notice, PageHeader, StatPatch, btn } from "@/components/kriya-ui";

// FR02 (aktivasi), FR36 (kelola mitra), FR37 (pantau penggunaan AI)
async function setStatus(groupId: string, status: "active" | "inactive") {
  "use server";
  await requireMe(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_group_status", { p_group_id: groupId, p_status: status });
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

const STATUS = {
  active: { label: "Aktif", tone: "pucuk" as const, icon: CircleCheck },
  pending: { label: "Menunggu aktivasi", tone: "mentega" as const, icon: Clock },
  inactive: { label: "Nonaktif", tone: "bata" as const, icon: UserX },
};

export default async function AdminPage() {
  await requireMe(["admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_groups");
  if (error) return <Notice tone="error">Gagal memuat data mitra: {error.message}</Notice>;

  const rows = (data as Row[]) ?? [];
  const pending = rows.filter((r) => r.status === "pending");
  // Yang menunggu aktivasi tampil paling atas
  const sorted = [...pending, ...rows.filter((r) => r.status !== "pending")];

  return (
    <div className="space-y-8">
      <PageHeader title="Mitra PKK" description="Aktivasi kelompok baru dan pantau pemakaian AI tiap kelompok." icon={Building2} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatPatch tone="pucuk" label="Total mitra" value={angka(rows.length)} icon={Building2} />
        <StatPatch tone="mentega" label="Menunggu aktivasi" value={angka(pending.length)} icon={Clock} />
        <StatPatch tone="sage" label="Mitra aktif" value={angka(rows.filter((r) => r.status === "active").length)} icon={CircleCheck} />
        <StatPatch tone="persik" label="Panggilan AI 30 hari" value={angka(rows.reduce((s, r) => s + r.ai_calls_30d, 0))} icon={Cpu} />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Building2} title="Belum ada mitra" text="Kelompok yang mendaftar akan muncul di sini." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sorted.map((g) => {
            const meta = STATUS[g.status as keyof typeof STATUS] ?? STATUS.inactive;
            const isActive = g.status === "active";
            return (
              <li key={g.id} className={cn("flex flex-col rounded-2xl border bg-card p-5", g.status === "pending" && "border-mentega-ink/40")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-tinta">{g.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 break-all text-sm text-muted-foreground">
                      <Mail className="size-4 shrink-0" aria-hidden /> {g.pengurus_email || "Email tidak tersedia"}
                    </p>
                  </div>
                  <Badge tone={meta.tone} icon={meta.icon}>{meta.label}</Badge>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-daun-muda/60 p-4 text-base sm:grid-cols-3">
                  <div>
                    <dt className="flex items-center gap-1 text-sm text-muted-foreground"><Activity className="size-3.5" aria-hidden /> AI hari ini</dt>
                    <dd className="font-bold tabular-nums text-tinta">{g.ai_calls_today}×</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">AI 30 hari</dt>
                    <dd className="font-bold tabular-nums text-tinta">{angka(g.ai_calls_30d)}×</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Token 30 hari</dt>
                    <dd className="font-bold tabular-nums text-tinta">{angka((g.tokens_in_30d || 0) + (g.tokens_out_30d || 0))}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-sm text-muted-foreground"><Users className="size-3.5" aria-hidden /> Akun</dt>
                    <dd className="font-bold tabular-nums text-tinta">{g.members}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-sm text-muted-foreground">Kuota harian</dt>
                    <dd className="font-bold text-tinta">{g.quota_scan} scan, {g.quota_idea} ide</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="size-4" aria-hidden /> Daftar {tanggal(g.created_at)}
                  </span>
                  <form action={setStatus.bind(null, g.id, isActive ? "inactive" : "active")}>
                    <button type="submit" className={cn(isActive ? btn.danger : btn.primary, btn.small)}>
                      {isActive ? <UserX /> : <UserCheck />} {isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
