"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn, Notice } from "@/components/kriya-ui";
import { bayar } from "@/lib/marketplace/snap";
import type { KonfigSnap } from "@/lib/marketplace/midtrans-mode";

export function TombolBayar({ code, snap }: { code: string; snap: KonfigSnap }) {
  const router = useRouter();
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function klik() {
    setSibuk(true);
    setGalat(null);
    try {
      const res = await fetch("/api/pesanan/bayar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal membuka pembayaran");
      const muatUlang = () => {
        setSibuk(false);
        router.refresh();
      };
      await bayar(json.token, snap, { onSuccess: muatUlang, onPending: muatUlang, onError: muatUlang, onClose: muatUlang });
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal membuka pembayaran");
      setSibuk(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={klik} disabled={sibuk} className={cn(btn.primary, "w-full sm:w-auto")}>
        {sibuk ? <LoaderCircle className="animate-spin" /> : <CreditCard />}
        {sibuk ? "Membuka pembayaran…" : "Bayar sekarang"}
      </button>
      {galat && <Notice tone="error">{galat}</Notice>}
    </div>
  );
}
