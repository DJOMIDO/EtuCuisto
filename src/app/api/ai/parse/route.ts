import { NextResponse } from "next/server";
import { z } from "zod";
import { generateStructured } from "@/lib/ai";
import { mockParse } from "@/lib/ai/mock";
import { PARSE_TEXT_SYSTEM } from "@/lib/ai/prompts";
import { ParsedIngredients } from "@/lib/ai/schemas";
import { handleRouteError, quotaExceeded, readJson } from "@/lib/api";
import { getUserId } from "@/lib/auth/server";
import { consumeAiQuota, withRefund } from "@/lib/quota";

const Body = z.object({ text: z.string().trim().min(1).max(1000) });

// Texte libre (« 2 œufs, un reste de riz… ») → liste d'ingrédients structurée.
export async function POST(request: Request) {
  const body = await readJson(request, Body);
  if ("response" in body) return body.response;

  try {
    const quota = await consumeAiQuota(request, await getUserId());
    if (!quota.allowed) return quotaExceeded(quota.isGuest);

    const result = await withRefund(quota, () =>
      generateStructured({
        task: "textParse",
        system: PARSE_TEXT_SYSTEM,
        text: body.data.text,
        schema: ParsedIngredients,
        mock: () => mockParse(body.data.text),
      }),
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

