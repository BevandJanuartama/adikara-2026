"use client";

import { snapJsUrl, type KonfigSnap } from "@/lib/marketplace/midtrans-mode";

// Memuat snap.js Midtrans sekali saja, lalu membuka popup pembayaran.
type SnapCallbacks = {
  onSuccess?: (r: unknown) => void;
  onPending?: (r: unknown) => void;
  onError?: (r: unknown) => void;
  onClose?: () => void;
};
declare global {
  interface Window {
    snap?: { pay: (token: string, cb?: SnapCallbacks) => void };
  }
}

let muat: Promise<void> | null = null;

export function muatSnap({ clientKey, produksi }: KonfigSnap): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("browser saja"));
  if (window.snap) return Promise.resolve();
  if (muat) return muat;
  const src = snapJsUrl(produksi);
  muat = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.setAttribute("data-client-key", clientKey);
    s.onload = () => resolve();
    s.onerror = () => {
      muat = null;
      reject(new Error("Gagal memuat halaman pembayaran"));
    };
    document.head.appendChild(s);
  });
  return muat;
}

export async function bayar(token: string, konfig: KonfigSnap, cb: SnapCallbacks) {
  if (!konfig.clientKey) throw new Error("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY kosong");
  await muatSnap(konfig);
  if (!window.snap) throw new Error("Snap belum siap");
  window.snap.pay(token, cb);
}
