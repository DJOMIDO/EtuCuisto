import type { Metadata } from "next";
import { FavoritesPage } from "@/components/recipes/FavoritesPage";

export const metadata: Metadata = { title: "Mes recettes" };

export default function Favoris() {
  return <FavoritesPage />;
}
