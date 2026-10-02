import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, recipes } from "@/db";
import { handleRouteError, jsonError, readJson, requireUser } from "@/lib/api";

const Id = z.uuid();
const Body = z.object({ favorite: z.boolean().optional(), cooked: z.literal(true).optional() });

export async function PATCH(request: Request, ctx: RouteContext<"/api/recipes/[id]">) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const id = Id.safeParse((await ctx.params).id);
  if (!id.success) return jsonError("Introuvable.", 404);
  const body = await readJson(request, Body);
  if ("response" in body) return body.response;

  const set: { favorite?: boolean; cookedAt?: Date } = {};
  if (body.data.favorite !== undefined) set.favorite = body.data.favorite;
  if (body.data.cooked) set.cookedAt = new Date();
  if (Object.keys(set).length === 0) return jsonError("Rien à modifier.", 400);

  try {
    const [row] = await getDb()
      .update(recipes)
      .set(set)
      .where(and(eq(recipes.id, id.data), eq(recipes.userId, auth.userId)))
      .returning();
    return row ? NextResponse.json({ recipe: row }) : jsonError("Introuvable.", 404);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/recipes/[id]">) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const id = Id.safeParse((await ctx.params).id);
  if (!id.success) return jsonError("Introuvable.", 404);

  try {
    const deleted = await getDb()
      .delete(recipes)
      .where(and(eq(recipes.id, id.data), eq(recipes.userId, auth.userId)))
      .returning({ id: recipes.id });
    return deleted.length ? new NextResponse(null, { status: 204 }) : jsonError("Introuvable.", 404);
  } catch (error) {
    return handleRouteError(error);
  }
}
