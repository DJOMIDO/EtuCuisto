import { NextResponse } from "next/server";
import type { z } from "zod";
import { AiError } from "@/lib/ai";
import { getUserId } from "@/lib/auth/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Lit et valide le corps JSON ; renvoie une réponse 400 si invalide. */
export async function readJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { response: NextResponse }> {
  const body: unknown = await request.json().catch(() => undefined);
  const result = schema.safeParse(body);
  if (!result.success) {
    return { response: jsonError("Requête invalide.", 400) };
  }
  return { data: result.data };
}

/** Id de l'utilisateur connecté, ou une réponse 401. */
export async function requireUser(): Promise<{ userId: string } | { response: NextResponse }> {
  const userId = await getUserId();
  if (!userId) return { response: jsonError("Connexion requise.", 401) };
  return { userId };
}

export function handleRouteError(error: unknown) {
  if (error instanceof AiError) return jsonError(error.message, error.status);
  console.error(error);
  return jsonError("Erreur interne.", 500);
}

export function quotaExceeded(isGuest: boolean) {
  return jsonError(
    isGuest
      ? "Limite d'essai atteinte pour aujourd'hui. Connecte-toi pour continuer."
      : "Tu as atteint la limite du jour. Reviens demain !",
    429,
  );
}
