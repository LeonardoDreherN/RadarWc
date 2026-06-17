import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RadarWC",
  description: "Análise inteligente para apostas na Copa do Mundo 2026",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/app.png",
    apple: "/icons/app.png",
    shortcut: "/icons/app.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RadarWC",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="min-h-full text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
