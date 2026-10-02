import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { AI_ERRORS, AiError, type AiProvider, type AiTask, type StructuredRequest } from "../types";

// Modèle du niveau gratuit (voir ai.google.dev/gemini-api/docs/pricing).
const DEFAULT_MODEL = "gemini-3.8-flash";
const THINKING: Record<AiTask, "minimal" | "low" | "medium"> = {
  textParse: "minimal",
  vision: "low",
  recipes: "medium",
};

let client: GoogleGenAI | undefined;

export const geminiProvider: AiProvider = {
  async generate<T extends z.ZodType>(req: StructuredRequest<T>) {
    client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
      const interaction = await client.interactions.create({
        model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
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
      });

      if (!interaction.output_text) throw AI_ERRORS.incomplete();
      // Gemini garantit du JSON valide, pas le respect de toutes nos contraintes : on revalide.
      const parsed = req.schema.safeParse(safeJson(interaction.output_text));
      if (!parsed.success) throw AI_ERRORS.incomplete();
      return parsed.data;
    } catch (error) {
      throw toAiError(error);
    }
  },
};

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
  if (error instanceof ApiError) {
    if (error.status === 429) return AI_ERRORS.busy();
    if (error.status === 401 || error.status === 403) {
      console.error("Clé GEMINI_API_KEY invalide");
      return AI_ERRORS.misconfigured();
    }
    console.error(`Gemini API ${error.status}:`, error.message);
    return AI_ERRORS.unavailable();
  }
  return error instanceof Error ? error : new Error(String(error));
}
