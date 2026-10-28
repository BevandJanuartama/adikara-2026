"use client";

import { useSyncExternalStore } from "react";

// Keranjang disimpan di browser pembeli (tanpa akun). Harga & stok dicek ulang di server saat checkout.
export type ItemKeranjang = {
  id: string;
  name: string;
  price: number;
  qty: number;
  max: number;
  photo_path: string | null;
  category: string;
  posko_slug: string;
  posko_name: string;
};

const KEY = "kriyapkk:keranjang:v1";
const EVENT = "kriyapkk:keranjang";
const KOSONG: ItemKeranjang[] = [];

let memori: string | null = null; // cadangan bila localStorage diblokir (mode privat)
let cacheRaw: string | null | undefined;
let cacheVal: ItemKeranjang[] = KOSONG;

function rawSekarang(): string | null {
  try {
    return window.localStorage.getItem(KEY) ?? memori;
  } catch {
    return memori;
  }
}

function baca(): ItemKeranjang[] {
  const raw = rawSekarang();
  if (raw === cacheRaw) return cacheVal;
  cacheRaw = raw;
  try {
    const v = raw ? JSON.parse(raw) : [];
    cacheVal = Array.isArray(v) ? (v as ItemKeranjang[]) : KOSONG;
  } catch {
    cacheVal = KOSONG;
  }
  return cacheVal;
}

function tulis(items: ItemKeranjang[]) {
  const raw = JSON.stringify(items);
  memori = raw;
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    /* pakai memori */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useKeranjang(): ItemKeranjang[] {
  return useSyncExternalStore(subscribe, baca, () => KOSONG);
}

const batas = (qty: number, max: number) => Math.max(1, Math.min(Math.floor(qty), Math.max(1, max), 99));

export const keranjang = {
  tambah(item: Omit<ItemKeranjang, "qty">, qty: number) {
    const items = [...baca()];
    const i = items.findIndex((x) => x.id === item.id);
    if (i >= 0) items[i] = { ...items[i], ...item, qty: batas(items[i].qty + qty, item.max) };
    else items.push({ ...item, qty: batas(qty, item.max) });
    tulis(items);
  },
  ubah(id: string, qty: number) {
    tulis(baca().map((x) => (x.id === id ? { ...x, qty: batas(qty, x.max) } : x)));
  },
  hapus(id: string) {
    tulis(baca().filter((x) => x.id !== id));
  },
  hapusPosko(slug: string) {
    tulis(baca().filter((x) => x.posko_slug !== slug));
  },
  // samakan harga/stok dengan data terbaru; produk yang sudah tidak dijual dibuang
  perbarui(segar: { id: string; name: string; sell_price: number; qty: number; photo_path: string | null }[]) {
    const map = new Map(segar.map((s) => [s.id, s]));
    const lama = baca();
    const baru = lama
      .filter((x) => (map.get(x.id)?.qty ?? 0) > 0)
      .map((x) => {
        const s = map.get(x.id)!;
        return { ...x, name: s.name, price: Number(s.sell_price), max: s.qty, photo_path: s.photo_path, qty: Math.min(x.qty, s.qty) };
      });
    if (JSON.stringify(baru) !== JSON.stringify(lama)) tulis(baru);
    return lama.length - baru.length;
  },
};
