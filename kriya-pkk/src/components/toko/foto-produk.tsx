import { cn } from "@/lib/utils";
import { fotoProdukUrl } from "@/lib/marketplace/foto";
import { infoKategori } from "@/lib/marketplace/kategori";

const LATAR = { mentega: "bg-mentega", pucuk: "bg-pucuk", persik: "bg-persik", sage: "bg-sage" } as const;

// Foto produk; bila belum ada foto, tampil tambalan warna kategori dengan ikon
export function FotoProduk({
  path,
  name,
  category,
  className,
  ikonClass = "size-10",
}: {
  path: string | null | undefined;
  name: string;
  category: string;
  className?: string;
  ikonClass?: string;
}) {
  const url = fotoProdukUrl(path);
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} loading="lazy" className={cn("size-full object-cover", className)} />;
  }
  const k = infoKategori(category);
  const Icon = k.icon;
  return (
    <div role="img" aria-label={name} className={cn("relative grid size-full place-items-center", LATAR[k.tone], className)}>
      <span aria-hidden className="absolute inset-2 rounded-[inherit] border-[1.5px] border-dashed border-tinta/20" />
      <Icon className={cn("text-tinta/55", ikonClass)} aria-hidden />
    </div>
  );
}
