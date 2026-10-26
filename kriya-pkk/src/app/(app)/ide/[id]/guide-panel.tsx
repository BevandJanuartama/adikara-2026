"use client";

import { useState } from "react";
import { BookOpen, CircleCheck, Lightbulb, ShieldAlert, Sparkles, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Notice, Panel, btn } from "@/components/kriya-ui";

type Guide = { persiapan: string[]; langkah: string[]; tips: string[]; keselamatan: string[] };

// FR22: panduan dibuat saat dibutuhkan + tombol suara (Text-to-Speech bawaan browser, gratis)
export function GuidePanel({ ideaId, initial }: { ideaId: string; initial: Guide | null }) {
  const [guide, setGuide] = useState<Guide | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ideaId }),
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
      <Panel title="Panduan pengerjaan" icon={BookOpen}>
        <div className="space-y-4">
          <p className="text-base text-muted-foreground">
            AI menulis langkah demi langkah yang bisa dibacakan dengan suara. Panduan disimpan dan dipakai ulang.
          </p>
          <button type="button" className={cn(btn.primary, "w-full sm:w-auto")} disabled={busy} onClick={load}>
            {busy ? (
              <>
                <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
                AI sedang menulis panduan…
              </>
            ) : (
              <>
                <Sparkles /> Buat panduan
              </>
            )}
          </button>
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      </Panel>
    );
  }

  const list = (items: string[], dot: string) =>
    items.length > 0 && (
      <ul className="space-y-2">
        {items.map((s, i) => (
          <li key={i} className="flex gap-3 text-base leading-relaxed text-tinta">
            <span className={cn("mt-2.5 size-2 shrink-0 rounded-full", dot)} aria-hidden />
            {s}
          </li>
        ))}
      </ul>
    );

  return (
    <Panel
      title="Panduan pengerjaan"
      icon={BookOpen}
      actions={
        <button
          type="button"
          className={cn(btn.outline, btn.small)}
          onClick={() => speak(guide.langkah.map((s, i) => `Langkah ${i + 1}. ${s}`).join(" "))}
        >
          <Volume2 /> Dengarkan semua
        </button>
      }
    >
      <div className="space-y-6">
        {guide.persiapan.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-tinta">
              <CircleCheck className="size-5 text-hutan" aria-hidden /> Persiapan
            </h3>
            {list(guide.persiapan, "bg-sage")}
          </section>
        )}

        <section>
          <h3 className="mb-3 text-base font-bold text-tinta">Langkah</h3>
          <ol className="space-y-2">
            {guide.langkah.map((s, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl bg-daun-muda/60 p-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mentega text-sm font-bold text-tinta">{i + 1}</span>
                <span className="flex-1 pt-1 text-base leading-relaxed text-tinta">{s}</span>
                <button
                  type="button"
                  aria-label={`Dengarkan langkah ${i + 1}`}
                  className="grid size-10 shrink-0 place-items-center rounded-lg border bg-card text-hutan hover:bg-pucuk"
                  onClick={() => speak(s)}
                >
                  <Volume2 className="size-5" />
                </button>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {guide.tips.length > 0 && (
            <section className="rounded-xl bg-pucuk/40 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-tinta">
                <Lightbulb className="size-5 text-pucuk-ink" aria-hidden /> Tips
              </h3>
              {list(guide.tips, "bg-hutan")}
            </section>
          )}
          {guide.keselamatan.length > 0 && (
            <section className="rounded-xl bg-mentega/70 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-tinta">
                <ShieldAlert className="size-5 text-mentega-ink" aria-hidden /> Keselamatan
              </h3>
              {list(guide.keselamatan, "bg-mentega-ink")}
            </section>
          )}
        </div>
      </div>
    </Panel>
  );
}
