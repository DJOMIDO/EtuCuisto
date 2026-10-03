// Familles d'ingrédients, pensées pour un frigo d'étudiant (et non plus reprises du
// formulaire de 2022). Les exemples servent à la fois au prompt de l'IA et au mode mock.

export type CategoryId =
  | "legume"
  | "fruit"
  | "viande"
  | "poisson"
  | "laitier"
  | "feculent"
  | "condiment"
  | "epice"
  | "autre";

export const CATEGORIES: { id: CategoryId; label: string; examples: string }[] = [
  { id: "legume", label: "Légumes", examples: "courgette, tomate, carotte, poivron, salade, champignon, brocoli, épinard, maïs" },
  { id: "fruit", label: "Fruits", examples: "pomme, banane, citron, orange, avocat, fraise, kiwi" },
  { id: "viande", label: "Viandes", examples: "poulet, bœuf, steak haché, jambon, lardons, saucisse, dinde" },
  { id: "poisson", label: "Poissons & fruits de mer", examples: "thon, saumon, sardine, crevette, cabillaud, surimi" },
  { id: "laitier", label: "Œufs & produits laitiers", examples: "œuf, lait, yaourt, fromage, gruyère râpé, beurre, crème fraîche, mozzarella" },
  { id: "feculent", label: "Féculents & pain", examples: "pâtes, riz, pain, baguette, pomme de terre, semoule, quinoa, lentilles, pois chiches, farine" },
  { id: "condiment", label: "Sauces & condiments", examples: "sauce tomate, sauce soja, moutarde, mayonnaise, ketchup, pesto, huile, vinaigre, bouillon" },
  { id: "epice", label: "Épices & aromates", examples: "sel, poivre, paprika, curry, cumin, ail, oignon, échalote, gingembre, basilic, persil" },
  { id: "autre", label: "Autres", examples: "sucre, chocolat, biscuits, céréales, miel, confiture" },
];

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<CategoryId, string>;
