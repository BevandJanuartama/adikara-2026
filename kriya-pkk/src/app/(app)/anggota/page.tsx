import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setMemberActive } from "./actions";
import { AddMemberForm } from "./add-member-form";
import {
  UsersRound,
  ShieldCheck,
  UserCheck,
  UserX,
  UserPlus,
  Mail,
  Lock,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  BadgeCheck,
} from "lucide-react";

export default async function AnggotaPage() {
  const me = await requireMe(["pengurus"]);
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("group_id", me.group!.id)
    .order("full_name");

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      {/* Header & Judul */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Anggota
          </h1>
          <p className="text-xs text-muted-foreground">
            Kelola akun pengurus dan perajin kelompok PKK
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 shadow-2xs">
          <UsersRound className="h-6 w-6" />
        </div>
      </div>

      {/* Daftar Anggota */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
          Daftar Anggota Tim ({members?.length ?? 0})
        </h2>

        {!members || members.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center space-y-3 shadow-2xs">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <UsersRound className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Belum ada anggota terdaftar di kelompok ini.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3">
            {members.map((m) => {
              const isMe = m.id === me.id;
              const isPengurus = m.role === "pengurus";

              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-2xs transition-all hover:border-emerald-500"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-foreground">
                        {m.full_name}{" "}
                        {isMe && (
                          <span className="text-xs font-semibold text-emerald-700">
                            (Anda)
                          </span>
                        )}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${isPengurus ? "bg-purple-50 text-purple-800 border-purple-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}
                      >
                        <BadgeCheck className="h-3 w-3" />
                        <span className="capitalize">{m.role}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${m.is_active ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                      >
                        {m.is_active ? (
                          <UserCheck className="h-3 w-3" />
                        ) : (
                          <UserX className="h-3 w-3" />
                        )}
                        <span>{m.is_active ? "Aktif" : "Nonaktif"}</span>
                      </span>
                    </div>
                  </div>

                  {!isMe && (
                    <form
                      action={setMemberActive.bind(null, m.id, !m.is_active)}
                    >
                      <button
                        className={`h-9 px-3.5 rounded-xl border text-xs font-bold transition-colors ${m.is_active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
                      >
                        {m.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Formulir Tambah Anggota */}
      <div className="pt-2">
        <AddMemberForm />
      </div>
    </div>
  );
}
