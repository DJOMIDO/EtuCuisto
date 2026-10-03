import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { GuestDataSync } from "@/components/account/GuestDataSync";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PopoverPolyfill } from "@/components/PopoverPolyfill";
import { isTheme, THEME_COOKIE } from "@/i18n/locales";
import "./globals.css";

// Police arrondie, proche du logo.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: "EtuCuisto", template: "%s | EtuCuisto" },
    description: t("description"),
    icons: { icon: "/logo.svg", apple: "/icons/app/apple-touch-icon.png" },
    appleWebApp: { title: "EtuCuisto", statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  // Nécessaire pour que env(safe-area-inset-*) renvoie la place de la barre d'accueil iOS.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#141312" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  // Thème choisi sur cet appareil, appliqué dès le rendu serveur (pas de flash).
  const themeCookie = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isTheme(themeCookie) ? themeCookie : "system";

  return (
    <html lang={locale} data-theme={theme} className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col pb-[calc(env(safe-area-inset-bottom)+7rem)]">
        <NextIntlClientProvider>
          <PopoverPolyfill />
          <GuestDataSync />
          <AppHeader />
          {children}
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
