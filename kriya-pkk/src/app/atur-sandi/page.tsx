import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/brand";
import { NewPasswordForm } from "@/components/auth-forms";
import { btn } from "@/components/kriya-ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kata sandi baru · KriyaPKK" };

// Dibuka dari tautan email (lewat /auth/confirm yang sudah membuat sesi)
export default async function AturSandiPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <AuthShell eyebrow="KriyaPKK" title="Tautan kedaluwarsa" description="Tautan atur ulang kata sandi hanya berlaku sebentar dan sekali pakai.">
        <Link href="/lupa-sandi" className={`${btn.primary} w-full`}>
          Minta tautan baru
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="KriyaPKK" title="Buat kata sandi baru" description={`Untuk akun ${data.user.email}.`}>
      <NewPasswordForm />
    </AuthShell>
  );
}
