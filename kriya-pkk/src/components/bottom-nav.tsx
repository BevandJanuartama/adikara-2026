"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

const NAV: Record<Role, { href: string; label: string }[]> = {
  pengurus: [
    { href: "/beranda", label: "Beranda" },
    { href: "/setoran/baru", label: "Setor" },
    { href: "/stok", label: "Stok" },
    { href: "/ide", label: "Ide" },
    { href: "/menu", label: "Lainnya" },
  ],
  anggota: [
    { href: "/beranda", label: "Beranda" },
    { href: "/stok", label: "Stok" },
    { href: "/ide", label: "Ide" },
    { href: "/produksi", label: "Produksi" },
    { href: "/upah", label: "Upah" },
  ],
  admin: [{ href: "/admin", label: "Mitra" }],
};

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background">
      <ul className="mx-auto flex max-w-2xl">
        {NAV[role].map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`block py-4 text-center text-base ${active ? "font-bold text-primary" : "text-muted-foreground"}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
