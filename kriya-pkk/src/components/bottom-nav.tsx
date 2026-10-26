"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";
import {
  Home,
  PlusCircle,
  Boxes,
  Lightbulb,
  Menu,
  Factory,
  Coins,
  Building2,
} from "lucide-react";

// Pemetaan ikon untuk setiap rute navigasi
const ICONS: Record<string, any> = {
  "/beranda": Home,
  "/setoran/baru": PlusCircle,
  "/stok": Boxes,
  "/ide": Lightbulb,
  "/menu": Menu,
  "/produksi": Factory,
  "/upah": Coins,
  "/admin": Building2,
};

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
  const navItems = NAV[role] || NAV.anggota;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md shadow-lg">
      <ul className="mx-auto flex max-w-xl items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const IconComponent = ICONS[item.href] || Home;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`group flex flex-col items-center justify-center py-1.5 transition-all ${
                  active
                    ? "text-emerald-700 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div
                  className={`relative rounded-xl p-1.5 transition-colors ${active ? "bg-emerald-50 text-emerald-700" : "group-hover:bg-muted"}`}
                >
                  <IconComponent
                    className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`}
                  />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
