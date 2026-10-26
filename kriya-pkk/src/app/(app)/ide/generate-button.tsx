"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Notice, btn } from "@/components/kriya-ui";

// FR18: tombol "Hasilkan ide dari stok"
export function GenerateIdeasButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "warning"; text: string } | null>(null);

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
    if (!res.ok) return setMsg({ tone: "warning", text: json.error ?? "Gagal membuat ide" });
    setMsg({
      tone: "success",
      text: json.created
        ? `${json.created} ide baru dibuat${json.cached ? " (dari cache)" : ""}.`
        : "Stok belum berubah berarti, jadi ide lama masih berlaku.",
    });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button type="button" className={cn(btn.primary, "sm:min-w-64")} disabled={busy} onClick={() => run(false)}>
          {busy ? (
            <>
              <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
              AI sedang menyusun ide…
            </>
          ) : (
            <>
              <Sparkles /> Hasilkan ide dari stok
            </>
          )}
        </button>
        <button type="button" className={cn(btn.outline, "bg-card/70")} disabled={busy} onClick={() => run(true)}>
          <RefreshCw /> Minta ide baru
        </button>
      </div>
      <p className="text-sm text-tinta/80">&ldquo;Minta ide baru&rdquo; selalu memakai 1 kuota AI harian.</p>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
    </div>
  );
}
