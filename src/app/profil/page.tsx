import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { ProfilePage } from "@/components/account/ProfilePage";
import { isTheme, THEME_COOKIE } from "@/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("profile") };
}

export default async function Profil() {
  const theme = (await cookies()).get(THEME_COOKIE)?.value;
  return <ProfilePage initialTheme={isTheme(theme) ? theme : "system"} />;
}
