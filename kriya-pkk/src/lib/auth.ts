import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Me, Role } from "@/lib/types";

// Profil user yang sedang login (di-cache per request)
export const getMe = cache(async (): Promise<Me | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: p } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, kelompok:groups(id, name, status, wage_per_hour, default_margin)")
    .eq("id", claims.sub)
    .maybeSingle();
  if (!p) return null;

  return {
    id: p.id,
    email: typeof claims.email === "string" ? claims.email : null,
    fullName: p.full_name,
    role: p.role as Role,
    isActive: p.is_active,
    group: (p.kelompok as unknown as Me["group"]) ?? null,
  };
});

// Penjaga halaman: wajib login, kelompok aktif, dan (opsional) peran tertentu (FR04, NFR08)
export async function requireMe(roles?: Role[]): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.isActive) redirect("/status");
  if (me.role !== "admin" && me.group?.status !== "active") redirect("/status");
  if (roles && !roles.includes(me.role)) redirect(me.role === "admin" ? "/admin" : "/beranda");
  return me;
}
