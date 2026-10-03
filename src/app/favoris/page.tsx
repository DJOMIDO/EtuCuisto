import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FavoritesPage } from "@/components/recipes/FavoritesPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("favorites") };
}

export default function Favoris() {
  return <FavoritesPage />;
}
