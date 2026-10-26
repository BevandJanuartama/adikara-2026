import Link from "next/link";
import { requireMe } from "@/lib/auth";
import {
  History,
  UsersRound,
  Factory,
  ShoppingBag,
  BookOpenCheck,
  FileText,
  UserCheck,
  Settings,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";

const LINKS = [
  {
    href: "/setoran",
    label: "Riwayat Setoran",
    desc: "Daftar setoran sampah anorganik warga",
    icon: History,
    color: "text-emerald-700 bg-emerald-50 border-emerald-100",
  },
  {
    href: "/warga",
    label: "Data Warga & Saldo",
    desc: "Kelola saldo dan informasi penyetor",
    icon: UsersRound,
    color: "text-blue-700 bg-blue-50 border-blue-100",
  },
  {
    href: "/produksi",
    label: "Produksi",
    desc: "Pantau batch dan progres kerajinan",
    icon: Factory,
    color: "text-amber-700 bg-amber-50 border-amber-100",
  },
  {
    href: "/produk",
    label: "Produk Jadi & Penjualan",
    desc: "Kelola stok barang dan transaksi kasir",
    icon: ShoppingBag,
    color: "text-purple-700 bg-purple-50 border-purple-100",
  },
  {
    href: "/kas",
    label: "Buku Kas",
    desc: "Catatan arus kas masuk dan keluar",
    icon: BookOpenCheck,
    color: "text-teal-700 bg-teal-50 border-teal-100",
  },
  {
    href: "/laporan",
    label: "Laporan Laba Rugi",
    desc: "Rekapitulasi keuangan kelompok PKK",
    icon: FileText,
    color: "text-rose-700 bg-rose-50 border-rose-100",
  },
  {
    href: "/anggota",
    label: "Anggota",
    desc: "Daftar perajin dan peran tim",
    icon: UserCheck,
    color: "text-indigo-700 bg-indigo-50 border-indigo-100",
  },
  {
    href: "/pengaturan",
    label: "Tabel Harga, Upah & Margin",
    desc: "Pengaturan dasar sistem operasional",
    icon: Settings,
    color: "text-slate-700 bg-slate-100 border-slate-200",
  },
];

export default async function MenuPage() {
  await requireMe(["pengurus"]);

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu Utama</h1>
          <p className="text-xs text-muted-foreground">
            Pusat navigasi operasional kelompok PKK
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 shadow-2xs">
          <LayoutGrid className="h-6 w-6" />
        </div>
      </div>

      {/* Grid Menu Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center justify-between rounded-2xl border bg-card p-4 shadow-2xs transition-all hover:border-emerald-500 hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`rounded-xl p-3 shrink-0 shadow-2xs ${l.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground group-hover:text-emerald-700 transition-colors">
                    {l.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {l.desc}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
