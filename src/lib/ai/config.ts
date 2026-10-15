import { z } from "zod";

// Configuration « apportez votre propre clé » (BYOK). Elle ne vit que côté client
// (localStorage) et voyage dans le corps des requêtes /api/ai/* : le serveur ne la
// persiste jamais, il ne fait que la relayer vers le fournisseur choisi.

export const AI_PROVIDER_IDS = ["openai", "anthropic", "gemini", "openrouter", "custom"] as const;
export type AiProviderId = (typeof AI_PROVIDER_IDS)[number];

type Protocol = "openai" | "anthropic" | "gemini";

export const AiConfigSchema = z.object({
  provider: z.enum(AI_PROVIDER_IDS),
  // Seulement pertinent pour « custom » ; les autres fournisseurs ont une URL par défaut.
  baseUrl: z.string().trim().url().optional(),
  apiKey: z.string().trim().min(1),
  model: z.string().trim().min(1),
});
export type AiConfig = z.infer<typeof AiConfigSchema>;

type ProviderDef = {
  /** Familles d'API à laquelle le fournisseur se conforme. */
  protocol: Protocol;
  /** URL d'API par défaut (absente pour « custom », que l'utilisateur renseigne). */
  defaultBaseUrl?: string;
  /** Page où créer une clé, reliée depuis le panneau de réglages. */
  keyUrl: string;
};

export const PROVIDERS: Record<AiProviderId, ProviderDef> = {
  openai: {
    protocol: "openai",
    defaultBaseUrl: "https://api.openai.com/v1",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    protocol: "anthropic",
    defaultBaseUrl: "https://api.anthropic.com",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  gemini: {
    protocol: "gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
    keyUrl: "https://aistudio.google.com/apikey",
  },
  openrouter: {
    protocol: "openai",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    keyUrl: "https://openrouter.ai/settings/keys",
  },
  custom: {
    protocol: "openai",
    keyUrl: "",
  },
};

/** URL d'API effective : saisie utilisateur sinon valeur par défaut du fournisseur. */
export function resolveBaseUrl(cfg: Pick<AiConfig, "provider" | "baseUrl">): string {
  const trimmed = cfg.baseUrl?.trim().replace(/\/+$/, "");
  return trimmed || PROVIDERS[cfg.provider].defaultBaseUrl || "";
}

export function protocolOf(provider: AiProviderId): Protocol {
  return PROVIDERS[provider].protocol;
}

// --- Liste des modèles : requête + parsing par famille d'API -------------------

export type ModelsRequest = { url: string; headers: Record<string, string> };

/** Construit la requête `GET /models` du fournisseur (clé incluse) pour charger la liste. */
export function buildModelsRequest(cfg: Pick<AiConfig, "provider" | "baseUrl" | "apiKey">): ModelsRequest {
  const base = resolveBaseUrl(cfg);
  switch (PROVIDERS[cfg.provider].protocol) {
    case "anthropic":
      return {
        url: `${base}/v1/models`,
        headers: { "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01" },
      };
    case "gemini":
      // Gemini passe la clé en paramètre de requête plutôt qu'en en-tête.
      return { url: `${base}/v1beta/models?key=${encodeURIComponent(cfg.apiKey)}`, headers: {} };
    default:
      return { url: `${base}/models`, headers: { authorization: `Bearer ${cfg.apiKey}` } };
  }
}

/** Extrait les identifiants de modèles, quelle que soit la forme de réponse. */
export function parseModelIds(json: unknown): string[] {
  const root = json as Record<string, unknown>;
  const list = Array.isArray(root?.data) ? root.data : Array.isArray(root?.models) ? root.models : [];
  const ids = list
    .map((m) => {
      const id = (m as Record<string, unknown>)?.id ?? (m as Record<string, unknown>)?.name;
      return typeof id === "string" ? id : null;
    })
    .filter((id): id is string => Boolean(id))
    // Gemini préfixe ses noms de « models/ » : on le retire.
    .map((id) => id.replace(/^models\//, ""));
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}

// --- Lecture / écriture côté client (localStorage) -----------------------------

const STORAGE_KEY = "etucuisto:ai-config";

/** Config BYOK valide enregistrée sur cet appareil, ou `null` (→ repli sur l'essai). */
export function getAiConfig(): AiConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = AiConfigSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function setAiConfig(cfg: AiConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // Stockage indisponible (navigation privée…) : la config reste en mémoire pour la session.
  }
}

export function clearAiConfig(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignoré
  }
}
