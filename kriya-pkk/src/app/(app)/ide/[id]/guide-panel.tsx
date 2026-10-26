"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Sparkles,
  Volume2,
  CheckCircle2,
  ListOrdered,
  Lightbulb,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";

type Guide = {
  persiapan: string[];
  langkah: string[];
  tips: string[];
  keselamatan: string[];
};

// FR22: panduan dibuat saat dibutuhkan + tombol suara (Text-to-Speech bawaan browser, gratis)
export function GuidePanel({
  ideaId,
  initial,
}: {
  ideaId: string;
  initial: Guide | null;
}) {
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
      <div className="space-y-3 rounded-2xl border bg-card p-6 shadow-2xs text-center">
        <div className="mx-auto inline-flex rounded-full bg-emerald-50 p-3 text-emerald-700">
          <BookOpen className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold">Panduan Pengerjaan</h2>
          <p className="text-xs text-muted-foreground">
            Buat panduan langkah demi langkah menggunakan AI untuk kelompok
            pengrajin.
          </p>
        </div>
        <Button
          className="h-12 w-full text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-2"
          disabled={busy}
          onClick={load}
        >
          {busy ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>AI sedang menulis panduan…</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-emerald-200" />
              <span>Buat Panduan Pengerjaan</span>
            </>
          )}
        </Button>
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  const block = (
    title: string,
    items: string[],
    icon: React.ReactNode,
    ordered = false,
    variant: "default" | "warning" = "default",
  ) =>
    items.length > 0 && (
      <div
        className={`space-y-3 rounded-2xl border p-4 shadow-2xs ${variant === "warning" ? "border-amber-200 bg-amber-50/50" : "bg-card"}`}
      >
        <div className="flex items-center gap-2 border-b pb-2.5">
          <div
            className={
              variant === "warning" ? "text-amber-600" : "text-emerald-700"
            }
          >
            {icon}
          </div>
          <h3
            className={`text-sm font-bold ${variant === "warning" ? "text-amber-900" : "text-foreground"}`}
          >
            {title}
          </h3>
        </div>

        {ordered ? (
          <ol className="space-y-2.5">
            {items.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-xs sm:text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
                  {i + 1}
                </span>
                <span className="flex-1 text-foreground leading-relaxed">
                  {s}
                </span>
                <button
                  type="button"
                  aria-label="Dengarkan langkah"
                  className="rounded-lg border bg-background p-1.5 text-muted-foreground hover:text-emerald-700 transition-colors"
                  onClick={() => speak(s)}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="space-y-2">
            {items.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${variant === "warning" ? "bg-amber-600" : "bg-emerald-600"}`}
                />
                <span className="flex-1 leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-2xs">
      <div className="flex items-center justify-between border-b pb-3.5">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Panduan Pengerjaan</h2>
            <p className="text-xs text-muted-foreground">
              Ikuti langkah-langkah pembuatan produk
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-xs font-semibold border-emerald-200 text-emerald-800 hover:bg-emerald-50"
          onClick={() =>
            speak(
              guide.langkah.map((s, i) => `Langkah ${i + 1}. ${s}`).join(" "),
            )
          }
        >
          <Volume2 className="h-4 w-4 text-emerald-600" />
          <span>Dengarkan Semua</span>
        </Button>
      </div>

      <div className="space-y-3">
        {block(
          "Persiapan Alat & Bahan",
          guide.persiapan,
          <CheckCircle2 className="h-4 w-4" />,
        )}
        {block(
          "Langkah-Langkah Pembuatan",
          guide.langkah,
          <ListOrdered className="h-4 w-4" />,
          true,
        )}
        {block(
          "Tips & Hasil Rapi",
          guide.tips,
          <Lightbulb className="h-4 w-4" />,
        )}
        {block(
          "Catatan Keselamatan Kerja",
          guide.keselamatan,
          <ShieldAlert className="h-4 w-4" />,
          false,
          "warning",
        )}
      </div>
    </div>
  );
}
