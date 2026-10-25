import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

// FR02: kelompok yang belum aktif hanya bisa melihat halaman ini
export default async function StatusPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.role === "admin") redirect("/admin");
  if (me.isActive && me.group?.status === "active") redirect("/beranda");

  let title = "Menunggu aktivasi";
  let text = "Pendaftaran kelompok sudah kami terima. Akun akan aktif setelah biaya aktivasi dikonfirmasi admin KriyaPKK.";
  if (!me.group) {
    title = "Akun belum terhubung ke kelompok";
    text = "Minta pengurus PKK Anda untuk menambahkan akun ini sebagai anggota.";
  } else if (!me.isActive) {
    title = "Akun dinonaktifkan";
    text = "Hubungi pengurus kelompok Anda.";
  } else if (me.group.status === "inactive") {
    title = "Kelompok dinonaktifkan";
    text = "Hubungi admin KriyaPKK.";
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <p className="text-base text-muted-foreground">{me.group?.name ?? me.email}</p>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-lg">{text}</p>
      <div className="flex gap-3">
        <Link href="/status" className="rounded-lg border px-4 py-3 text-base">Muat ulang</Link>
        <form action={logout}>
          <button className="rounded-lg border px-4 py-3 text-base">Keluar</button>
        </form>
      </div>
    </main>
  );
}
