import type { Metadata } from "next";
import { KeranjangView } from "./keranjang-view";

export const metadata: Metadata = { title: "Keranjang · KriyaPKK" };

export default function KeranjangPage() {
  return <KeranjangView />;
}
