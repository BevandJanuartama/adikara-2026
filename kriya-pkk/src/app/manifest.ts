import type { MetadataRoute } from "next";

// PWA: pengguna bisa "Tambahkan ke layar utama" di HP
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KriyaPKK",
    short_name: "KriyaPKK",
    description: "Kasir setoran sampah & penasihat produksi kerajinan untuk PKK",
    start_url: "/beranda",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#166534",
    lang: "id",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
