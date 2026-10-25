import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setMemberActive } from "./actions";
import { AddMemberForm } from "./add-member-form";

export default async function AnggotaPage() {
  const me = await requireMe(["pengurus"]);
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("profiles").select("id, full_name, role, is_active").eq("group_id", me.group!.id).order("full_name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Anggota</h1>
      <ul className="divide-y rounded-xl border">
        {(members ?? []).map((m) => (
          <li key={m.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-lg font-semibold">{m.full_name}{m.id === me.id && " (Anda)"}</p>
              <p className="text-sm text-muted-foreground">{m.role}{!m.is_active && " · nonaktif"}</p>
            </div>
            {m.id !== me.id && (
              <form action={setMemberActive.bind(null, m.id, !m.is_active)}>
                <button className="rounded-lg border px-3 py-2 text-base">{m.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <AddMemberForm />
    </div>
  );
}
