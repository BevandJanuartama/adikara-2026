import Link from "next/link";
import type { Metadata } from "next";
import { Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { btn, EmptyState } from "@/components/kriya-ui";
import type { PoskoToko } from "@/lib/marketplace/types";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout · KriyaPKK" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ posko?: string }> }) {
  const slug = (await searchParams).posko ?? "";
  const supabase = await createClient();
  const { data } = slug ? await supabase.rpc("katalog_posko", { p_slug: slug }) : { data: null };
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

  return <CheckoutForm posko={posko} clientKey={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""} />;
}
