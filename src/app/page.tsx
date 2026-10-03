import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FridgePage } from "@/components/fridge/FridgePage";

// Le modèle « %s | EtuCuisto » du layout ne s'applique pas à la page racine.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: { absolute: `${t("fridge")} | EtuCuisto` } };
}

export default function Home() {
  return <FridgePage />;
}
