import {
  BookOpenCheck,
  ClipboardList,
  Boxes,
  Building2,
  Coins,
  Factory,
  FileText,
  History,
  House,
  Lightbulb,
  Menu,
  CirclePlus,
  Settings,
  ShoppingBag,
  UserCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export type NavItem = { href: string; label: string; icon: LucideIcon; primary?: boolean };
export type NavGroup = { title?: string; items: NavItem[] };

// Sidebar desktop: semua menu, dikelompokkan
export const SIDEBAR: Record<Role, NavGroup[]> = {
  pengurus: [
    {
      items: [
        { href: "/beranda", label: "Beranda", icon: House },
        { href: "/setoran/baru", label: "Setor sampah", icon: CirclePlus },
      ],
    },
    {
      title: "Posko",
      items: [
        { href: "/setoran", label: "Riwayat setoran", icon: History },
        { href: "/warga", label: "Warga & saldo", icon: UsersRound },
        { href: "/stok", label: "Stok bahan", icon: Boxes },
      ],
    },
    {
      title: "Produksi",
      items: [
        { href: "/ide", label: "Dapur kreasi", icon: Lightbulb },
        { href: "/produksi", label: "Produksi", icon: Factory },
      ],
    },
    {
      title: "Penjualan",
      items: [
        { href: "/produk", label: "Produk & katalog", icon: ShoppingBag },
        { href: "/pesanan", label: "Pesanan online", icon: ClipboardList },
      ],
    },
    {
      title: "Keuangan",
      items: [
        { href: "/kas", label: "Buku kas", icon: BookOpenCheck },
        { href: "/laporan", label: "Laporan laba rugi", icon: FileText },
      ],
    },
    {
      title: "Kelompok",
      items: [
        { href: "/anggota", label: "Anggota", icon: UserCheck },
        { href: "/pengaturan", label: "Pengaturan posko", icon: Settings },
      ],
    },
  ],
  anggota: [
    {
      items: [
        { href: "/beranda", label: "Beranda", icon: House },
        { href: "/stok", label: "Stok bahan", icon: Boxes },
        { href: "/ide", label: "Dapur kreasi", icon: Lightbulb },
        { href: "/produksi", label: "Produksi", icon: Factory },
        { href: "/upah", label: "Upah saya", icon: Coins },
      ],
    },
  ],
  admin: [{ items: [{ href: "/admin", label: "Mitra PKK", icon: Building2 }] }],
};

// Navigasi bawah HP/tablet: maksimal 5 tombol, "Setor" ditonjolkan
export const BOTTOM: Record<Role, NavItem[]> = {
  pengurus: [
    { href: "/beranda", label: "Beranda", icon: House },
    { href: "/stok", label: "Stok", icon: Boxes },
    { href: "/setoran/baru", label: "Setor", icon: CirclePlus, primary: true },
    { href: "/ide", label: "Ide", icon: Lightbulb },
    { href: "/menu", label: "Lainnya", icon: Menu },
  ],
  anggota: [
    { href: "/beranda", label: "Beranda", icon: House },
    { href: "/stok", label: "Stok", icon: Boxes },
    { href: "/ide", label: "Ide", icon: Lightbulb },
    { href: "/produksi", label: "Produksi", icon: Factory },
    { href: "/upah", label: "Upah", icon: Coins },
  ],
  admin: [{ href: "/admin", label: "Mitra", icon: Building2 }],
};

// Menu yang paling spesifik menang (mis. /setoran/baru tidak ikut menyalakan /setoran)
export function activeHref(pathname: string, hrefs: string[]): string | undefined {
  return hrefs
    .filter((h) => pathname === h || pathname.startsWith(h + "/"))
    .sort((a, b) => b.length - a.length)[0];
}

export const ROLE_LABEL: Record<Role, string> = {
  pengurus: "Pengurus",
  anggota: "Anggota perajin",
  admin: "Admin platform",
};
