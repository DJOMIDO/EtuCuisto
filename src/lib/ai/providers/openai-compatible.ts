import { z } from "zod";
import { resolveBaseUrl, type AiConfig } from "../config";
import { safeJson, toJsonSchema } from "../json-schema";
import { AI_ERRORS, AiError, type AiProvider, type StructuredRequest } from "../types";

// Filet OpenAI : valable pour OpenAI, OpenRouter et tout point de terminaison
// « compatible OpenAI » renseigné par l'utilisateur. Requêtes en fetch natif,
// sans dépendance au SDK.

const TOTAL_BUDGET_MS = 24_000; // Netlify coupe au-delà de ~26-30 s.

export const openaiProvider: AiProvider = {
  async generate<T extends z.ZodType>(req: StructuredRequest<T>, cfg?: AiConfig) {
    if (!cfg?.apiKey) throw AI_ERRORS.misconfigured();
    const base = resolveBaseUrl(cfg);
    if (!base) throw AI_ERRORS.misconfigured();

    const content: unknown[] = [{ type: "text", text: req.text }];
    if (req.image) {
      content.push({
        type: "image_url",
        image_url: { url: `data:${req.image.mediaType};base64,${req.image.base64}` },
      });
    }

    let res: Response;
    try {
      res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: 16000,
          messages: [
            { role: "system", content: req.system },
            { role: "user", content },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "result", strict: false, schema: toJsonSchema(req.schema) },
          },
        }),
        signal: AbortSignal.timeout(TOTAL_BUDGET_MS),
      });
    } catch (error) {
      if (error instanceof AiError) throw error;
      console.error("OpenAI-compatible injoignable:", (error as Error).message);
      throw AI_ERRORS.busy();
    }

    if (!res.ok) throw statusToAiError(res.status, cfg.provider);

    const data = (await res.json().catch(() => undefined)) as
      | { choices?: { message?: { content?: string } }[] }
      | undefined;
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw AI_ERRORS.incomplete();
    const parsed = req.schema.safeParse(safeJson(text));
    if (!parsed.success) throw AI_ERRORS.incomplete();
    return parsed.data;
  },
};

function statusToAiError(status: number, provider: string): Error {
  if (status === 401 || status === 403) {
    console.error(`Clé API invalide ou refusée par ${provider}`);
    return AI_ERRORS.misconfigured();
  }
  if (status === 429 || status >= 500) return AI_ERRORS.busy();
  console.error(`${provider} API ${status}`);
  return AI_ERRORS.unavailable();
}
