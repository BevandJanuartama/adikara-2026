"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn } from "@/components/kriya-ui";
import { keranjang, useKeranjang, type ItemKeranjang } from "@/lib/marketplace/keranjang";

export function PengaturJumlah({
  value,
  max,
  onChange,
  besar = false,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  besar?: boolean;
}) {
  const ukuran = besar ? "size-12" : "size-10";
  return (
    <div className="inline-flex items-center rounded-xl border bg-card">
      <button
        type="button"
        aria-label="Kurangi"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className={cn("grid place-items-center rounded-l-xl text-tinta hover:bg-daun-muda disabled:opacity-40", ukuran)}
      >
        <Minus className="size-4" />
      </button>
      <span className={cn("min-w-10 text-center font-bold tabular-nums text-tinta", besar ? "text-lg" : "text-base")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Tambah"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn("grid place-items-center rounded-r-xl text-tinta hover:bg-daun-muda disabled:opacity-40", ukuran)}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function TambahKeranjang({ produk }: { produk: Omit<ItemKeranjang, "qty"> }) {
  const items = useKeranjang();
  const sudah = items.find((i) => i.id === produk.id)?.qty ?? 0;
  const sisa = Math.max(0, produk.max - sudah);
  const [qty, setQty] = useState(1);
  const [ditambah, setDitambah] = useState(false);

  if (produk.max <= 0) {
    return <p className="rounded-xl bg-muted px-4 py-3 text-base font-semibold text-muted-foreground">Stok sedang habis</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <PengaturJumlah value={Math.min(qty, Math.max(1, sisa))} max={Math.max(1, sisa)} onChange={setQty} besar />
        <button
          type="button"
          disabled={sisa <= 0}
          onClick={() => {
            keranjang.tambah(produk, Math.min(qty, sisa));
            setDitambah(true);
            setQty(1);
          }}
          className={cn(btn.primary, "min-w-0 flex-1")}
        >
          <ShoppingCart />
          <span className="min-[420px]:hidden">Tambah</span>
          <span className="hidden min-[420px]:inline">Tambah ke keranjang</span>
        </button>
      </div>
      {sudah > 0 && (
        <p className="text-base text-muted-foreground">
          {ditambah ? "Masuk keranjang. " : ""}Di keranjang: {sudah} barang.{" "}
          <Link href="/keranjang" className="font-semibold text-hutan underline-offset-4 hover:underline">
            Lihat keranjang
          </Link>
        </p>
      )}
    </div>
  );
}
