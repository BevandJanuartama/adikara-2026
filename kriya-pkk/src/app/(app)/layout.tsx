import { requireMe } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { BottomNav } from "@/components/bottom-nav";
import { LogOut, ShieldCheck, Sparkles, User } from "lucide-react";

// Semua halaman di dalam folder (app) otomatis wajib login & kelompok aktif
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await requireMe();

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col bg-background text-foreground selection:bg-emerald-500 selection:text-white">
      {/* Header Utama / Topbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 backdrop-blur-md px-4 py-3.5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight">
                KriyaPKK
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Adikara 2026
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {me.group?.name ?? "Admin Platform"} ·{" "}
              <strong className="text-foreground">
                {me.fullName || me.email}
              </strong>
            </p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            aria-label="Keluar"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-input bg-card hover:bg-muted px-3 text-xs font-bold text-muted-foreground hover:text-foreground shadow-2xs transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 text-red-600" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </form>
      </header>

      {/* Konten Utama */}
      <main className="flex-1 px-4 py-5 pb-28">{children}</main>

      {/* Navigasi Bawah / Bottom Navigation */}
      <BottomNav role={me.role} />
    </div>
  );
}
