import { LogOut } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/brand";

// Semua halaman di dalam folder (app) otomatis wajib login & kelompok aktif.
// HP/tablet: header atas + navigasi bawah. Desktop (≥1024px): sidebar kiri.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireMe();
  const groupName = me.group?.name ?? "Admin platform";
  const userName = me.fullName || me.email || "Pengguna";

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <AppSidebar role={me.role} groupName={groupName} userName={userName} logoutAction={logout} />

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Logo compact />
              <div className="min-w-0">
                <p className="truncate text-base font-bold leading-tight text-tinta">{groupName}</p>
                <p className="truncate text-sm text-muted-foreground">{userName}</p>
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                aria-label="Keluar"
                className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-3 text-sm font-semibold text-tinta transition-colors hover:bg-bata-soft hover:text-bata-ink"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-32 pt-6 sm:px-6 lg:max-w-6xl lg:px-10 lg:pb-14 lg:pt-10">
          {children}
        </main>
      </div>

      <BottomNav role={me.role} />
    </div>
  );
}
