import type { z } from "zod";
import { anthropicProvider } from "./providers/anthropic";
import { geminiProvider } from "./providers/gemini";
import type { AiProvider, StructuredRequest } from "./types";

export { AiError, IMAGE_MEDIA_TYPES, type ImageMediaType } from "./types";

const mockProvider: AiProvider = {
  async generate(req) {
    return req.mock();
  },
};

const PROVIDERS: Record<string, AiProvider> = {
  gemini: geminiProvider,
  anthropic: anthropicProvider,
  mock: mockProvider,
};

/** Génère une sortie JSON validée par `schema`, via le fournisseur choisi par AI_PROVIDER. */
export function generateStructured<T extends z.ZodType>(req: StructuredRequest<T>): Promise<z.infer<T>> {
  const name = (process.env.AI_PROVIDER || "gemini").trim().toLowerCase();
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`AI_PROVIDER inconnu : ${name}`);
  return provider.generate(req);
}
