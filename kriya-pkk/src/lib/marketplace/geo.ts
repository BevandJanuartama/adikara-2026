// Batas jangkauan pengiriman ekspedisi dari posko (juga dicek ulang di database)
export const MAKS_JARAK_KM = 150;

export type Titik = { lat: number; lng: number };

export function jarakKm(a: Titik, b: Titik): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export const titikValid = (t: Partial<Titik> | null | undefined): t is Titik =>
  !!t &&
  typeof t.lat === "number" &&
  typeof t.lng === "number" &&
  Number.isFinite(t.lat) &&
  Number.isFinite(t.lng) &&
  Math.abs(t.lat) <= 90 &&
  Math.abs(t.lng) <= 180 &&
  !(t.lat === 0 && t.lng === 0);

// Terima "-6.97, 107.63" atau link Google Maps (…/@-6.97,107.63,17z atau …?q=-6.97,107.63)
export function bacaKoordinat(teks: string): Titik | null {
  const s = decodeURIComponent(teks.trim());
  const pola = [
    /@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/,
    /[?&](?:q|query|ll|destination)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/,
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /^(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/,
  ];
  for (const p of pola) {
    const m = s.match(p);
    if (m) {
      const t = { lat: Number(m[1]), lng: Number(m[2]) };
      if (titikValid(t)) return t;
    }
  }
  return null;
}

export const linkGoogleMaps = (t: Titik) => `https://www.google.com/maps?q=${t.lat},${t.lng}`;

// Peta OpenStreetMap tanpa API key
export function petaEmbedUrl(t: Titik, zoom: "dekat" | "sedang" = "dekat") {
  const d = zoom === "dekat" ? 0.006 : 0.02;
  const bbox = [t.lng - d * 1.6, t.lat - d, t.lng + d * 1.6, t.lat + d].map((n) => n.toFixed(5)).join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${t.lat},${t.lng}`;
}
