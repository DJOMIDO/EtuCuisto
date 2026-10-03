import { NextResponse } from "next/server";
import { generateStructured, IMAGE_MEDIA_TYPES, type ImageMediaType } from "@/lib/ai";
import { mockRecognize } from "@/lib/ai/mock";
import { recognizeSystem } from "@/lib/ai/prompts";
import { ParsedIngredients } from "@/lib/ai/schemas";
import { handleRouteError, jsonError, quotaExceeded } from "@/lib/api";
import { getUserId } from "@/lib/auth/server";
import { consumeAiQuota, withRefund } from "@/lib/quota";
import { AI_LANGUAGE } from "@/i18n/locales";
import { getRequestLocale } from "@/i18n/request";

const MAX_BYTES = 5 * 1024 * 1024;

// Photo du frigo (multipart, champ « image ») → liste d'ingrédients.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => undefined);
  const image = form?.get("image");
  if (!(image instanceof File)) return jsonError("photoMissing", 400);
  if (!IMAGE_MEDIA_TYPES.includes(image.type as ImageMediaType)) {
    return jsonError("photoFormat", 400);
  }
  if (image.size > MAX_BYTES) return jsonError("photoTooBig", 413);

  try {
    const language = AI_LANGUAGE[await getRequestLocale()];
    const quota = await consumeAiQuota(request, await getUserId());
    if (!quota.allowed) return quotaExceeded(quota.isGuest);

    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const result = await withRefund(quota, () =>
      generateStructured({
        task: "vision",
        system: recognizeSystem(language),
        text: "Quels aliments vois-tu ?",
        image: {
          mediaType: image.type as ImageMediaType,
          base64,
        },
        schema: ParsedIngredients,
        mock: mockRecognize,
      }),
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
