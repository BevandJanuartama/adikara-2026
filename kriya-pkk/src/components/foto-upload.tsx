"use client";

import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage, randomName } from "@/lib/image";
import { cn } from "@/lib/utils";
import { btn, labelClass } from "@/components/kriya-ui";
import { BUCKET_PRODUK, fotoProdukUrl } from "@/lib/marketplace/foto";

// Unggah foto produk ke bucket publik "produk" (<group_id>/<acak>.jpg).
// Path tersimpan di input tersembunyi `name`, ikut terkirim bersama form.
export function FotoUpload({
  groupId,
  name = "photo_path",
  awal,
  label = "Foto produk",
}: {
  groupId: string;
  name?: string;
  awal?: string | null;
  label?: string;
}) {
  const [path, setPath] = useState<string | null>(awal ?? null);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const url = fotoProdukUrl(path);

  async function pilih(file: File | undefined) {
    if (!file) return;
    setSibuk(true);
    setGalat(null);
    try {
      const blob = await compressImage(file, 1080, 0.8);
      const p = `${groupId}/${randomName()}.jpg`;
      const { error } = await createClient().storage.from(BUCKET_PRODUK).upload(p, blob, { contentType: "image/jpeg" });
      if (error) throw new Error(error.message);
      setPath(p);
    } catch (e) {
      setGalat(`Foto gagal diunggah: ${e instanceof Error ? e.message : "coba lagi"}`);
    } finally {
      setSibuk(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <p className={labelClass}>
        {label} <span className="font-normal text-muted-foreground">(opsional)</span>
      </p>
      <input type="hidden" name={name} value={path ?? ""} />
      <div className="flex items-center gap-3">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border bg-muted">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-7 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <label className={cn(btn.outline, btn.small, "cursor-pointer", sibuk && "pointer-events-none opacity-60")}>
            {sibuk ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
            {sibuk ? "Mengunggah…" : path ? "Ganti foto" : "Pilih foto"}
            <input ref={ref} type="file" accept="image/*" className="sr-only" onChange={(e) => pilih(e.target.files?.[0])} />
          </label>
          {path && !sibuk && (
            <button type="button" onClick={() => setPath(null)} className={cn(btn.danger, btn.small)}>
              <Trash2 /> Hapus
            </button>
          )}
        </div>
      </div>
      {galat && <p className="text-sm font-medium text-bata-ink">{galat}</p>}
    </div>
  );
}
