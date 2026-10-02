import type { Metadata } from "next";
import { RecipesPage } from "@/components/recipes/RecipesPage";

export const metadata: Metadata = { title: "Recettes" };

export default function Recettes() {
  return <RecipesPage />;
}
