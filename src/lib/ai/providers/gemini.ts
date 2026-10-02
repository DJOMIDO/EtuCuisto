import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { AI_ERRORS, AiError, type AiProvider, type AiTask, type StructuredRequest } from "../types";

// Modèles du niveau gratuit (voir ai.google.dev/gemini-api/docs/pricing).
// 3.5-flash d'abord : plus rapide, et 3.8-flash est souvent saturé (503) en gratuit.
// En cas de surcharge (503) ou de quota (429) sur le premier, on bascule sur le second.
const DEFAULT_MODEL = "gemini-3.5-flash";
const FALLBACK_MODEL = "gemini-3.8-flash";
// gemini-3.8-flash refuse "minimal" (400) : "low" est le niveau le plus bas accepté.
// Recettes en "low" : ~30 % plus rapide que "medium" à qualité égale sur nos tests.
const THINKING: Record<AiTask, "low" | "medium"> = {
  textParse: "low",
  vision: "low",
  recipes: "low",
};

let client: GoogleGenAI | undefined;

export const geminiProvider: AiProvider = {
  async generate<T extends z.ZodType>(req: StructuredRequest<T>) {
    const models = [...new Set([process.env.GEMINI_MODEL || DEFAULT_MODEL, FALLBACK_MODEL])];
    for (const [index, model] of models.entries()) {
      try {
        return await generateOnce(model, req);
      } catch (error) {
        const last = index === models.length - 1;
        if (last || !isTransient(error)) throw toAiError(error);
        console.warn(`Gemini ${model} indisponible, bascule sur ${models[index + 1]}:`, (error as Error).message);
      }
    }
    throw AI_ERRORS.unavailable();
  },
};

async function generateOnce<T extends z.ZodType>(model: string, req: StructuredRequest<T>): Promise<z.infer<T>> {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const interaction = await client.interactions.create(
    {
      model,
      system_instruction: req.system,
      input: [
        ...(req.image
          ? [{ type: "image" as const, mime_type: req.image.mediaType, data: req.image.base64 }]
          : []),
        { type: "text" as const, text: req.text },
      ],
      generation_config: { thinking_level: THINKING[req.task], max_output_tokens: 16000 },
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: toGeminiSchema(req.schema),
      },
    },
    // Pas de nouvelle tentative dans le SDK : sous Next.js, elle réutilise un corps de
    // requête déjà lu (« TypeError: unusable »). On gère la bascule nous-mêmes.
    { maxRetries: 0, timeout: 90_000 },
  );

  if (!interaction.output_text) throw AI_ERRORS.incomplete();
  // Gemini garantit du JSON valide, pas le respect de toutes nos contraintes : on revalide.
  const parsed = req.schema.safeParse(safeJson(interaction.output_text));
  if (!parsed.success) throw AI_ERRORS.incomplete();
  return parsed.data;
}

function httpStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown })?.status;
  return typeof status === "number" ? status : undefined;
}

/** Surcharge, quota, erreur serveur ou réseau : ça vaut le coup d'essayer l'autre modèle. */
function isTransient(error: unknown): boolean {
  if (error instanceof AiError) return false;
  const status = httpStatus(error);
  return status === undefined || status === 429 || status >= 500;
}

/**
 * JSON Schema compatible Gemini : sans `$schema`, `["x","null"]` → `anyOf`,
 * et sans les bornes ±MAX_SAFE_INTEGER que Zod ajoute à `z.int()`.
 */
export function toGeminiSchema(schema: z.ZodType): unknown {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return clean(json);
}

function clean(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(clean);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if ((k === "minimum" || k === "maximum") && Math.abs(Number(v)) === Number.MAX_SAFE_INTEGER) continue;
    out[k] = clean(v);
  }
  if (Array.isArray(out.type) && out.type.includes("null")) {
    const { type, description, ...rest } = out;
    const types = (type as string[]).filter((t) => t !== "null");
    return {
      ...(description ? { description } : {}),
      anyOf: [...types.map((t) => ({ ...rest, type: t })), { type: "null" }],
    };
  }
  return out;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function toAiError(error: unknown): Error {
  if (error instanceof AiError) return error;
  // L'API Interactions lève des classes (BadRequestError, RateLimitError…) que le SDK
  // n'exporte pas : on se fie au code HTTP qu'elles portent toutes.
  const status = httpStatus(error);
  if (status !== undefined) {
    if (status === 429 || status === 503) return AI_ERRORS.busy();
    if (status === 401 || status === 403) {
      console.error("Clé GEMINI_API_KEY invalide");
      return AI_ERRORS.misconfigured();
    }
    console.error(`Gemini API ${status}:`, (error as Error).message);
    return AI_ERRORS.unavailable();
  }
  return error instanceof Error ? error : new Error(String(error));
}
