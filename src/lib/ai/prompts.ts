import { CATEGORIES } from "@/lib/categories";
import type { KitchenProfile, PantryForPrompt } from "./schemas";

const CATEGORIES_HELP = `Catégories (id : exemples) :
${CATEGORIES.map((c) => `- ${c.id} : ${c.examples}`).join("\n")}
Règles : un aliment en conserve va dans sa propre famille (thon en boîte → poisson, maïs en boîte → legume) ;
ail, oignon, échalote et herbes fraîches vont dans epice ; les œufs vont dans laitier.`;

// `language` : langue de sortie (voir AI_LANGUAGE dans src/i18n/locales.ts).
// Les consignes restent en français ; seul le texte produit change de langue.

export const parseTextSystem = (language: string) => `Tu transformes ce qu'un étudiant dit avoir dans son frigo ou ses placards en une liste d'ingrédients.
- Un élément par ingrédient, nom écrit en ${language}, au singulier, en minuscules (si la langue a des majuscules).
- Garde la quantité si elle est donnée, sinon null.
- expiresSoon = true seulement si l'utilisateur indique que ça va bientôt périmer ou que c'est abîmé.
- Ignore ce qui n'est pas un aliment. Si le texte est vide ou hors sujet, renvoie une liste vide.
${CATEGORIES_HELP}`;

export const recognizeSystem = (language: string) => `Tu identifies les aliments visibles sur une photo de frigo, de placard ou de plan de travail d'un étudiant.
- Liste seulement ce que tu vois avec une confiance raisonnable ; n'invente pas ce qui est caché.
- Pour un emballage, nomme l'aliment (« yaourt nature », pas la marque).
- Estime la quantité si c'est évident (« 3 », « 1/2 bouteille »), sinon null.
- expiresSoon = true si l'aliment a l'air abîmé, flétri ou entamé depuis longtemps.
- Si l'image ne montre pas de nourriture, renvoie une liste vide.
- Écris les noms des aliments en ${language}.
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

export const recipesSystem = (language: string) => `Tu es le cuisinier d'EtuCuisto, une appli qui aide les étudiants à vider leur frigo sans gaspiller.
Propose exactement 3 recettes réalistes, simples et bonnes, adaptées à une cuisine d'étudiant.

Règles :
- Utilise d'abord les ingrédients du frigo, en priorité ceux marqués « bientôt périmé ».
- Au plus 2 ingrédients manquants par recette. Sel, poivre, huile et eau sont toujours disponibles et ne comptent pas.
- N'utilise que les ustensiles listés. Si seul le micro-ondes est disponible, toutes les recettes doivent se faire au micro-ondes.
- Respecte strictement le temps maximum, le régime alimentaire et le budget.
- Pour chaque ingrédient venant du frigo, renseigne son pantryItemId exact ; pour un ingrédient manquant, mets null.
- Étapes courtes et concrètes (5 à 8 en général), compréhensibles par quelqu'un qui cuisine rarement.
- Les 3 recettes doivent être vraiment différentes (pas trois variantes de pâtes).
- Écris tout le texte (titre, résumé, ingrédients, étapes) en ${language}.`;

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
