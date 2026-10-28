"use client";

import { useState } from "react";
import { Crosshair, LoaderCircle, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn, inputClass, labelClass } from "@/components/kriya-ui";
import { bacaKoordinat, linkGoogleMaps, petaEmbedUrl, titikValid, type Titik } from "@/lib/marketplace/geo";

// Pilih titik lokasi: tombol GPS atau tempel koordinat/link Google Maps.
// Dipakai di form daftar posko, pengaturan posko, dan checkout.
// Bila `namaLat`/`namaLng` diisi, nilainya ikut terkirim sebagai input tersembunyi di <form>.
export function LokasiInput({
  label = "Titik lokasi",
  bantuan,
  awal,
  onChange,
  namaLat,
  namaLng,
  wajib = false,
}: {
  label?: string;
  bantuan?: string;
  awal?: Titik | null;
  onChange?: (t: Titik | null) => void;
  namaLat?: string;
  namaLng?: string;
  wajib?: boolean;
}) {
  const [titik, setTitik] = useState<Titik | null>(titikValid(awal) ? awal : null);
  const [teks, setTeks] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const pilih = (t: Titik | null) => {
    setTitik(t);
    setGalat(null);
    onChange?.(t);
  };

  const pakaiGps = () => {
    if (!("geolocation" in navigator)) {
      setGalat("Browser ini tidak mendukung lokasi. Tempel koordinat dari Google Maps.");
      return;
    }
    setSibuk(true);
    setGalat(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSibuk(false);
        pilih({ lat: Number(pos.coords.latitude.toFixed(6)), lng: Number(pos.coords.longitude.toFixed(6)) });
      },
      (err) => {
        setSibuk(false);
        setGalat(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Izinkan lokasi di browser, atau tempel koordinat dari Google Maps."
            : "Lokasi belum terbaca. Coba lagi di tempat terbuka, atau tempel koordinat.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const pakaiTeks = () => {
    const t = bacaKoordinat(teks);
    if (!t) {
      setGalat("Format belum dikenali. Contoh: -6.9741, 107.6309 atau link Google Maps yang berisi angka koordinat.");
      return;
    }
    setTeks("");
    pilih(t);
  };

  return (
    <div className="space-y-2">
      <p className={labelClass}>
        {label}
        {!wajib && <span className="font-normal text-muted-foreground"> (opsional)</span>}
      </p>
      {namaLat && <input type="hidden" name={namaLat} value={titik?.lat ?? ""} />}
      {namaLng && <input type="hidden" name={namaLng} value={titik?.lng ?? ""} />}

      {titik ? (
        <div className="space-y-2 rounded-xl border bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-base font-semibold text-tinta">
              <MapPin className="size-5 text-hutan" aria-hidden />
              <span className="tabular-nums">
                {titik.lat.toFixed(5)}, {titik.lng.toFixed(5)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => pilih(null)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-tinta"
            >
              <X className="size-4" /> Ganti titik
            </button>
          </div>
          <div className="overflow-hidden rounded-lg border bg-muted">
            <iframe title="Pratinjau titik lokasi" src={petaEmbedUrl(titik)} loading="lazy" className="block h-44 w-full" />
          </div>
          <a href={linkGoogleMaps(titik)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-hutan underline-offset-4 hover:underline">
            Cek di Google Maps
          </a>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-dashed bg-card p-3">
          <button type="button" onClick={pakaiGps} disabled={sibuk} className={cn(btn.outline, "w-full")}>
            {sibuk ? <LoaderCircle className="animate-spin" /> : <Crosshair />}
            {sibuk ? "Membaca lokasi…" : "Pakai lokasi saya sekarang"}
          </button>
          <div className="flex gap-2">
            <input
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  pakaiTeks();
                }
              }}
              placeholder="atau tempel koordinat / link Google Maps"
              aria-label="Koordinat atau link Google Maps"
              className={cn(inputClass, "min-w-0 flex-1")}
            />
            <button type="button" onClick={pakaiTeks} disabled={!teks.trim()} className={cn(btn.secondary, "shrink-0")}>
              Pakai
            </button>
          </div>
        </div>
      )}
      {galat && <p className="text-sm font-medium text-bata-ink">{galat}</p>}
      {bantuan && !galat && <p className="text-sm text-muted-foreground">{bantuan}</p>}
    </div>
  );
}
