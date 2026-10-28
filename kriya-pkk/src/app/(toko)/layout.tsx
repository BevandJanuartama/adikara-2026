import Link from "next/link";
import { Logo } from "@/components/brand";
import { TombolKeranjang } from "@/components/toko/tombol-keranjang";

// Toko online publik: katalog, keranjang, checkout, lacak pesanan (tanpa login)
export default function TokoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/katalog" className="flex min-w-0 items-center gap-2 rounded-lg">
            <Logo className="hidden min-[380px]:flex" />
            <Logo compact className="min-[380px]:hidden" />
            <span className="hidden rounded-full bg-mentega px-2.5 py-0.5 text-sm font-semibold text-mentega-ink sm:inline">Toko</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/katalog" className="hidden h-11 items-center rounded-xl px-3 text-base font-semibold text-tinta hover:bg-daun-muda md:inline-flex">
              Katalog
            </Link>
            <Link href="/login" className="inline-flex h-11 items-center rounded-xl px-3 text-base font-semibold text-tinta hover:bg-daun-muda">
              Masuk posko
            </Link>
            <TombolKeranjang />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-8">{children}</main>

      <footer className="border-t bg-daun-muda/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Produk olahan limbah dari posko PKK. Setiap pembelian menambah kas kelompok dan upah perajin.</p>
          <Link href="/" className="font-semibold text-hutan hover:underline">
            Tentang KriyaPKK
          </Link>
        </div>
      </footer>
    </div>
  );
}
