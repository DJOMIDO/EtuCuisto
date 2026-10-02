import type { BUDGET_IDS, DIET_IDS, TOOL_IDS } from "@/lib/ai/schemas";

type Option<T extends string> = { id: T; label: string; hint?: string };

export const TOOL_OPTIONS: Option<(typeof TOOL_IDS)[number]>[] = [
  { id: "micro-ondes", label: "Micro-ondes" },
  { id: "plaque", label: "Plaque de cuisson" },
  { id: "four", label: "Four" },
  { id: "casserole", label: "Casserole" },
  { id: "poele", label: "Poêle" },
  { id: "bouilloire", label: "Bouilloire" },
  { id: "cuiseur-riz", label: "Cuiseur à riz" },
  { id: "friteuse-air", label: "Friteuse à air" },
  { id: "mixeur", label: "Mixeur" },
];

export const BUDGET_OPTIONS: Option<(typeof BUDGET_IDS)[number]>[] = [
  { id: "tres-serre", label: "Très serré", hint: "Rien à acheter si possible, sinon moins de 2 €" },
  { id: "serre", label: "Serré", hint: "Moins de 4 € d'achats par recette" },
  { id: "normal", label: "Normal", hint: "Jusqu'à 8 € d'achats par recette" },
];

export const DIET_OPTIONS: Option<(typeof DIET_IDS)[number]>[] = [
  { id: "vegetarien", label: "Végétarien" },
  { id: "vegan", label: "Vegan" },
  { id: "halal", label: "Halal" },
  { id: "sans-porc", label: "Sans porc" },
  { id: "sans-gluten", label: "Sans gluten" },
  { id: "sans-lactose", label: "Sans lactose" },
];
