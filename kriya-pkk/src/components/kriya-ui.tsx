// Komponen tampilan bersama KriyaPKK (aman dipakai di Server maupun Client Component).
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CircleAlert, ArrowLeft, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "mentega" | "pucuk" | "persik" | "sage";

const PATCH: Record<Tone, string> = {
  mentega: "bg-mentega",
  pucuk: "bg-pucuk",
  persik: "bg-persik",
  sage: "bg-sage",
};

// Kelas tombol untuk <Link> / <button> biasa (Button shadcn tetap bisa dipakai)
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-5 [&_svg]:shrink-0";
export const btn = {
  primary: cn(btnBase, "h-12 bg-hutan text-white hover:bg-tinta"),
  secondary: cn(btnBase, "h-12 bg-mentega text-tinta hover:bg-[#f6d98d]"),
  outline: cn(btnBase, "h-12 border border-input bg-card text-tinta hover:bg-daun-muda"),
  danger: cn(btnBase, "h-12 border border-bata/30 bg-bata-soft text-bata-ink hover:bg-[#f3cfc6]"),
  small: "h-10 px-3 text-sm [&_svg]:size-4",
};

export const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-3.5 text-base text-tinta shadow-none placeholder:text-muted-foreground/80 focus-visible:border-hutan";
export const labelClass = "text-sm font-semibold text-tinta";

// Judul halaman + aksi utama. Di HP aksi turun ke bawah judul.
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  back,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-muted-foreground hover:text-tinta"
          >
            <ArrowLeft className="size-4" /> {back.label}
          </Link>
        )}
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="hidden size-11 shrink-0 place-items-center rounded-xl bg-pucuk text-tinta sm:grid">
              <Icon className="size-5" />
            </span>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight text-balance text-tinta sm:text-3xl">{title}</h1>
        </div>
        {description && <p className="mt-2 max-w-2xl text-base text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

// Kartu angka berwarna pastel dengan jahitan (motif kain perca KriyaPKK)
export function StatPatch({
  tone,
  label,
  value,
  icon: Icon,
  hint,
  className,
}: {
  tone: Tone;
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("jahitan rounded-2xl p-5 text-tinta", PATCH[tone], className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        {Icon && <Icon className="size-5 shrink-0 opacity-70" aria-hidden />}
      </div>
      <p className="mt-3 text-xl font-extrabold tracking-tight tabular-nums break-words sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-sm text-tinta/80">{hint}</p>}
    </div>
  );
}

// Kotak putih dengan judul (bagian dari halaman)
export function Panel({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-daun-muda text-hutan">
                <Icon className="size-[18px]" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-lg font-bold leading-snug text-tinta">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
          {actions}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export type BadgeTone = Tone | "bata" | "netral";
const BADGE: Record<BadgeTone, string> = {
  pucuk: "bg-pucuk text-pucuk-ink",
  mentega: "bg-mentega text-mentega-ink",
  persik: "bg-persik text-persik-ink",
  sage: "bg-daun-muda text-hutan ring-1 ring-sage/60",
  bata: "bg-bata-soft text-bata-ink",
  netral: "bg-muted text-muted-foreground",
};

export function Badge({
  tone = "netral",
  icon: Icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-semibold leading-none",
        BADGE[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

const NOTICE = {
  info: { cls: "bg-daun-muda text-tinta", icon: Info },
  success: { cls: "bg-pucuk/60 text-pucuk-ink", icon: CircleCheck },
  warning: { cls: "bg-mentega text-mentega-ink", icon: TriangleAlert },
  error: { cls: "bg-bata-soft text-bata-ink", icon: CircleAlert },
} as const;

export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof NOTICE;
  children: React.ReactNode;
  className?: string;
}) {
  const { cls, icon: Icon } = NOTICE[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-xl px-4 py-3 text-base", cls, className)}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  text?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center", className)}>
      <span className="grid size-12 place-items-center rounded-full bg-daun-muda text-hutan">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="mt-3 text-lg font-bold text-tinta">{title}</p>
      {text && <p className="mt-1 max-w-sm text-base text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// Baris "label ........ nilai" untuk rincian biaya & laporan
export function MoneyRow({
  label,
  value,
  strong = false,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2", strong ? "text-lg font-bold text-tinta" : "text-base", className)}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="shrink-0 font-semibold tabular-nums text-tinta">{value}</span>
    </div>
  );
}
