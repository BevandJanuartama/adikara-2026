"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Guide = { persiapan: string[]; langkah: string[]; tips: string[]; keselamatan: string[] };

// FR22: panduan dibuat saat dibutuhkan + tombol suara (Text-to-Speech bawaan browser, gratis)
export function GuidePanel({ ideaId, initial }: { ideaId: string; initial: Guide | null }) {
  const [guide, setGuide] = useState<Guide | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setBusy(true); setError(null);
    const res = await fetch("/api/guide", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ideaId }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setError(json.error ?? "Gagal membuat panduan");
    setGuide(json.guide);
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }

  if (!guide) {
    return (
      <div className="space-y-2">
        <Button className="h-12 w-full text-base" disabled={busy} onClick={load}>
          {busy ? "AI menulis panduan…" : "📖 Buat panduan pengerjaan"}
        </Button>
        {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      </div>
    );
  }

  const block = (title: string, items: string[], ordered = false) =>
    items.length > 0 && (
      <div>
        <h3 className="mb-1 text-lg font-semibold">{title}</h3>
        {ordered ? (
          <ol className="space-y-2">
            {items.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-base">
                <span className="font-bold">{i + 1}.</span>
                <span className="flex-1">{s}</span>
                <button type="button" aria-label="Dengarkan" className="rounded border px-2" onClick={() => speak(s)}>🔊</button>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-base">{items.map((s, i) => <li key={i}>{s}</li>)}</ul>
        )}
      </div>
    );

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Panduan</h2>
        <button type="button" className="rounded-lg border px-3 py-2 text-base"
          onClick={() => speak(guide.langkah.map((s, i) => `Langkah ${i + 1}. ${s}`).join(" "))}>
          🔊 Dengarkan semua
        </button>
      </div>
      {block("Persiapan", guide.persiapan)}
      {block("Langkah", guide.langkah, true)}
      {block("Tips", guide.tips)}
      {block("Keselamatan", guide.keselamatan)}
    </div>
  );
}
