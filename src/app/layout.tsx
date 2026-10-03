import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { GuestDataSync } from "@/components/account/GuestDataSync";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PopoverPolyfill } from "@/components/PopoverPolyfill";
import "./globals.css";

// Police arrondie, proche du logo.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "EtuCuisto", template: "%s | EtuCuisto" },
  description:
    "Vide ton frigo : des recettes rapides avec ce que tu as déjà, pensées pour les cuisines d'étudiants.",
  icons: { icon: "/logo.svg", apple: "/icons/app/apple-touch-icon.png" },
  appleWebApp: { title: "EtuCuisto", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  // Nécessaire pour que env(safe-area-inset-*) renvoie la place de la barre d'accueil iOS.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#141312" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col pb-[calc(env(safe-area-inset-bottom)+7rem)]">
        <PopoverPolyfill />
        <GuestDataSync />
        <AppHeader />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
