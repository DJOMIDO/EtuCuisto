import { z } from "zod";
import type { CategoryId } from "@/lib/categories";
import type { StorageId } from "@/lib/storage";

export const CATEGORY_IDS = [
  "viande",
  "poisson",
  "legume",
  "fruit",
  "laitier",
  "cereal",
  "legumineuse",
  "condiment",
  "epice",
  "boisson",
  "sucrerie",
  "restes",
  "autre",
] as const satisfies readonly CategoryId[];

export const STORAGE_IDS = ["frigo", "congelateur", "placard"] as const satisfies readonly StorageId[];

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

// Allergènes : les 14 familles obligatoires dans l'UE, cochables dans les réglages.
export const ALLERGEN_IDS = [
  "gluten",
  "crustaces",
  "oeufs",
  "poisson",
  "arachides",
  "soja",
  "lait",
  "fruits-a-coque",
  "celeri",
  "moutarde",
  "sesame",
  "sulfites",
  "lupin",
  "mollusques",
] as const;

// Habitudes alimentaires et interdits culturels/religieux.
export const HABIT_IDS = [
  "vegetarien",
  "vegetalien",
  "pescatarien",
  "lacto-vegetarien",
  "flexitarien",
  "halal",
  "casher",
  "sans-alcool",
  "sans-porc",
  "sans-boeuf",
] as const;

// Cuisines appréciées (servent de préférence, jamais d'exclusion stricte).
export const CUISINE_IDS = [
  "asiatique",
  "europeenne",
  "moyentorient",
  "indienne",
  "chinoise",
  "japonaise",
  "coreenne",
  "vietnamienne",
  "thailandaise",
  "asiedusudest",
  "italienne",
  "francaise",
  "maghrebine",
  "ouestafricaine",
  "estafricaine",
  "nordamericaine",
  "soulfood",
  "ameriquelatine",
  "mexicaine",
  "caraibeenne",
  "pacifique",
  "fusion",
] as const;

// --- Entrées utilisateur -------------------------------------------------

export const PantryItemInput = z.object({
  name: z.string().trim().min(1).max(80),
  quantity: z.string().trim().max(40).nullable(),
  category: z.enum(CATEGORY_IDS),
  // null = pas d'avis, l'UI retombe sur le défaut de la famille (voir storage.ts).
  storage: z.enum(STORAGE_IDS).nullable(),
  expiresSoon: z.boolean(),
});
export type PantryItemInput = z.infer<typeof PantryItemInput>;

// Un réglage multi-sélection : pastilles prédéfinies (les *_IDS) ou saisie libre.
const freeChoice = z.string().trim().min(1).max(40);

export const KitchenProfile = z.object({
  tools: z.array(freeChoice).max(20),
  budget: z.enum(BUDGET_IDS),
  allergies: z.array(freeChoice).max(30),
  habits: z.array(freeChoice).max(15),
  avoided: z.array(freeChoice).max(30),
  cuisines: z.array(freeChoice).max(25),
  servings: z.number().int().min(1).max(8),
});
export type KitchenProfile = z.infer<typeof KitchenProfile>;

export const DEFAULT_KITCHEN: KitchenProfile = {
  tools: ["plaque", "casserole", "poele"],
  budget: "serre",
  allergies: [],
  habits: [],
  avoided: [],
  cuisines: [],
  servings: 1,
};

// --- Sorties de Claude ---------------------------------------------------

export const ParsedIngredients = z.object({
  items: z.array(
    z.object({
      name: z.string().describe("Nom de l'ingrédient dans la langue demandée, au singulier"),
      quantity: z.string().nullable().describe("Quantité telle que comprise, ex. « 2 », « 1/2 paquet », ou null"),
      category: z.enum(CATEGORY_IDS),
      storage: z
        .enum(STORAGE_IDS)
        .nullable()
        .describe("Lieu de rangement : frigo (frais), congelateur (surgelé) ou placard (température ambiante) ; null si incertain"),
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
  tools: z.array(z.string()).describe("Uniquement des ustensiles que l'utilisateur possède"),
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
