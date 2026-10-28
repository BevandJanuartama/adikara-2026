"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useKeranjang } from "@/lib/marketplace/keranjang";

export function TombolKeranjang() {
  const items = useKeranjang();
  const n = items.reduce((s, i) => s + i.qty, 0);
  return (
    <Link
      href="/keranjang"
      aria-label={`Keranjang, ${n} barang`}
      className="relative inline-flex h-11 items-center gap-2 rounded-xl bg-hutan px-3.5 text-base font-semibold text-white transition-colors hover:bg-tinta"
    >
      <ShoppingCart className="size-5" aria-hidden />
      <span className="hidden sm:inline">Keranjang</span>
      {n > 0 && (
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-mentega px-1.5 text-sm font-bold text-tinta tabular-nums">
          {n > 99 ? "99+" : n}
        </span>
      )}
    </Link>
  );
}
