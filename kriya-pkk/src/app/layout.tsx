import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

// Plus Jakarta Sans: huruf buatan foundry Indonesia (Tokotype), ramah dan mudah dibaca
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KriyaPKK",
  description: "Ekosistem digital pengelolaan sampah anorganik & ekonomi kreatif berbasis AI untuk kelompok PKK",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3E5E35",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={cn("font-sans", jakarta.variable)}>
      {/* NFR11: huruf minimal 16px, kontras tinggi */}
      <body className="bg-background text-base text-foreground antialiased">{children}</body>
    </html>
  );
}
