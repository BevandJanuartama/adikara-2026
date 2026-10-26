import { AuthShell } from "@/components/brand";
import { AuthSwitch, LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="ADIKARA 2026"
      title="Masuk ke KriyaPKK"
      description="Untuk pengurus dan perajin kelompok PKK."
      footer={<AuthSwitch to="daftar" />}
    >
      <LoginForm />
    </AuthShell>
  );
}
