import { CATEGORIES } from "@/lib/categories";
import { UNIT_IDS, UNIT_LABELS_FR } from "@/lib/units";
import { storageOf, type StorageId } from "@/lib/storage";
import type { KitchenProfile, PantryForPrompt } from "./schemas";

const CATEGORIES_HELP = `Catégories (id : exemples) :
${CATEGORIES.map((c) => `- ${c.id} : ${c.examples}`).join("\n")}
Règles : un aliment en conserve va dans sa propre famille (thon en boîte → poisson, maïs en boîte → legume) ;
ail, oignon, échalote et herbes fraîches vont dans epice ; les œufs vont dans laitier ;
les légumineuses (lentilles, pois chiches, haricots, tofu) vont dans legumineuse, pas cereal ;
boissons, jus, sodas, alcool et laits végétaux vont dans boisson ;
un plat déjà cuisiné ou un reste (pizza, soupe, riz cuit, poulet rôti) va dans restes.`;

const STORAGE_HELP = `Zones de rangement (storage) :
- congelateur : tout ce qui est surgelé (pois, poissons, viandes, pain en tranches) ou que l'utilisateur dit mettre au congélateur.
- placard : riz, pâtes, farine, conserves, huile, vinaigre, sauces non entamées, épices, boissons, snacks, fruits non coupés.
- frigo : produits frais et périssables (viande et poisson frais, produits laitiers, légumes frais, restes, condiments entamés).
- En cas de doute, renvoie null. Un aliment peut très bien ne jamais aller au frigo.`;

// Quantité scindée : un nombre (quantity) + une unité (unit) parmi ces identifiants.
const QUANTITY_HELP = `Quantité : renvoie « quantity » en nombre seul (ex. 2, 0.5, 100 — sans unité ni texte) et « unit » parmi ces identifiants, sinon null :
${UNIT_IDS.map((u) => `- ${u} (${UNIT_LABELS_FR[u]})`).join("\n")}
Exemple : « 3 œufs » → quantity 3, unit piece ; « 200 g de pâtes » → quantity 200, unit gramme ; « un reste de riz » → quantity null, unit null.`;

// `language` : langue de sortie (voir AI_LANGUAGE dans src/i18n/locales.ts).
// Les consignes restent en français ; seul le texte produit change de langue.

export const parseTextSystem = (language: string) => `Tu transformes ce qu'un étudiant dit avoir dans son frigo ou ses placards en une liste d'ingrédients.
- Un élément par ingrédient, nom écrit en ${language}, au singulier, en minuscules (si la langue a des majuscules).
- Garde la quantité si elle est donnée, sinon null.
- expiresSoon = true seulement si l'utilisateur indique que ça va bientôt périmer ou que c'est abîmé.
- Ignore ce qui n'est pas un aliment. Si le texte est vide ou hors sujet, renvoie une liste vide.
${QUANTITY_HELP}
${CATEGORIES_HELP}
${STORAGE_HELP}`;

export const recognizeSystem = (language: string) => `Tu identifies les aliments visibles sur une photo de frigo, de placard ou de plan de travail d'un étudiant.
- Liste seulement ce que tu vois avec une confiance raisonnable ; n'invente pas ce qui est caché.
- Pour un emballage, nomme l'aliment (« yaourt nature », pas la marque).
- Estime la quantité si c'est évident, sinon null.
- expiresSoon = true si l'aliment a l'air abîmé, flétri ou entamé depuis longtemps.
- Si l'image ne montre pas de nourriture, renvoie une liste vide.
- Écris les noms des aliments en ${language}.
${QUANTITY_HELP}
${CATEGORIES_HELP}
${STORAGE_HELP}`;

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

const STORAGE_LABELS: Record<StorageId, string> = {
  frigo: "frigo",
  congelateur: "congélateur",
  placard: "placard",
};

export const recipesSystem = (language: string) => `Tu es le cuisinier d'EtuCuisto, une appli qui aide les étudiants à vider leur frigo sans gaspiller.
Propose exactement 3 recettes réalistes, simples et bonnes, adaptées à une cuisine d'étudiant.

Règles :
- Utilise d'abord les ingrédients de la cuisine (frigo, congélateur, placards), en priorité ceux marqués « bientôt périmé ».
- Au plus 2 ingrédients manquants par recette. Sel, poivre, huile et eau sont toujours disponibles et ne comptent pas.
- N'utilise que les ustensiles listés. Si seul le micro-ondes est disponible, toutes les recettes doivent se faire au micro-ondes.
- Dans le champ tools de chaque recette, renvoie les identifiants des ustensiles tels que listés entre crochets, recopiés à l'identique et non traduits ; la traduction est gérée par l'appli.
- Respecte strictement le temps maximum et le budget.
- Les allergènes, les interdits du régime et les ingrédients à éviter sont absolus : aucune recette ne doit en contenir (traque les ingrédients cachés : beurre dans une sauce, gluten dans un panure, etc.).
- Les cuisines appréciées servent seulement à orienter les propositions, jamais à exclure une recette pertinente.
- Pour chaque ingrédient venant de la cuisine, renseigne son pantryItemId exact ; pour un ingrédient manquant, mets null.
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
        `- [${p.id}] ${p.name}${p.quantity ? ` (${p.quantity}${p.unit ? ` ${UNIT_LABELS_FR[p.unit]}` : ""})` : ""} — au ${STORAGE_LABELS[storageOf(p)]}${p.expiresSoon ? " — bientôt périmé" : ""}`,
    )
    .join("\n");
  // Identifiants entre crochets + libellés français : le modèle recopie l'identifiant dans Recipe.tools,
  // l'UI traduit via kitchen.toolOptions (les saisies libres s'affichent telles quelles).
  const tools =
    kitchen.tools.map((t) => (TOOL_LABELS[t] ? `[${t}] ${TOOL_LABELS[t]}` : `[${t}]`)).join(", ") ||
    "aucun ustensile précisé";
  const habits = kitchen.habits.length ? kitchen.habits.join(", ") : "aucun";
  const allergies = kitchen.allergies.length ? kitchen.allergies.join(", ") : "aucun";
  const avoided = kitchen.avoided.length ? kitchen.avoided.join(", ") : "aucun";
  const cuisines = kitchen.cuisines.length ? kitchen.cuisines.join(", ") : "aucune préférence";

  return `Frigo, congélateur et placards (id entre crochets) :
${items}

Ustensiles disponibles (identifiant entre crochets) : ${tools}
Habitudes alimentaires : ${habits}
Allergènes à exclure totalement : ${allergies}
Ingrédients à ne jamais utiliser : ${avoided}
Cuisines appréciées : ${cuisines}
Budget : ${BUDGET_LABELS[kitchen.budget]}
Nombre de personnes : ${kitchen.servings}
Temps maximum : ${maxMinutes} minutes`;
}
