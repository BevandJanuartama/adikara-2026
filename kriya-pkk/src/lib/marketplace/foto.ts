// Foto produk disimpan di bucket publik "produk" (path: <group_id>/<nama>.jpg)
export const BUCKET_PRODUK = "produk";

export function fotoProdukUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_PRODUK}/${path}`;
}
