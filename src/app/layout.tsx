import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getAllSettings } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  let brandName = "PalpiAuto";
  let icons: Metadata["icons"];
  try {
    const settings = await getAllSettings();
    brandName = settings.company_name?.trim() || settings.brand_name || "PalpiAuto";
    // On ignore les vieux favicons en base64 (lourds, cassent le <head>) : re-upload requis.
    const faviconRaw = settings.favicon_url?.trim();
    if (faviconRaw && !faviconRaw.startsWith("data:")) {
      icons = { icon: [{ url: faviconRaw }] };
    }
  } catch {
    // Build sans base (ex : DATABASE_URL locale absente) : métadonnées par défaut.
  }
  return {
    title: `${brandName} — Commandez votre pièce détachée`,
    description: `${brandName} à Palaiseau : demandez votre pièce détachée auto. Réponse rapide par téléphone ou WhatsApp.`,
    icons,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


