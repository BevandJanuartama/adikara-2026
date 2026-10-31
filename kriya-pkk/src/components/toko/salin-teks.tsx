"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn } from "@/components/kriya-ui";

// Tombol salin ke clipboard (nomor rekening, nominal, resi, data pengiriman)
export function SalinTeks({
  teks,
  label = "Salin",
  className,
  variant = "outline",
}: {
  teks: string;
  label?: string;
  className?: string;
  variant?: "outline" | "secondary" | "primary";
}) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => setOk(false), 2000);
    return () => clearTimeout(t);
  }, [ok]);

  async function salin() {
    try {
      await navigator.clipboard.writeText(teks);
      setOk(true);
    } catch {
      // clipboard diblokir browser: teks tetap terlihat di layar untuk disalin manual
      setOk(false);
    }
  }

  return (
    <button type="button" onClick={salin} className={cn(btn[variant], btn.small, className)} aria-live="polite">
      {ok ? <Check /> : <Copy />}
      {ok ? "Disalin" : label}
    </button>
  );
}
