"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";

// FR18: tombol "Hasilkan ide dari stok"
export function GenerateIdeasButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(force: boolean) {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(json.error ?? "Gagal membuat ide");
    setMsg(
      json.created
        ? `${json.created} ide baru dibuat${json.cached ? " (dari cache)" : ""}.`
        : "Stok belum berubah berarti — ide lama masih berlaku.",
    );
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button
        className="h-13 w-full text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-2 transition-all"
        disabled={busy}
        onClick={() => run(false)}
      >
        {busy ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>AI sedang menyusun ide…</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-emerald-200" />
            <span>Hasilkan Ide dari Stok</span>
          </>
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-100 hover:text-white underline underline-offset-4 disabled:opacity-50 transition-colors"
          disabled={busy}
          onClick={() => run(true)}
        >
          <RefreshCw className="h-3 w-3" />
          <span>Minta ide baru (pakai kuota AI)</span>
        </button>
      </div>

      {msg && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 shadow-2xs">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs font-medium">{msg}</p>
        </div>
      )}
    </div>
  );
}
