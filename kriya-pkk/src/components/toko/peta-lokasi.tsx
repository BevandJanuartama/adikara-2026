import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { linkGoogleMaps, petaEmbedUrl, type Titik } from "@/lib/marketplace/geo";

// Peta OpenStreetMap (tanpa API key) + tautan Google Maps
export function PetaLokasi({ titik, judul, className }: { titik: Titik; judul: string; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="overflow-hidden rounded-xl border bg-muted">
        <iframe
          title={`Peta lokasi ${judul}`}
          src={petaEmbedUrl(titik)}
          loading="lazy"
          className="block h-52 w-full sm:h-60"
          referrerPolicy="no-referrer"
        />
      </div>
      <a
        href={linkGoogleMaps(titik)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-base font-semibold text-hutan underline-offset-4 hover:underline"
      >
        Buka di Google Maps <ExternalLink className="size-4" aria-hidden />
      </a>
    </div>
  );
}
