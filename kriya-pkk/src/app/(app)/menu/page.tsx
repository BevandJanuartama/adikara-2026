import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { PageHeader } from "@/components/kriya-ui";
import { SIDEBAR } from "@/components/nav-items";

const DESC: Record<string, string> = {
  "/setoran": "Semua setoran warga beserta statusnya",
  "/warga": "Daftar penyetor dan pencairan saldo",
  "/stok": "Persediaan bahan dari setoran",
  "/ide": "Ide kerajinan, modal, dan panduan",
  "/produksi": "Batch produksi, hasil, dan upah",
  "/produk": "Stok produk jadi dan catat penjualan",
  "/kas": "Pemasukan, pengeluaran, dan koreksi",
  "/laporan": "Laba rugi dan arus kas per periode",
  "/anggota": "Akun pengurus dan perajin",
  "/pengaturan": "Tabel harga per kg, upah, dan margin",
};

const TONES = ["bg-pucuk", "bg-mentega", "bg-persik", "bg-daun-muda"];

// Menu lengkap untuk HP/tablet (di desktop semua menu ada di sidebar)
export default async function MenuPage() {
  await requireMe(["pengurus"]);
  const groups = SIDEBAR.pengurus.filter((g) => g.title);

  return (
    <div className="space-y-8">
      <PageHeader title="Menu lainnya" description="Semua fitur posko dalam satu tempat." icon={LayoutGrid} />
      {groups.map((g) => (
        <section key={g.title}>
          <h2 className="mb-3 text-base font-bold text-muted-foreground">{g.title}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-sage hover:bg-daun-muda/50"
                >
                  <span className={`grid size-12 shrink-0 place-items-center rounded-xl text-tinta ${TONES[i % TONES.length]}`}>
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-tinta">{item.label}</span>
                    <span className="block text-sm text-muted-foreground">{DESC[item.href]}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
