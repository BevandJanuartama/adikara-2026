import Link from "next/link";
import { redirect } from "next/navigation";
import { Ban, Clock, LogOut, RefreshCw, Unlink, UserX } from "lucide-react";
import { getMe } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { AuthShell } from "@/components/brand";
import { btn } from "@/components/kriya-ui";

// FR02: kelompok yang belum aktif hanya bisa melihat halaman ini
export default async function StatusPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.role === "admin") redirect("/admin");
  if (me.role === "pembeli") redirect("/akun/pesanan");
  if (me.isActive && me.group?.status === "active") redirect("/beranda");

  let title = "Menunggu aktivasi";
  let text = "Pendaftaran kelompok sudah kami terima. Akun akan aktif setelah biaya aktivasi dikonfirmasi admin KriyaPKK.";
  let Icon = Clock;
  let tone = "bg-mentega text-mentega-ink";
  if (!me.group) {
    title = "Akun belum terhubung ke kelompok";
    text = "Minta pengurus PKK Anda untuk menambahkan akun ini sebagai anggota.";
    Icon = Unlink;
    tone = "bg-persik text-persik-ink";
  } else if (!me.isActive) {
    title = "Akun dinonaktifkan";
    text = "Hubungi pengurus kelompok Anda.";
    Icon = UserX;
    tone = "bg-bata-soft text-bata-ink";
  } else if (me.group.status === "inactive") {
    title = "Kelompok dinonaktifkan";
    text = "Hubungi admin KriyaPKK.";
    Icon = Ban;
    tone = "bg-bata-soft text-bata-ink";
  }

  return (
    <AuthShell eyebrow={me.group?.name ?? me.email} title={title}>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", tone)}>
            <Icon className="size-6" aria-hidden />
          </span>
          <p className="text-lg leading-relaxed text-tinta">{text}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/status" className={btn.primary}>
            <RefreshCw /> Muat ulang
          </Link>
          <form action={logout}>
            <button className={cn(btn.outline, "w-full")}>
              <LogOut /> Keluar
            </button>
          </form>
        </div>
      </div>
    </AuthShell>
  );
}
