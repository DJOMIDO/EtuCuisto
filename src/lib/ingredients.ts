import ingredients from "@/data/ingredients.json";

export type CategoryId =
  | "viande"
  | "poisson"
  | "legume"
  | "fruit"
  | "laitier"
  | "feculent"
  | "condiment"
  | "epice"
  | "autre";

export type Ingredient = { id: string; label: string; category: CategoryId };

// Ordre et libellés repris du formulaire d'origine (legacy/Scripts/accueil.html).
export const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: "viande", label: "Viandes", icon: "/icons/categories/viande.svg" },
  { id: "poisson", label: "Poissons", icon: "/icons/categories/poisson.svg" },
  { id: "legume", label: "Légumes", icon: "/icons/categories/legume.svg" },
  { id: "fruit", label: "Fruits", icon: "/icons/categories/fruit.svg" },
  { id: "laitier", label: "Produits laitiers", icon: "/icons/categories/laitier.svg" },
  { id: "feculent", label: "Féculents", icon: "/icons/categories/feculent.svg" },
  { id: "condiment", label: "Condiments", icon: "/icons/categories/condiment.svg" },
  { id: "epice", label: "Épices et herbes", icon: "/icons/categories/epice.svg" },
  { id: "autre", label: "Autres", icon: "/icons/categories/autre.svg" },
];

export const INGREDIENTS = ingredients as Ingredient[];
