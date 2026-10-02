import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, kitchenProfiles } from "@/db";
import { DEFAULT_KITCHEN, KitchenProfile } from "@/lib/ai/schemas";
import { handleRouteError, readJson, requireUser } from "@/lib/api";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  try {
    const [profile] = await getDb()
      .select()
      .from(kitchenProfiles)
      .where(eq(kitchenProfiles.userId, auth.userId));
    return NextResponse.json({
      kitchen: profile ? KitchenProfile.parse(profile) : DEFAULT_KITCHEN,
      isDefault: !profile,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request, KitchenProfile);
  if ("response" in body) return body.response;

  try {
    const values = { ...body.data, updatedAt: new Date() };
    await getDb()
      .insert(kitchenProfiles)
      .values({ ...values, userId: auth.userId })
      .onConflictDoUpdate({ target: kitchenProfiles.userId, set: values });
    return NextResponse.json({ kitchen: body.data });
  } catch (error) {
    return handleRouteError(error);
  }
}
