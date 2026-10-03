import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, userSettings } from "@/db";
import { LOCALES } from "@/i18n/locales";
import { handleRouteError, readJson, requireUser } from "@/lib/api";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  try {
    const [row] = await getDb().select().from(userSettings).where(eq(userSettings.userId, auth.userId));
    return NextResponse.json({ locale: row?.locale ?? null });
  } catch (error) {
    return handleRouteError(error);
  }
}

const Body = z.object({ locale: z.enum(LOCALES) });

export async function PUT(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request, Body);
  if ("response" in body) return body.response;

  try {
    const values = { locale: body.data.locale, updatedAt: new Date() };
    await getDb()
      .insert(userSettings)
      .values({ ...values, userId: auth.userId })
      .onConflictDoUpdate({ target: userSettings.userId, set: values });
    return NextResponse.json({ locale: body.data.locale });
  } catch (error) {
    return handleRouteError(error);
  }
}
