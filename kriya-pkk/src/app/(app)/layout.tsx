import { requireMe } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { BottomNav } from "@/components/bottom-nav";

// Semua halaman di dalam folder (app) otomatis wajib login & kelompok aktif
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireMe();
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
        <div>
          <p className="text-lg font-bold">KriyaPKK</p>
          <p className="text-sm text-muted-foreground">
            {me.group?.name ?? "Admin platform"} · {me.fullName || me.email}
          </p>
        </div>
        <form action={logout}>
          <button className="rounded-lg border px-3 py-2 text-base">Keluar</button>
        </form>
      </header>
      <main className="flex-1 px-4 py-4 pb-28">{children}</main>
      <BottomNav role={me.role} />
    </div>
  );
}
