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

// Libellés affichés : messages/*.json → « categories ».
export const CATEGORIES: { id: CategoryId; examples: string }[] = [
  { id: "legume", examples: "courgette, tomate, carotte, poivron, salade, champignon, brocoli, épinard, maïs" },
  { id: "fruit", examples: "pomme, banane, citron, orange, avocat, fraise, kiwi" },
  { id: "viande", examples: "poulet, bœuf, steak haché, jambon, lardons, saucisse, dinde" },
  { id: "poisson", examples: "thon, saumon, sardine, crevette, cabillaud, surimi" },
  { id: "laitier", examples: "œuf, lait, yaourt, fromage, gruyère râpé, beurre, crème fraîche, mozzarella" },
  { id: "feculent", examples: "pâtes, riz, pain, baguette, pomme de terre, semoule, quinoa, lentilles, pois chiches, farine" },
  { id: "condiment", examples: "sauce tomate, sauce soja, moutarde, mayonnaise, ketchup, pesto, huile, vinaigre, bouillon" },
  { id: "epice", examples: "sel, poivre, paprika, curry, cumin, ail, oignon, échalote, gingembre, basilic, persil" },
  { id: "autre", examples: "sucre, chocolat, biscuits, céréales, miel, confiture" },
];
