"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BOTTOM, activeHref } from "@/components/nav-items";

// Navigasi bawah untuk HP & tablet (disembunyikan di layar ≥ 1024px)
export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = BOTTOM[role] ?? BOTTOM.anggota;
  // Admin hanya punya satu halaman: tidak perlu navigasi bawah
  if (items.length < 2) return null;
  let active = activeHref(pathname, items.map((i) => i.href));
  // Halaman di luar 5 tombol (kas, laporan, dll.) menyalakan "Lainnya"
  if (!active && role === "pengurus") active = "/menu";

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul
        className="mx-auto grid max-w-2xl px-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const on = item.href === active;
          const Icon = item.icon;
          if (item.primary) {
            return (
              <li key={item.href} className="flex justify-center">
                <Link
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  className="-mt-5 flex flex-col items-center gap-1 rounded-2xl pb-2"
                >
                  <span
                    className={cn(
                      "grid size-14 place-items-center rounded-full text-white shadow-lg shadow-hutan/30 ring-4 ring-background transition-colors",
                      on ? "bg-tinta" : "bg-hutan",
                    )}
                  >
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-tinta">{item.label}</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl pb-2 pt-2 text-sm",
                  on ? "font-bold text-tinta" : "font-medium text-muted-foreground",
                )}
              >
                <span className={cn("grid h-8 w-12 place-items-center rounded-full transition-colors", on && "bg-pucuk")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
