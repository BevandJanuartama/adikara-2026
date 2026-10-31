import Link from "next/link";
import type { Metadata } from "next";
import { Store, UserX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requirePembeli } from "@/lib/auth";
import { logoutToko } from "@/lib/actions/auth";
import { btn, EmptyState } from "@/components/kriya-ui";
import { formatHp } from "@/lib/marketplace/wa";
import type { PoskoToko } from "@/lib/marketplace/types";
import { midtransProduksi } from "@/lib/marketplace/midtrans-mode";
import { CheckoutForm, type AlamatTerakhir } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout · KriyaPKK" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ posko?: string }> }) {
  const slug = (await searchParams).posko ?? "";
  // Wajib login sebagai pembeli; belum login → halaman masuk lalu kembali ke sini
  const me = await requirePembeli(`/checkout?posko=${encodeURIComponent(slug)}`);
  if (!me) {
    return (
      <EmptyState
        icon={UserX}
        title="Checkout khusus akun pembeli"
        text="Anda masuk sebagai pengurus/perajin/admin. Keluar dulu, lalu masuk atau daftar dengan akun pembeli."
        action={
          <form action={logoutToko}>
            <button type="submit" className={btn.primary}>Keluar</button>
          </form>
        }
      />
    );
  }

  const supabase = await createClient();
  const [{ data }, { data: terakhir }] = await Promise.all([
    slug ? supabase.rpc("katalog_posko", { p_slug: slug }) : Promise.resolve({ data: null }),
    // alamat pengiriman terakhir pembeli ini (untuk mengisi otomatis)
    supabase
      .from("orders")
      .select("address, buyer_city, buyer_postal_code, buyer_lat, buyer_lng")
      .eq("shipping_method", "kurir")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const posko = data as PoskoToko | null;

  if (!posko) {
    return (
      <EmptyState
        icon={Store}
        title="Posko tidak ditemukan"
        text="Toko posko ini sedang tutup atau tautannya salah. Kembali ke keranjang untuk memilih posko."
        action={<Link href="/keranjang" className={btn.primary}>Kembali ke keranjang</Link>}
      />
    );
  }

  const alamat: AlamatTerakhir = terakhir?.address
    ? {
        alamat: terakhir.address,
        kota: terakhir.buyer_city ?? "",
        kodePos: terakhir.buyer_postal_code ?? "",
        titik: terakhir.buyer_lat != null && terakhir.buyer_lng != null ? { lat: terakhir.buyer_lat, lng: terakhir.buyer_lng } : null,
      }
    : null;

  return (
    <CheckoutForm
      posko={posko}
      snap={{ clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "", produksi: midtransProduksi() }}
      pembeli={{ nama: me.fullName, hp: me.phone ? formatHp(me.phone).replace(/-/g, "") : "", email: me.email }}
      alamatTerakhir={alamat}
    />
  );
}
