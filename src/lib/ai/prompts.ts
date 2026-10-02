import type { KitchenProfile, PantryForPrompt } from "./schemas";

const CATEGORIES_HELP =
  "Catégories : viande, poisson, legume, fruit, laitier (dont œufs), feculent (pâtes, riz, pain, pommes de terre, semoule…), condiment (sauces, conserves de tomate…), epice (épices et herbes), autre.";

export const PARSE_TEXT_SYSTEM = `Tu transformes ce qu'un étudiant dit avoir dans son frigo ou ses placards en une liste d'ingrédients.
- Un élément par ingrédient, nom en français, au singulier, en minuscules.
- Garde la quantité si elle est donnée, sinon null.
- expiresSoon = true seulement si l'utilisateur indique que ça va bientôt périmer ou que c'est abîmé.
- Ignore ce qui n'est pas un aliment. Si le texte est vide ou hors sujet, renvoie une liste vide.
${CATEGORIES_HELP}`;

export const RECOGNIZE_SYSTEM = `Tu identifies les aliments visibles sur une photo de frigo, de placard ou de plan de travail d'un étudiant.
- Liste seulement ce que tu vois avec une confiance raisonnable ; n'invente pas ce qui est caché.
- Pour un emballage, nomme l'aliment (« yaourt nature », pas la marque).
- Estime la quantité si c'est évident (« 3 », « 1/2 bouteille »), sinon null.
- expiresSoon = true si l'aliment a l'air abîmé, flétri ou entamé depuis longtemps.
- Si l'image ne montre pas de nourriture, renvoie une liste vide.
${CATEGORIES_HELP}`;

const TOOL_LABELS: Record<string, string> = {
  "micro-ondes": "micro-ondes",
  plaque: "une plaque de cuisson",
  four: "un four",
  casserole: "une casserole",
  poele: "une poêle",
  bouilloire: "une bouilloire",
  "cuiseur-riz": "un cuiseur à riz",
  "friteuse-air": "une friteuse à air",
  mixeur: "un mixeur",
};

const BUDGET_LABELS: Record<string, string> = {
  "tres-serre": "très serré : aucun achat si possible, sinon moins de 2 € au total",
  serre: "serré : moins de 4 € d'achats au total",
  normal: "normal : jusqu'à 8 € d'achats",
};

export const RECIPES_SYSTEM = `Tu es le cuisinier d'EtuCuisto, une appli qui aide les étudiants à vider leur frigo sans gaspiller.
Propose exactement 3 recettes réalistes, simples et bonnes, adaptées à une cuisine d'étudiant.

Règles :
- Utilise d'abord les ingrédients du frigo, en priorité ceux marqués « bientôt périmé ».
- Au plus 2 ingrédients manquants par recette. Sel, poivre, huile et eau sont toujours disponibles et ne comptent pas.
- N'utilise que les ustensiles listés. Si seul le micro-ondes est disponible, toutes les recettes doivent se faire au micro-ondes.
- Respecte strictement le temps maximum, le régime alimentaire et le budget.
- Pour chaque ingrédient venant du frigo, renseigne son pantryItemId exact ; pour un ingrédient manquant, mets null.
- Étapes courtes et concrètes (5 à 8 en général), compréhensibles par quelqu'un qui cuisine rarement.
- Les 3 recettes doivent être vraiment différentes (pas trois variantes de pâtes).
- Écris en français.`;

export function recipesUserPrompt(
  pantry: PantryForPrompt,
  kitchen: KitchenProfile,
  maxMinutes: number,
) {
  const items = pantry
    .map(
      (p) =>
        `- [${p.id}] ${p.name}${p.quantity ? ` (${p.quantity})` : ""}${p.expiresSoon ? " — bientôt périmé" : ""}`,
    )
    .join("\n");
  const tools = kitchen.tools.map((t) => TOOL_LABELS[t]).join(", ") || "aucun ustensile précisé";
  const diet = kitchen.diet.length ? kitchen.diet.join(", ") : "aucune restriction";

  return `Frigo et placards (id entre crochets) :
${items}

Ustensiles disponibles : ${tools}
Régime : ${diet}
Budget : ${BUDGET_LABELS[kitchen.budget]}
Nombre de personnes : ${kitchen.servings}
Temps maximum : ${maxMinutes} minutes`;
}
