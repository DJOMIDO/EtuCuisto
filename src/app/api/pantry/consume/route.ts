import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, pantryItems } from "@/db";
import { handleRouteError, readJson, requireUser } from "@/lib/api";

const Body = z.object({
  items: z
    .array(z.object({ id: z.uuid(), used: z.number().positive().max(99999) }))
    .min(1)
    .max(100),
});

// « J'ai cuisiné cette recette » : retire les quantités utilisées du frigo.
// Un aliment sans quantité connue ou entièrement consommé disparaît, sinon on décrémente.
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request, Body);
  if ("response" in body) return body.response;

  try {
    const db = getDb();
    const ids = body.data.items.map((i) => i.id);
    const rows = await db
      .select({ id: pantryItems.id, quantity: pantryItems.quantity })
      .from(pantryItems)
      .where(and(eq(pantryItems.userId, auth.userId), inArray(pantryItems.id, ids)));
    const current = new Map(rows.map((r) => [r.id, r.quantity]));

    const removed: string[] = [];
    const updated: { id: string; quantity: number }[] = [];
    for (const { id, used } of body.data.items) {
      if (!current.has(id)) continue; // déjà parti ou hors du frigo de cet utilisateur
      const owned = current.get(id);
      const remaining = (owned ?? 0) - used;
      const where = and(eq(pantryItems.userId, auth.userId), eq(pantryItems.id, id));
      if (owned == null || remaining <= 0) {
        await db.delete(pantryItems).where(where);
        removed.push(id);
      } else {
        await db.update(pantryItems).set({ quantity: remaining }).where(where);
        updated.push({ id, quantity: remaining });
      }
    }
    return NextResponse.json({ removed, updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
