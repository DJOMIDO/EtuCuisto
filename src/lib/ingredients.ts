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
export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "viande", label: "Viandes" },
  { id: "poisson", label: "Poissons" },
  { id: "legume", label: "Légumes" },
  { id: "fruit", label: "Fruits" },
  { id: "laitier", label: "Produits laitiers" },
  { id: "feculent", label: "Féculents" },
  { id: "condiment", label: "Condiments" },
  { id: "epice", label: "Épices et herbes" },
  { id: "autre", label: "Autres" },
];

export const INGREDIENTS = ingredients as Ingredient[];

/** « Œufs », « oeuf », « tomate » → même clé : sans accents, sans pluriel. */
function normalize(name: string) {
  return name
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/[sx]$/, "");
}

const BY_KEY = new Map(INGREDIENTS.flatMap((i) => [[normalize(i.id), i], [normalize(i.label), i]]));

/** Retrouve un ingrédient de la liste d'origine, ou undefined. */
export function findIngredient(name: string): Ingredient | undefined {
  return BY_KEY.get(normalize(name));
}
