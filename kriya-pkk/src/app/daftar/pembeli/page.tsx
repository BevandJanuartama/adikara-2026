import type { Metadata } from "next";
import { AuthShell } from "@/components/brand";
import { AuthSwitch, BuyerRegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Daftar pembeli · KriyaPKK" };

export default async function DaftarPembeliPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = (await searchParams).next;
  return (
    <AuthShell
      eyebrow="Toko KriyaPKK"
      title="Buat akun pembeli"
      description="Untuk checkout dan memantau status pesanan produk daur ulang dari posko PKK."
      footer={<AuthSwitch to="login" next={next} />}
    >
      <BuyerRegisterForm next={next} />
    </AuthShell>
  );
}
