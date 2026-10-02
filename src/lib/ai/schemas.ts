import { z } from "zod";

export const CATEGORY_IDS = [
  "viande",
  "poisson",
  "legume",
  "fruit",
  "laitier",
  "feculent",
  "condiment",
  "epice",
  "autre",
] as const;

export const TOOL_IDS = [
  "micro-ondes",
  "plaque",
  "four",
  "casserole",
  "poele",
  "bouilloire",
  "cuiseur-riz",
  "friteuse-air",
  "mixeur",
] as const;

export const BUDGET_IDS = ["tres-serre", "serre", "normal"] as const;

export const DIET_IDS = [
  "vegetarien",
  "vegan",
  "halal",
  "sans-porc",
  "sans-gluten",
  "sans-lactose",
] as const;

// --- Entrées utilisateur -------------------------------------------------

export const PantryItemInput = z.object({
  name: z.string().trim().min(1).max(80),
  quantity: z.string().trim().max(40).nullable(),
  category: z.enum(CATEGORY_IDS),
  expiresSoon: z.boolean(),
});
export type PantryItemInput = z.infer<typeof PantryItemInput>;

export const KitchenProfile = z.object({
  tools: z.array(z.enum(TOOL_IDS)).max(TOOL_IDS.length),
  budget: z.enum(BUDGET_IDS),
  diet: z.array(z.enum(DIET_IDS)).max(DIET_IDS.length),
  servings: z.number().int().min(1).max(8),
});
export type KitchenProfile = z.infer<typeof KitchenProfile>;

export const DEFAULT_KITCHEN: KitchenProfile = {
  tools: ["plaque", "casserole", "poele"],
  budget: "serre",
  diet: [],
  servings: 1,
};

// --- Sorties de Claude ---------------------------------------------------

export const ParsedIngredients = z.object({
  items: z.array(
    z.object({
      name: z.string().describe("Nom de l'ingrédient en français, au singulier, en minuscules"),
      quantity: z.string().nullable().describe("Quantité telle que comprise, ex. « 2 », « 1/2 paquet », ou null"),
      category: z.enum(CATEGORY_IDS),
      expiresSoon: z.boolean().describe("Vrai si l'utilisateur dit que ça va bientôt périmer, ou si c'est visiblement abîmé"),
    }),
  ),
});
export type ParsedIngredients = z.infer<typeof ParsedIngredients>;

export const Recipe = z.object({
  title: z.string(),
  summary: z.string().describe("Une phrase qui donne envie, ton étudiant et simple"),
  minutes: z.number().int().describe("Temps total, préparation + cuisson"),
  servings: z.number().int(),
  tools: z.array(z.enum(TOOL_IDS)).describe("Uniquement des ustensiles que l'utilisateur possède"),
  ingredients: z.array(
    z.object({
      name: z.string(),
      amount: z.string().describe("Quantité à utiliser, ex. « 2 », « 100 g »"),
      pantryItemId: z
        .string()
        .nullable()
        .describe("Id de l'ingrédient du frigo utilisé, ou null si c'est un ingrédient manquant"),
    }),
  ),
  missing: z
    .array(
      z.object({
        name: z.string(),
        estimatedPriceEur: z.number().describe("Prix estimé en supermarché discount en France"),
      }),
    )
    .describe("Au plus 2 ingrédients à acheter ; sel, poivre, huile et eau sont supposés disponibles"),
  steps: z.array(z.string()),
  rescuesPantryItemIds: z
    .array(z.string())
    .describe("Ids des ingrédients « bientôt périmés » que la recette utilise"),
});
export type Recipe = z.infer<typeof Recipe>;

export const Recommendations = z.object({
  recipes: z.array(Recipe).describe("Exactement 3 recettes différentes"),
});
export type Recommendations = z.infer<typeof Recommendations>;

// Ce que le client envoie pour une recommandation.
export const PantryForPrompt = z.array(
  PantryItemInput.extend({ id: z.string().min(1).max(64) }),
);
export type PantryForPrompt = z.infer<typeof PantryForPrompt>;
