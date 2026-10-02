import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "EtuCuisto", template: "%s | EtuCuisto" },
  description:
    "Vide ton frigo : des recettes rapides avec ce que tu as déjà, pensées pour les cuisines d'étudiants.",
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col pb-20">
        <AppHeader />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
