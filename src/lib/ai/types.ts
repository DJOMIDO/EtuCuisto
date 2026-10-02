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

export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const AI_ERRORS = {
  refused: () => new AiError("La demande a été refusée par le modèle.", 422),
  incomplete: () => new AiError("Réponse incomplète du modèle, réessaie.", 502),
  busy: () => new AiError("Trop de demandes en ce moment, réessaie dans une minute.", 503),
  unavailable: () => new AiError("Le service de recettes est indisponible, réessaie.", 502),
  misconfigured: () => new AiError("Service indisponible.", 500),
};
