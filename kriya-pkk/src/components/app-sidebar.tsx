"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand";
import { ROLE_LABEL, SIDEBAR, activeHref } from "@/components/nav-items";

// Sidebar kiri, hanya tampil di layar ≥ 1024px (lg)
export function AppSidebar({
  role,
  groupName,
  userName,
  logoutAction,
}: {
  role: Role;
  groupName: string;
  userName: string;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const groups = SIDEBAR[role] ?? SIDEBAR.anggota;
  const active = activeHref(pathname, groups.flatMap((g) => g.items.map((i) => i.href)));

  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-sidebar lg:flex">
      <div className="px-5 pb-4 pt-5">
        <Link href={role === "admin" ? "/admin" : "/beranda"} className="inline-flex rounded-lg">
          <Logo />
        </Link>
      </div>

      <div className="jahitan mx-4 rounded-xl bg-mentega px-4 py-2.5">
        <p className="text-sm text-mentega-ink">{role === "admin" ? "Panel" : "Kelompok"}</p>
        <p className="line-clamp-2 font-bold leading-snug text-tinta">{groupName}</p>
      </div>

      <nav aria-label="Navigasi utama" className="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((g, gi) => (
          <div key={g.title ?? gi} className={gi > 0 ? "mt-4" : ""}>
            {g.title && <p className="px-3 pb-1.5 text-sm font-semibold text-muted-foreground">{g.title}</p>}
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const on = item.href === active;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={on ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-base transition-colors",
                        on ? "bg-pucuk font-semibold text-tinta" : "font-medium text-tinta/80 hover:bg-card hover:text-tinta",
                      )}
                    >
                      <Icon className="size-5 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t px-4 py-3">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-persik font-bold text-persik-ink">
            {userName.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-tinta">{userName}</p>
            <p className="text-sm text-muted-foreground">{ROLE_LABEL[role]}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Keluar"
              aria-label="Keluar"
              className="grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-bata-soft hover:text-bata-ink"
            >
              <LogOut className="size-5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
