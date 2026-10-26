import type { MetadataRoute } from "next";

// PWA: pengguna bisa "Tambahkan ke layar utama" di HP
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KriyaPKK",
    short_name: "KriyaPKK",
    description: "Kasir setoran sampah & penasihat produksi kerajinan untuk PKK",
    start_url: "/beranda",
    display: "standalone",
    background_color: "#F7F8F2",
    theme_color: "#3E5E35",
    lang: "id",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
