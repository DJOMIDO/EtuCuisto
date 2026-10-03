import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, pantryItems } from "@/db";
import { PantryItemInput } from "@/lib/ai/schemas";
import { handleRouteError, jsonError, readJson, requireUser } from "@/lib/api";

const Id = z.uuid();

export async function PATCH(request: Request, ctx: RouteContext<"/api/pantry/[id]">) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const id = Id.safeParse((await ctx.params).id);
  if (!id.success) return jsonError("notFound", 404);
  const body = await readJson(request, PantryItemInput.partial());
  if ("response" in body) return body.response;
  if (Object.keys(body.data).length === 0) return jsonError("nothingToChange", 400);

  try {
    const [item] = await getDb()
      .update(pantryItems)
      .set(body.data)
      .where(and(eq(pantryItems.id, id.data), eq(pantryItems.userId, auth.userId)))
      .returning();
    return item ? NextResponse.json({ item }) : jsonError("notFound", 404);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/pantry/[id]">) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const id = Id.safeParse((await ctx.params).id);
  if (!id.success) return jsonError("notFound", 404);

  try {
    const deleted = await getDb()
      .delete(pantryItems)
      .where(and(eq(pantryItems.id, id.data), eq(pantryItems.userId, auth.userId)))
      .returning({ id: pantryItems.id });
    return deleted.length ? new NextResponse(null, { status: 204 }) : jsonError("notFound", 404);
  } catch (error) {
    return handleRouteError(error);
  }
}
