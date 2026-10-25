"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// FR18: tombol "Hasilkan ide dari stok"
export function GenerateIdeasButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(force: boolean) {
    setBusy(true); setMsg(null);
    const res = await fetch("/api/ideas", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ force }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(json.error ?? "Gagal membuat ide");
    setMsg(json.created ? `${json.created} ide baru dibuat${json.cached ? " (dari cache)" : ""}.` : "Stok belum berubah berarti — ide lama masih berlaku.");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button className="h-14 w-full text-lg" disabled={busy} onClick={() => run(false)}>
        {busy ? "AI sedang menyusun ide…" : "✨ Hasilkan ide dari stok"}
      </Button>
      <button type="button" className="w-full text-base underline" disabled={busy} onClick={() => run(true)}>
        Minta ide baru (pakai kuota AI)
      </button>
      {msg && <p className="rounded-lg bg-amber-50 p-3 text-base text-amber-800">{msg}</p>}
    </div>
  );
}
