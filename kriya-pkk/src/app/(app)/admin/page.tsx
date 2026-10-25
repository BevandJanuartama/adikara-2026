import { revalidatePath } from "next/cache";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tanggal } from "@/lib/format";

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
  id: string; name: string; address: string | null; status: string; created_at: string; pengurus_email: string | null;
  members: number; quota_scan: number; quota_idea: number; ai_calls_today: number; ai_calls_30d: number;
  tokens_in_30d: number; tokens_out_30d: number;
};

export default async function AdminPage() {
  await requireMe(["admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_groups");
  if (error) return <p className="text-red-700">{error.message}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mitra PKK</h1>
      <ul className="space-y-3">
        {(data as Row[]).map((g) => (
          <li key={g.id} className="space-y-2 rounded-xl border p-4">
            <div className="flex justify-between">
              <p className="text-lg font-semibold">{g.name}</p>
              <span className="text-base">{g.status}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {g.pengurus_email} · daftar {tanggal(g.created_at)} · {g.members} akun
            </p>
            <p className="text-sm">
              AI hari ini: {g.ai_calls_today} · 30 hari: {g.ai_calls_30d} panggilan, {g.tokens_in_30d + g.tokens_out_30d} token ·
              kuota {g.quota_scan} scan/{g.quota_idea} ide per hari
            </p>
            <form action={setStatus.bind(null, g.id, g.status === "active" ? "inactive" : "active")}>
              <button className="rounded-lg border px-3 py-2 text-base">
                {g.status === "active" ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
