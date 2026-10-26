import { AuthShell } from "@/components/brand";
import { AuthSwitch, RegisterForm } from "@/components/auth-forms";

export default function DaftarPage() {
  return (
    <AuthShell
      eyebrow="Pendaftaran mitra"
      title="Daftarkan kelompok PKK"
      description="Akun aktif setelah biaya aktivasi diverifikasi oleh admin KriyaPKK."
      footer={<AuthSwitch to="login" />}
    >
      <RegisterForm />
    </AuthShell>
  );
}
