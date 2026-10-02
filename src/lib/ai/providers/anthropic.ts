import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { AI_ERRORS, AiError, type AiProvider, type AiTask, type StructuredRequest } from "../types";

// Sonnet pour la photo et les recettes, Haiku pour une liste tapée au clavier.
const MODELS: Record<AiTask, string> = {
  vision: "claude-sonnet-5-5",
  recipes: "claude-sonnet-5-5",
  textParse: "claude-haiku-4-5",
};
const EFFORT = { vision: "low", recipes: "medium" } as const;

let client: Anthropic | undefined;

export const anthropicProvider: AiProvider = {
  async generate<T extends z.ZodType>(req: StructuredRequest<T>) {
    client ??= new Anthropic(); // lit ANTHROPIC_API_KEY
    try {
      if (req.task === "textParse") {
        const response = await client.messages.parse({
          model: MODELS.textParse,
          max_tokens: 4000,
          system: req.system,
          messages: [{ role: "user", content: req.text }],
          output_config: { format: zodOutputFormat(req.schema) },
        });
        return unwrap(response.stop_reason, response.parsed_output);
      }

      const content: Anthropic.Beta.BetaContentBlockParam[] = [];
      if (req.image) {
        content.push({
          type: "image",
          source: { type: "base64", media_type: req.image.mediaType, data: req.image.base64 },
        });
      }
      content.push({ type: "text", text: req.text });

      const response = await client.beta.messages.parse({
        model: MODELS[req.task],
        max_tokens: 16000,
        system: req.system,
        messages: [{ role: "user", content }],
        output_config: { effort: EFFORT[req.task], format: betaZodOutputFormat(req.schema) },
        // En cas de refus par un filtre de sécurité, l'API relance sur un modèle de repli.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
      return unwrap(response.stop_reason, response.parsed_output);
    } catch (error) {
      throw toAiError(error);
    }
  },
};

function unwrap<T>(stopReason: string | null, parsed: T | null | undefined): T {
  if (stopReason === "refusal") throw AI_ERRORS.refused();
  if (stopReason === "max_tokens" || parsed == null) throw AI_ERRORS.incomplete();
  return parsed;
}

function toAiError(error: unknown): Error {
  if (error instanceof AiError) return error;
  if (error instanceof Anthropic.RateLimitError) return AI_ERRORS.busy();
  if (error instanceof Anthropic.AuthenticationError) {
    console.error("Clé ANTHROPIC_API_KEY invalide");
    return AI_ERRORS.misconfigured();
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`Claude API ${error.status}:`, error.message);
    return AI_ERRORS.unavailable();
  }
  return error instanceof Error ? error : new Error(String(error));
}
