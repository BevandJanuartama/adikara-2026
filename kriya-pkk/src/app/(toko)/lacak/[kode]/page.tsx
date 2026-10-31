import { redirect } from "next/navigation";

// Tautan lama /lacak/<kode>?t=… → halaman Pesanan saya (wajib login sebagai pembeli)
export default async function LacakLama({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  redirect(`/akun/pesanan/${encodeURIComponent(kode)}`);
}
