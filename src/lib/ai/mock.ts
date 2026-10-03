import { CATEGORIES, type CategoryId } from "@/lib/categories";
import type { ParsedIngredients, PantryForPrompt, Recommendations } from "./schemas";

// Données factices pour développer sans clé d'API (AI_PROVIDER=mock).

const EXPIRING = /p[ée]rim|ab[iî]m|bient[ôo]t|vite/i;

export function mockParse(text: string): ParsedIngredients {
  const items = text
    .split(/,|\n|;| et /)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const expiresSoon = EXPIRING.test(part);
      const qty = part.match(/^(\d+(?:[.,/]\d+)?\s*(?:g|kg|ml|l|cl)?)\s+(?:de |d')?/i);
      const name = (qty ? part.slice(qty[0].length) : part)
        .replace(/\(.*?\)|qui (va|vont).*|bientôt.*|presque.*/gi, "")
        .trim()
        .toLowerCase()
        .replace(/^(?:(?:une|un|du|des|les|le|la|de la)\s+|de l'|l'|d')/, "");
      const category = guessCategory(name);
      return {
        name,
        quantity: qty ? qty[1].trim() : null,
        category,
        expiresSoon,
      };
    })
    .filter((i) => i.name);
  return { items };
}

// Devine la famille à partir des exemples de chaque catégorie (« œufs » → « œuf »).
function guessCategory(name: string): CategoryId {
  const words = name.toLowerCase().replace(/œ/g, "oe").split(/\s+/).map((w) => w.replace(/[sx]$/, ""));
  for (const c of CATEGORIES) {
    const examples = c.examples.toLowerCase().replace(/œ/g, "oe").split(", ");
    if (examples.some((e) => words.includes(e.replace(/[sx]$/, "")) || e === name)) return c.id;
  }
  return "autre";
}

export function mockRecognize(): ParsedIngredients {
  return {
    items: [
      { name: "œuf", quantity: "4", category: "laitier", expiresSoon: false },
      { name: "courgette", quantity: "1", category: "legume", expiresSoon: true },
      { name: "fromage râpé", quantity: "1/2 sachet", category: "laitier", expiresSoon: false },
      { name: "tomate", quantity: "2", category: "legume", expiresSoon: false },
    ],
  };
}

export function mockRecipes(pantry: PantryForPrompt): Recommendations {
  const pick = (n: number) => pantry.slice(n, n + 3);
  const make = (title: string, minutes: number, items: PantryForPrompt): Recommendations["recipes"][number] => ({
    title,
    summary: "Recette d'exemple (mode mock) : rapide, pas chère, sans gaspillage.",
    minutes,
    servings: 1,
    tools: ["poele"],
    ingredients: [
      ...items.map((p) => ({ name: p.name, amount: p.quantity ?? "selon l'envie", pantryItemId: p.id })),
      { name: "oignon", amount: "1", pantryItemId: null },
    ],
    missing: [{ name: "oignon", estimatedPriceEur: 0.3 }],
    steps: [
      "Coupe les ingrédients en petits morceaux.",
      "Fais revenir l'oignon 3 minutes dans un peu d'huile.",
      "Ajoute le reste, sale, poivre, et laisse cuire 10 minutes.",
      "Goûte, ajuste et sers chaud.",
    ],
    rescuesPantryItemIds: items.filter((p) => p.expiresSoon).map((p) => p.id),
  });
  return {
    recipes: [
      make("Poêlée du frigo", 15, pick(0)),
      make("Omelette vide-frigo", 10, pick(1)),
      make("Riz sauté express", 20, pick(2)),
    ],
  };
}
