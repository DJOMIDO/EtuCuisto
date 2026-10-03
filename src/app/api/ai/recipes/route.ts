import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, kitchenProfiles, pantryItems } from "@/db";
import { generateStructured } from "@/lib/ai";
import { mockRecipes } from "@/lib/ai/mock";
import { recipesSystem, recipesUserPrompt } from "@/lib/ai/prompts";
import {
  DEFAULT_KITCHEN,
  KitchenProfile,
  PantryForPrompt,
  Recommendations,
} from "@/lib/ai/schemas";
import { handleRouteError, jsonError, quotaExceeded, readJson } from "@/lib/api";
import { getUserId } from "@/lib/auth/server";
import { consumeAiQuota, withRefund } from "@/lib/quota";
import { AI_LANGUAGE } from "@/i18n/locales";
import { getRequestLocale } from "@/i18n/request";

// Connecté : frigo et cuisine lus en base. Invité : envoyés par le client.
const Body = z.object({
  maxMinutes: z.number().int().min(5).max(120).default(20),
  pantry: PantryForPrompt.max(100).optional(),
  kitchen: KitchenProfile.optional(),
});

export async function POST(request: Request) {
  const body = await readJson(request, Body);
  if ("response" in body) return body.response;

  try {
    const userId = await getUserId();
    let pantry = body.data.pantry ?? [];
    let kitchen = body.data.kitchen ?? DEFAULT_KITCHEN;

    if (userId) {
      const db = getDb();
      const [items, [profile]] = await Promise.all([
        db.select().from(pantryItems).where(eq(pantryItems.userId, userId)),
        db.select().from(kitchenProfiles).where(eq(kitchenProfiles.userId, userId)),
      ]);
      pantry = items.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        category: i.category as PantryForPrompt[number]["category"],
        expiresSoon: i.expiresSoon,
      }));
      if (profile) kitchen = KitchenProfile.parse(profile);
    }

    if (pantry.length === 0) return jsonError("emptyFridge", 400);

    const language = AI_LANGUAGE[await getRequestLocale()];
    const quota = await consumeAiQuota(request, userId);
    if (!quota.allowed) return quotaExceeded(quota.isGuest);

    const result = await withRefund(quota, () =>
      generateStructured({
        task: "recipes",
        system: recipesSystem(language),
        text: recipesUserPrompt(pantry, kitchen, body.data.maxMinutes),
        schema: Recommendations,
        mock: () => mockRecipes(pantry),
      }),
    );

    // Ne garder que des ids qui existent vraiment dans le frigo.
    const ids = new Set(pantry.map((p) => p.id));
    for (const recipe of result.recipes) {
      for (const ing of recipe.ingredients) {
        if (ing.pantryItemId && !ids.has(ing.pantryItemId)) ing.pantryItemId = null;
      }
      recipe.rescuesPantryItemIds = recipe.rescuesPantryItemIds.filter((id) => ids.has(id));
    }
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
