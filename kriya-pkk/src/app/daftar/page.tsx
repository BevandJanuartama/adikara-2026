import { RegisterForm } from "@/components/auth-forms";

export default function DaftarPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-3xl font-bold">Daftar Kelompok PKK</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Akun akan aktif setelah biaya aktivasi dikonfirmasi admin.
      </p>
      <RegisterForm />
    </main>
  );
}
