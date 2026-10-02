import { NextResponse } from "next/server";
import { generateStructured, IMAGE_MEDIA_TYPES, type ImageMediaType } from "@/lib/ai";
import { mockRecognize } from "@/lib/ai/mock";
import { RECOGNIZE_SYSTEM } from "@/lib/ai/prompts";
import { ParsedIngredients } from "@/lib/ai/schemas";
import { handleRouteError, jsonError, quotaExceeded } from "@/lib/api";
import { getUserId } from "@/lib/auth/server";
import { consumeAiQuota, withRefund } from "@/lib/quota";

const MAX_BYTES = 5 * 1024 * 1024;

// Photo du frigo (multipart, champ « image ») → liste d'ingrédients.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => undefined);
  const image = form?.get("image");
  if (!(image instanceof File)) return jsonError("Photo manquante.", 400);
  if (!IMAGE_MEDIA_TYPES.includes(image.type as ImageMediaType)) {
    return jsonError("Format accepté : JPEG, PNG, WebP ou GIF.", 400);
  }
  if (image.size > MAX_BYTES) return jsonError("Photo trop lourde (5 Mo max).", 413);

  try {
    const quota = await consumeAiQuota(request, await getUserId());
    if (!quota.allowed) return quotaExceeded(quota.isGuest);

    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const result = await withRefund(quota, () =>
      generateStructured({
        task: "vision",
        system: RECOGNIZE_SYSTEM,
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
