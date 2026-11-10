import { BadgeCheck, UserCheck, UserX, UsersRound } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { Badge, EmptyState, PageHeader, btn } from "@/components/kriya-ui";
import { ActionForm, Field } from "@/components/action-form";
import { resetMemberPassword, setMemberActive } from "./actions";
import { AddMemberForm } from "./add-member-form";

export default async function AnggotaPage() {
  const me = await requireMe(["pengurus"]);
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("group_id", me.group!.id)
    .order("full_name");
  const list = members ?? [];

  return (
    <div className="space-y-8">
      <PageHeader title="Anggota" description="Akun pengurus dan perajin di kelompok ini." icon={UsersRound} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <section>
          <h2 className="mb-3 text-lg font-bold text-tinta">Daftar akun ({list.length})</h2>
          {list.length === 0 ? (
            <EmptyState icon={UsersRound} title="Belum ada anggota" />
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {list.map((m) => {
                const isMe = m.id === me.id;
                return (
                  <li key={m.id} className={cn("flex flex-col gap-3 rounded-2xl border bg-card p-4", !m.is_active && "bg-muted/60")}>
                    <div className="flex items-center gap-3">
                      <span aria-hidden className={cn("grid size-11 shrink-0 place-items-center rounded-full text-lg font-bold", m.role === "pengurus" ? "bg-mentega text-mentega-ink" : "bg-pucuk text-pucuk-ink")}>
                        {m.full_name.trim().charAt(0).toUpperCase() || "?"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-tinta">
                          {m.full_name} {isMe && <span className="font-medium text-muted-foreground">(Anda)</span>}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge tone={m.role === "pengurus" ? "mentega" : "pucuk"} icon={BadgeCheck}>{m.role === "pengurus" ? "Pengurus" : "Perajin"}</Badge>
                          {!m.is_active && <Badge tone="bata" icon={UserX}>Nonaktif</Badge>}
                        </div>
                      </div>
                    </div>
                    {!isMe && m.is_active && (
                      <details className="rounded-xl border">
                        <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-hutan">Atur ulang kata sandi</summary>
                        <div className="border-t p-3">
                          <ActionForm action={resetMemberPassword.bind(null, m.id)} submitLabel="Simpan kata sandi baru" className="space-y-3">
                            <Field label="Kata sandi baru" name="password" type="text" placeholder="Minimal 8 karakter" />
                          </ActionForm>
                        </div>
                      </details>
                    )}
                    {!isMe && (
                      <form action={setMemberActive.bind(null, m.id, !m.is_active)} className="mt-auto">
                        <button className={cn(m.is_active ? btn.danger : btn.outline, btn.small, "w-full")}>
                          {m.is_active ? <UserX /> : <UserCheck />} {m.is_active ? "Nonaktifkan" : "Aktifkan lagi"}
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="xl:sticky xl:top-10">
          <AddMemberForm />
        </div>
      </div>
    </div>
  );
}
