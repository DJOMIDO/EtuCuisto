import { NextResponse } from "next/server";
import { z } from "zod";
import { buildModelsRequest, parseModelIds, resolveBaseUrl } from "@/lib/ai/config";
import { handleRouteError, jsonError, readJson, requireUser } from "@/lib/api";

// Liste des modèles accessibles avec une clé donnée : sert au bouton « charger les
// modèles » du panneau de réglages (et valide la clé au passage). Réservé aux comptes
// connectés, comme toute la config BYOK. Compte pas au quota.
const Body = z.object({
  provider: z.enum(["openai", "anthropic", "gemini", "openrouter", "custom"]),
  baseUrl: z.string().trim().url().optional(),
  apiKey: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request, Body);
  if ("response" in body) return body.response;

  try {
    const cfg = body.data;
    if (!resolveBaseUrl(cfg)) return jsonError("misconfigured", 400);
    const { url, headers } = buildModelsRequest(cfg);

    const res = await fetch(url, {
      headers: { ...headers },
      signal: AbortSignal.timeout(15_000),
    }).catch(() => undefined);

    if (!res) return jsonError("unavailable", 502);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) return jsonError("misconfigured", 400);
      return jsonError("unavailable", 502);
    }
    const models = parseModelIds(await res.json().catch(() => undefined));
    return NextResponse.json({ models });
  } catch (error) {
    return handleRouteError(error);
  }
}
