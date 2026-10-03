import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import type { Messages } from "next-intl";
import type { z } from "zod";
import { AiError } from "@/lib/ai";
import { getUserId } from "@/lib/auth/server";
import { getRequestLocale } from "@/i18n/request";

export type ErrorKey = keyof Messages["errors"];

/** Réponse d'erreur JSON, message traduit dans la langue de la requête. */
export async function jsonError(key: ErrorKey, status: number) {
  const t = await getTranslations({ locale: await getRequestLocale(), namespace: "errors" });
  return NextResponse.json({ error: t(key) }, { status });
}

/** Lit et valide le corps JSON ; renvoie une réponse 400 si invalide. */
export async function readJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { response: NextResponse }> {
  const body: unknown = await request.json().catch(() => undefined);
  const result = schema.safeParse(body);
  if (!result.success) {
    return { response: await jsonError("invalidRequest", 400) };
  }
  return { data: result.data };
}

/** Id de l'utilisateur connecté, ou une réponse 401. */
export async function requireUser(): Promise<{ userId: string } | { response: NextResponse }> {
  const userId = await getUserId();
  if (!userId) return { response: await jsonError("authRequired", 401) };
  return { userId };
}

export function handleRouteError(error: unknown) {
  if (error instanceof AiError) return jsonError(error.code, error.status);
  console.error(error);
  return jsonError("internal", 500);
}

export function quotaExceeded(isGuest: boolean) {
  return jsonError(isGuest ? "quotaGuest" : "quotaUser", 429);
}
