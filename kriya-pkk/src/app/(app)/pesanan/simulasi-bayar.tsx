"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleX, FlaskConical, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn, Notice } from "@/components/kriya-ui";

// Tombol simulasi pembayaran (hanya tampil saat SIMULASI_PEMBAYARAN=true & Midtrans sandbox)
export function SimulasiBayar({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [sibuk, setSibuk] = useState<"lunas" | "gagal" | null>(null);
  const [yakinGagal, setYakinGagal] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  // tombol "gagal" perlu ditekan dua kali (tanpa dialog bawaan browser)
  useEffect(() => {
    if (!yakinGagal) return;
    const t = setTimeout(() => setYakinGagal(false), 4000);
    return () => clearTimeout(t);
  }, [yakinGagal]);

  async function kirim(aksi: "lunas" | "gagal") {
    if (aksi === "gagal" && !yakinGagal) {
      setYakinGagal(true);
      return;
    }
    setSibuk(aksi);
    setGalat(null);
    try {
      const res = await fetch("/api/pesanan/simulasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, aksi }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Gagal mengubah status");
      router.refresh();
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal mengubah status");
    } finally {
      setSibuk(null);
      setYakinGagal(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border-2 border-dashed border-mentega-ink/40 bg-mentega/40 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-mentega-ink">
        <FlaskConical className="size-4 shrink-0" aria-hidden /> Mode uji sandbox: ubah status pembayaran manual
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => kirim("lunas")} disabled={!!sibuk} className={cn(btn.primary, btn.small)}>
          {sibuk === "lunas" ? <LoaderCircle className="animate-spin" /> : <CircleCheck />} Tandai lunas
        </button>
        <button type="button" onClick={() => kirim("gagal")} disabled={!!sibuk} className={cn(btn.danger, btn.small)}>
          {sibuk === "gagal" ? <LoaderCircle className="animate-spin" /> : <CircleX />}
          {yakinGagal ? "Tekan lagi untuk yakin" : "Tandai gagal bayar"}
        </button>
      </div>
      <p className="text-sm text-mentega-ink">
        Lunas: penjualan masuk buku kas dan WhatsApp &quot;LUNAS&quot; terkirim, sama seperti pembayaran asli. Gagal: stok kembali.
      </p>
      {galat && <Notice tone="error">{galat}</Notice>}
    </div>
  );
}
