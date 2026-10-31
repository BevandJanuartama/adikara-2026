import Link from "next/link";
import { ClipboardList, LayoutGrid, LogIn, LogOut } from "lucide-react";
import { Logo } from "@/components/brand";
import { TombolKeranjang } from "@/components/toko/tombol-keranjang";
import { getMe } from "@/lib/auth";
import { logoutToko } from "@/lib/actions/auth";

const dasar = "h-11 items-center gap-2 rounded-xl px-3 text-base font-semibold text-tinta hover:bg-daun-muda [&_svg]:size-5 [&_svg]:shrink-0";
const tautan = `inline-flex ${dasar}`;

// Toko online: katalog & keranjang bebas dibuka; checkout & status pesanan perlu akun pembeli
export default async function TokoLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  const pembeli = me?.role === "pembeli";

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/katalog" className="flex min-w-0 items-center gap-2 rounded-lg">
            <Logo className="hidden min-[400px]:flex" />
            <Logo compact className="min-[400px]:hidden" />
            <span className="hidden rounded-full bg-mentega px-2.5 py-0.5 text-sm font-semibold text-mentega-ink sm:inline">Toko</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/katalog" className={`hidden md:inline-flex ${dasar}`}>
              Katalog
            </Link>
            {pembeli ? (
              <>
                <Link href="/akun/pesanan" className={tautan}>
                  <ClipboardList aria-hidden /> <span>Pesanan<span className="hidden sm:inline"> saya</span></span>
                </Link>
                <form action={logoutToko} className="hidden sm:block">
                  <button type="submit" className={tautan} aria-label="Keluar">
                    <LogOut aria-hidden />
                  </button>
                </form>
              </>
            ) : me ? (
              <Link href={me.role === "admin" ? "/admin" : "/beranda"} className={tautan}>
                <LayoutGrid aria-hidden /> Dasbor
              </Link>
            ) : (
              <Link href="/login" className={tautan}>
                <LogIn aria-hidden /> Masuk
              </Link>
            )}
            <TombolKeranjang />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-8">{children}</main>

      <footer className="border-t bg-daun-muda/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Produk olahan limbah dari posko PKK. Setiap pembelian menambah kas kelompok dan upah perajin.</p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Tautan toko">
            <Link href="/privasi" className="font-semibold text-hutan hover:underline">
              Kebijakan privasi
            </Link>
            <Link href="/" className="font-semibold text-hutan hover:underline">
              Tentang KriyaPKK
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
