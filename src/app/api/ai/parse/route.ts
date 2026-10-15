import { NextResponse } from "next/server";
import { z } from "zod";
import { generateStructured } from "@/lib/ai";
import { AiConfigSchema } from "@/lib/ai/config";
import { mockParse } from "@/lib/ai/mock";
import { parseTextSystem } from "@/lib/ai/prompts";
import { ParsedIngredients } from "@/lib/ai/schemas";
import { handleRouteError, quotaExceeded, readJson } from "@/lib/api";
import { getUserId } from "@/lib/auth/server";
import { consumeAiQuota, withRefund } from "@/lib/quota";
import { AI_LANGUAGE } from "@/i18n/locales";
import { getRequestLocale } from "@/i18n/request";

const Body = z.object({
  text: z.string().trim().min(1).max(1000),
  ai: AiConfigSchema.optional(),
});

// Texte libre (« 2 œufs, un reste de riz… ») → liste d'ingrédients structurée.
export async function POST(request: Request) {
  const body = await readJson(request, Body);
  if ("response" in body) return body.response;

  try {
    const language = AI_LANGUAGE[await getRequestLocale()];
    const userId = await getUserId();
    // Clé perso réservée aux comptes connectés : un invité reste sur l'essai quota.
    const ai = userId ? body.data.ai : undefined;
    // Clé perso = l'utilisateur paie : on ne consomme pas le quota d'essai.
    const quota = ai?.apiKey ? null : await consumeAiQuota(request, userId);
    if (quota && !quota.allowed) return quotaExceeded(quota.isGuest);

    const call = () =>
      generateStructured(
        {
          task: "textParse",
          system: parseTextSystem(language),
          text: body.data.text,
          schema: ParsedIngredients,
          mock: () => mockParse(body.data.text),
        },
        ai,
      );
    const result = quota ? await withRefund(quota, call) : await call();
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

