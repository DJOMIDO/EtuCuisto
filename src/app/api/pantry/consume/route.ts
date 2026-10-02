import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, pantryItems } from "@/db";
import { handleRouteError, readJson, requireUser } from "@/lib/api";

const Body = z.object({ ids: z.array(z.uuid()).min(1).max(100) });

// « J'ai cuisiné cette recette » : retire du frigo les ingrédients utilisés.
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request, Body);
  if ("response" in body) return body.response;

  try {
    const removed = await getDb()
      .delete(pantryItems)
      .where(and(eq(pantryItems.userId, auth.userId), inArray(pantryItems.id, body.data.ids)))
      .returning({ id: pantryItems.id });
    return NextResponse.json({ removed: removed.map((r) => r.id) });
  } catch (error) {
    return handleRouteError(error);
  }
}
