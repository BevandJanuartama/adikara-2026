import { cn } from "@/lib/utils";

// Tanda "Kawung Perca": empat daun kawung berjahit yang bertemu di satu titik (posko PKK).
// Geometri sama persis dengan file SVG di kit logo: kotak 11 × 11 petak, daun 5 × 5, celah 1 petak.
const PETALS = [
  { d: "M5 5A50 50 0 0 1 55 55A50 50 0 0 1 5 5Z", v: [16.5, 16.5, 43.5, 43.5], fill: "#FBE6B1" },
  { d: "M115 5A50 50 0 0 1 65 55A50 50 0 0 1 115 5Z", v: [103.5, 16.5, 76.5, 43.5], fill: "#B2D4AB" },
  { d: "M115 115A50 50 0 0 1 65 65A50 50 0 0 1 115 115Z", v: [103.5, 103.5, 76.5, 76.5], fill: "#F6D5AC" },
  { d: "M5 115A50 50 0 0 1 55 65A50 50 0 0 1 5 115Z", v: [16.5, 103.5, 43.5, 76.5], fill: "#94B587" },
];

export function LogoMark({
  variant = "warna",
  className,
  title,
}: {
  variant?: "warna" | "putih";
  className?: string;
  title?: string;
}) {
  const putih = variant === "putih";
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {PETALS.map((p) => (
        <g key={p.d}>
          <path
            d={p.d}
            fill={putih ? "#fff" : p.fill}
            stroke={putih ? "#fff" : "#24361F"}
            strokeWidth={4.5}
            strokeLinejoin="round"
          />
          {/* jahitan = urat daun. Versi putih memakai warna hutan supaya tampak berlubang di latar hijau */}
          <line
            x1={p.v[0]}
            y1={p.v[1]}
            x2={p.v[2]}
            y2={p.v[3]}
            stroke={putih ? "#3E5E35" : "#24361F"}
            strokeWidth={3.6}
            strokeLinecap="round"
            strokeDasharray="6.2 4.6"
          />
        </g>
      ))}
      <circle cx={60} cy={60} r={4.2} fill={putih ? "#fff" : "#3E5E35"} />
    </svg>
  );
}

// Logo lengkap: tanda + tulisan. "Kriya" tebal (karya tangan), "PKK" lebih ringan (wadah komunitas).
export function Logo({
  compact = false,
  inverse = false,
  className,
}: {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark variant={inverse ? "putih" : "warna"} className="size-9" title={compact ? "KriyaPKK" : undefined} />
      {!compact && (
        <span className={cn("text-lg font-extrabold tracking-tight", inverse ? "text-white" : "text-tinta")}>
          Kriya<span className={cn("font-medium", inverse ? "text-white" : "text-hutan")}>PKK</span>
        </span>
      )}
    </span>
  );
}

// Panel tambalan perca untuk halaman masuk/daftar/status (dekoratif)
const PATCHES = [
  "bg-mentega", "bg-sage", "bg-persik", "bg-pucuk", "bg-hutan", "bg-mentega",
  "bg-pucuk", "bg-persik", "bg-hutan", "bg-sage", "bg-mentega", "bg-persik",
  "bg-sage", "bg-hutan", "bg-mentega", "bg-persik", "bg-pucuk", "bg-sage",
  "bg-persik", "bg-pucuk", "bg-sage", "bg-mentega", "bg-hutan", "bg-pucuk",
];

export function Patchwork({ className, count = 24 }: { className?: string; count?: number }) {
  return (
    <div aria-hidden className={cn("grid grid-cols-6 grid-rows-4", className)}>
      {PATCHES.slice(0, count).map((c, i) => (
        <div key={i} className={cn("relative", c)}>
          <span
            className={cn(
              "absolute inset-1.5 rounded-[4px] border-[1.5px] border-dashed",
              c === "bg-hutan" ? "border-white/40" : "border-tinta/20",
            )}
          />
        </div>
      ))}
    </div>
  );
}

// Kerangka halaman masuk / daftar / status.
// HP: pita perca + formulir. Desktop (lg): panel hijau bergambar perca di kiri, formulir di kanan.
const POIN = [
  "Setoran sampah & saldo warga tercatat rapi",
  "Ide kerajinan dari AI sesuai stok bahan",
  "Kas, harga jual, dan upah perajin transparan",
];

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <aside className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-hutan p-10 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh xl:p-14">
        <Logo inverse />
        <div className="space-y-8">
          <Patchwork className="aspect-[3/2] w-full max-w-lg overflow-hidden rounded-3xl ring-4 ring-white/10" />
          <div className="max-w-lg space-y-4">
            <p className="text-3xl font-extrabold leading-tight tracking-tight text-balance xl:text-4xl">
              Dari sampah rumah tangga jadi kerajinan bernilai.
            </p>
            <ul className="space-y-2.5">
              {POIN.map((p) => (
                <li key={p} className="flex items-start gap-3 text-base text-white/90">
                  <span aria-hidden className="mt-1.5 size-3 shrink-0 rotate-45 rounded-[3px] bg-mentega" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-sm text-white/70">ADIKARA 2026 · Aplikasi untuk kelompok PKK</p>
      </aside>

      <Patchwork count={6} className="h-14 grid-rows-1 lg:hidden" />

      <div className="flex flex-col justify-center px-4 py-10 sm:px-6 sm:py-14 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <Logo className="mb-8 lg:hidden" />
          {eyebrow && (
            <span className="mb-3 inline-flex rounded-full bg-mentega px-3 py-1 text-sm font-semibold text-mentega-ink">
              {eyebrow}
            </span>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-balance text-tinta">{title}</h1>
          {description && <p className="mt-2 text-base text-muted-foreground">{description}</p>}
          <div className="mt-7 rounded-2xl border bg-card p-5 sm:p-7">{children}</div>
          {footer && <div className="mt-6 text-center text-base text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
