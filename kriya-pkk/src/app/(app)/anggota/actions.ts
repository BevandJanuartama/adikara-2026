"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMe } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";

export type MemberFormState = { error?: string; message?: string } | undefined;

const memberSchema = z.object({
  full_name: z.string().trim().min(2, "Nama minimal 2 huruf").max(80),
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  role: z.enum(["anggota", "pengurus"]),
});

// FR03: pengurus membuat akun anggota. Pakai secret key karena membuat user Auth untuk orang lain.
export async function addMember(_prev: MemberFormState, formData: FormData): Promise<MemberFormState> {
  const me = await requireMe(["pengurus"]); // WAJIB: cek hak akses sebelum memakai secret key
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { full_name, email, password, role } = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name },
  });
  if (error || !data.user) return { error: error?.message ?? "Gagal membuat akun" };

  // Trigger membuat profil tanpa kelompok → hubungkan ke kelompok pengurus ini
  const { error: upErr } = await admin
    .from("profiles").update({ group_id: me.group!.id, role }).eq("id", data.user.id);
  if (upErr) return { error: upErr.message };

  revalidatePath("/anggota");
  return { message: `Akun ${full_name} dibuat. Bagikan email & kata sandinya ke yang bersangkutan.` };
}

// Nonaktifkan / aktifkan anggota (RLS mencegah pengurus menonaktifkan dirinya sendiri)
export async function setMemberActive(memberId: string, active: boolean) {
  await requireMe(["pengurus"]);
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: active }).eq("id", memberId);
  if (error) throw new Error(friendlyError(error.message));
  revalidatePath("/anggota");
}
