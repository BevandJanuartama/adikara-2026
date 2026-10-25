import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/auth";

export default async function Home() {
  const me = await getMe();
  if (me) redirect(me.role === "admin" ? "/admin" : "/beranda");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-4xl font-bold">KriyaPKK</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Kasir setoran sampah anorganik, stok, dan penasihat produksi kerajinan berbasis AI untuk kelompok PKK.
        </p>
      </div>
      <Link href="/login" className="rounded-xl bg-primary px-4 py-4 text-center text-lg font-semibold text-primary-foreground">
        Masuk
      </Link>
      <Link href="/daftar" className="rounded-xl border px-4 py-4 text-center text-lg font-semibold">
        Daftar kelompok baru
      </Link>
    </main>
  );
}
