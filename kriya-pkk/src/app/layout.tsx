import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "KriyaPKK",
  description: "Ekosistem digital pengelolaan sampah anorganik & ekonomi kreatif berbasis AI untuk kelompok PKK",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#166534",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={cn("font-sans", inter.variable)}>
      {/* NFR11: huruf minimal 16px, kontras tinggi */}
      <body className="bg-background text-base text-foreground antialiased">{children}</body>
    </html>
  );
}
