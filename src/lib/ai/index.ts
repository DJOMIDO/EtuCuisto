import type { z } from "zod";
import { protocolOf, type AiConfig } from "./config";
import { anthropicProvider } from "./providers/anthropic";
import { geminiProvider } from "./providers/gemini";
import { openaiProvider } from "./providers/openai-compatible";
import type { AiProvider, StructuredRequest } from "./types";

export { AiError, IMAGE_MEDIA_TYPES, type ImageMediaType } from "./types";
export { AiConfigSchema, AI_PROVIDER_IDS, PROVIDERS, type AiConfig, type AiProviderId } from "./config";

const mockProvider: AiProvider = {
  async generate(req) {
    return req.mock();
  },
};

const PROVIDERS_BY_PROTOCOL: Record<string, AiProvider> = {
  gemini: geminiProvider,
  anthropic: anthropicProvider,
  openai: openaiProvider,
};

// Fournisseur d'essai du serveur (aucune config utilisateur) : lu depuis l'environnement.
const ENV_PROVIDERS: Record<string, AiProvider> = {
  gemini: geminiProvider,
  anthropic: anthropicProvider,
  mock: mockProvider,
};

/**
 * Génère une sortie JSON validée par `schema`.
 * Avec `cfg` (clé BYOK) : on route selon le fournisseur choisi par l'utilisateur.
 * Sans `cfg` : repli sur le fournisseur d'essai configuré par `AI_PROVIDER`.
 */
export function generateStructured<T extends z.ZodType>(
  req: StructuredRequest<T>,
  cfg?: AiConfig,
): Promise<z.infer<T>> {
  if (cfg?.apiKey) {
    const provider = PROVIDERS_BY_PROTOCOL[protocolOf(cfg.provider)];
    if (!provider) throw new Error(`Fournisseur inconnu : ${cfg.provider}`);
    return provider.generate(req, cfg);
  }
  const name = (process.env.AI_PROVIDER || "gemini").trim().toLowerCase();
  const provider = ENV_PROVIDERS[name];
  if (!provider) throw new Error(`AI_PROVIDER inconnu : ${name}`);
  return provider.generate(req);
}
