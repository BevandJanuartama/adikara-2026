import type { Metadata } from "next";
import { AuthShell } from "@/components/brand";
import { AuthSwitch, ForgotPasswordForm } from "@/components/auth-forms";
import { Notice } from "@/components/kriya-ui";

export const metadata: Metadata = { title: "Lupa kata sandi · KriyaPKK" };

export default async function LupaSandiPage({ searchParams }: { searchParams: Promise<{ galat?: string }> }) {
  const galat = (await searchParams).galat;
  return (
    <AuthShell
      eyebrow="KriyaPKK"
      title="Lupa kata sandi"
      description="Masukkan email akun Anda. Kami kirim tautan untuk membuat kata sandi baru."
      footer={<AuthSwitch to="login" />}
    >
      <div className="space-y-5">
        {galat === "tautan" && <Notice tone="error">Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru di bawah.</Notice>}
        <ForgotPasswordForm />
        <p className="text-sm text-muted-foreground">
          Perajin yang tidak menerima email bisa meminta pengurus posko mengatur ulang kata sandinya di menu Anggota.
        </p>
      </div>
    </AuthShell>
  );
}
