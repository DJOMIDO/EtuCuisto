import { z } from "zod";

/**
 * JSON Schema compatible avec les API « structured outputs » (Gemini, OpenAI…) :
 * sans `$schema`, `["x","null"]` → `anyOf`, et sans les bornes ±MAX_SAFE_INTEGER
 * que Zod ajoute à `z.int()`.
 */
export function toJsonSchema(schema: z.ZodType): unknown {
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

/** Parse JSON tolérant : renvoie `undefined` au lieu de lever si le texte n'est pas du JSON. */
export function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
