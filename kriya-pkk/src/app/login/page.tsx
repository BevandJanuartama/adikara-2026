import { AuthShell } from "@/components/brand";
import { AuthSwitch, LoginForm } from "@/components/auth-forms";

// Satu halaman masuk untuk pembeli, pengurus, perajin, dan admin.
// ?next=/checkout?posko=… → setelah masuk kembali ke halaman itu.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = (await searchParams).next;
  const dariToko = !!next && /^\/(checkout|akun)/.test(next);
  return (
    <AuthShell
      eyebrow={dariToko ? "Toko KriyaPKK" : "ADIKARA 2026"}
      title={dariToko ? "Masuk untuk melanjutkan" : "Masuk ke KriyaPKK"}
      description={
        dariToko
          ? "Checkout dan status pesanan memerlukan akun pembeli. Keranjang Anda tetap tersimpan."
          : "Untuk pembeli, pengurus, dan perajin kelompok PKK."
      }
      footer={<AuthSwitch to={dariToko ? "daftar-pembeli" : "daftar"} next={next} />}
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
