"use client";

import { getAiConfig } from "@/lib/ai/config";

// Injecte la config BYOK (si l'utilisateur en a enregistré une) dans les appels
// /api/ai/*. Sans config, le corps reste inchangé → le serveur applique l'essai.

/** Corps JSON d'un appel /api/ai/* : y ajoute le champ `ai` quand une clé est configurée. */
export function withAiConfig<T extends object>(body: T): T & { ai?: unknown } {
  const ai = getAiConfig();
  return ai ? { ...body, ai } : body;
}

/** Formulaire multipart (reconnaissance photo) : y ajoute le champ JSON `ai`. */
export function appendAiConfig(form: FormData): void {
  const ai = getAiConfig();
  if (ai) form.append("ai", JSON.stringify(ai));
}
