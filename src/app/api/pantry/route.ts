import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, pantryItems } from "@/db";
import { PantryItemInput } from "@/lib/ai/schemas";
import { handleRouteError, readJson, requireUser } from "@/lib/api";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  try {
    const items = await getDb()
      .select()
      .from(pantryItems)
      .where(eq(pantryItems.userId, auth.userId))
      .orderBy(asc(pantryItems.createdAt));
    return NextResponse.json({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

const Body = z.object({ items: z.array(PantryItemInput).min(1).max(100) });

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request, Body);
  if ("response" in body) return body.response;
  try {
    const items = await getDb()
      .insert(pantryItems)
      .values(body.data.items.map((i) => ({ ...i, userId: auth.userId })))
      .returning();
    return NextResponse.json({ items }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
