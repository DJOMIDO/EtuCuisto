import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, recipes } from "@/db";
import { Recipe } from "@/lib/ai/schemas";
import { handleRouteError, readJson, requireUser } from "@/lib/api";

// Recettes enregistrées : favorites et/ou déjà cuisinées.
export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  try {
    const rows = await getDb()
      .select()
      .from(recipes)
      .where(eq(recipes.userId, auth.userId))
      .orderBy(desc(recipes.createdAt));
    return NextResponse.json({ recipes: rows });
  } catch (error) {
    return handleRouteError(error);
  }
}

const Body = z
  .object({ recipe: Recipe, favorite: z.boolean().default(false), cooked: z.boolean().default(false) })
  .refine((b) => b.favorite || b.cooked, "Une recette enregistrée est favorite ou cuisinée.");

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request, Body);
  if ("response" in body) return body.response;

  try {
    const [row] = await getDb()
      .insert(recipes)
      .values({
        userId: auth.userId,
        data: body.data.recipe,
        favorite: body.data.favorite,
        cookedAt: body.data.cooked ? new Date() : null,
      })
      .returning();
    return NextResponse.json({ recipe: row }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
