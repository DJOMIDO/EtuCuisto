import type { z } from "zod";

export type AiTask = "textParse" | "vision" | "recipes";

export const IMAGE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type ImageMediaType = (typeof IMAGE_MEDIA_TYPES)[number];

export type StructuredRequest<T extends z.ZodType> = {
  task: AiTask;
  system: string;
  text: string;
  image?: { mediaType: ImageMediaType; base64: string };
  schema: T;
  /** Réponse factice utilisée quand AI_PROVIDER=mock. */
  mock: () => z.infer<T>;
};

export type AiProvider = {
  generate<T extends z.ZodType>(req: StructuredRequest<T>): Promise<z.infer<T>>;
};

export type AiErrorCode = "refused" | "incomplete" | "busy" | "unavailable" | "misconfigured";

/** Erreur IA : un code (traduit par lib/api.ts) et le statut HTTP à renvoyer. */
export class AiError extends Error {
  constructor(
    readonly code: AiErrorCode,
    readonly status: number,
  ) {
    super(code);
  }
}

export const AI_ERRORS = {
  refused: () => new AiError("refused", 422),
  incomplete: () => new AiError("incomplete", 502),
  busy: () => new AiError("busy", 503),
  unavailable: () => new AiError("unavailable", 502),
  misconfigured: () => new AiError("misconfigured", 500),
};
