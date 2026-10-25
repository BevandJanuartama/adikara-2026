import Link from "next/link";
import { requireMe } from "@/lib/auth";

const LINKS = [
  { href: "/setoran", label: "Riwayat setoran" },
  { href: "/warga", label: "Data warga & saldo" },
  { href: "/produksi", label: "Produksi" },
  { href: "/produk", label: "Produk jadi & penjualan" },
  { href: "/kas", label: "Buku kas" },
  { href: "/laporan", label: "Laporan laba rugi" },
  { href: "/anggota", label: "Anggota" },
  { href: "/pengaturan", label: "Tabel harga, upah & margin" },
];

export default async function MenuPage() {
  await requireMe(["pengurus"]);
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Menu</h1>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="block rounded-xl border p-4 text-lg">
          {l.label}
        </Link>
      ))}
    </div>
  );
}
