// Familles d'ingrédients, pensées pour un frigo d'étudiant (et non plus reprises du
// formulaire de 2022). Les exemples servent à la fois au prompt de l'IA et au mode mock.

export type CategoryId =
  | "legume"
  | "fruit"
  | "viande"
  | "poisson"
  | "laitier"
  | "cereal"
  | "legumineuse"
  | "condiment"
  | "epice"
  | "boisson"
  | "sucrerie"
  | "restes"
  | "autre";

// Libellés affichés : messages/*.json → « categories ».
export const CATEGORIES: { id: CategoryId; examples: string }[] = [
  { id: "legume", examples: "courgette, tomate, carotte, poivron, salade, champignon, brocoli, épinard, maïs" },
  { id: "fruit", examples: "pomme, banane, citron, orange, avocat, fraise, kiwi" },
  { id: "viande", examples: "poulet, bœuf, steak haché, jambon, lardons, saucisse, dinde" },
  { id: "poisson", examples: "thon, saumon, sardine, crevette, cabillaud, surimi" },
  { id: "laitier", examples: "œuf, lait, yaourt, fromage, gruyère râpé, beurre, crème fraîche, mozzarella" },
  { id: "cereal", examples: "pâtes, riz, pain, baguette, pomme de terre, semoule, quinoa, farine, flocons d'avoine" },
  { id: "legumineuse", examples: "lentilles, pois chiches, haricots rouges, haricots blancs, tofu, tempeh, edamame" },
  { id: "condiment", examples: "sauce tomate, sauce soja, moutarde, mayonnaise, ketchup, pesto, huile, vinaigre, bouillon" },
  { id: "epice", examples: "sel, poivre, paprika, curry, cumin, ail, oignon, échalote, gingembre, basilic, persil" },
  { id: "boisson", examples: "eau, jus d'orange, soda, bière, vin, café, thé, lait végétal" },
  { id: "sucrerie", examples: "sucre, chocolat, biscuits, bonbons, miel, confiture, céréales sucrées" },
  { id: "restes", examples: "plat cuisiné, reste de pâtes, riz cuit, soupe, gratin, pizza, poulet rôti, casserole de la veille" },
  { id: "autre", examples: "ingrédient difficile à classer" },
];

// Anciennes familles → familles actuelles, pour les données déjà stockées côté client
// (localStorage invité) ou en base avant la migration 0003.
const LEGACY_CATEGORY_MAP: Record<string, CategoryId> = {
  feculent: "cereal",
};

// Ramène n'importe quelle valeur stockée à une CategoryId valide (inconnue → « autre »).
export function normalizeCategory(value: string): CategoryId {
  if (value in LEGACY_CATEGORY_MAP) return LEGACY_CATEGORY_MAP[value];
  return CATEGORIES.some((c) => c.id === value) ? (value as CategoryId) : "autre";
}
