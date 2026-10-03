import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RecipesPage } from "@/components/recipes/RecipesPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("recipes") };
}

export default function Recettes() {
  return <RecipesPage />;
}
