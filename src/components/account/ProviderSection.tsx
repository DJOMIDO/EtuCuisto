"use client";

import { ChevronDown, KeyRound, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import {
  AI_PROVIDER_IDS,
  AiConfigSchema,
  clearAiConfig,
  getAiConfig,
  PROVIDERS,
  setAiConfig,
  type AiConfig,
  type AiProviderId,
} from "@/lib/ai/config";
import { fetchJson } from "@/lib/client/fetch-json";
import { button, card, field } from "../ui";
import { ModelCombobox } from "./ModelCombobox";

// Noms de marque : identiques dans toutes les langues, donc hors fichiers i18n.
const PROVIDER_LABELS: Record<AiProviderId, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
  custom: "Compatible OpenAI",
};

// Modèle indicatif proposé par défaut avant le chargement de la liste.
const PLACEHOLDER_MODEL: Record<AiProviderId, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-5",
  gemini: "gemini-2.0-flash",
  openrouter: "openai/gpt-4o-mini",
  custom: "modèle",
};

export function ProviderSection() {
  const ids = useId();
  const t = useTranslations("profile.provider");
  const [provider, setProvider] = useState<AiProviderId>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Réserve la config déjà enregistrée sur cet appareil.
  useEffect(() => {
    const cfg = getAiConfig();
    if (!cfg) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique de localStorage au montage
    setProvider(cfg.provider);
    setApiKey(cfg.apiKey);
    setBaseUrl(cfg.baseUrl ?? "");
    setModel(cfg.model);
  }, []);

  const isCustom = provider === "custom";
  const keyUrl = PROVIDERS[provider].keyUrl;

  function reset(next?: Partial<AiConfig>) {
    setSaved(false);
    if (next) {
      setProvider(next.provider ?? provider);
      setApiKey(next.apiKey ?? apiKey);
      setBaseUrl(next.baseUrl ?? baseUrl);
      setModel(next.model ?? model);
    }
  }

  async function loadModels() {
    setStatus(null);
    const cfg = AiConfigSchema.safeParse({ provider, apiKey, model: model || "x", baseUrl: baseUrl || undefined });
    if (!cfg.success || apiKey.trim().length === 0 || (isCustom && !baseUrl.trim())) {
      setStatus(t(isCustom && !baseUrl.trim() ? "needUrl" : "needKey"));
      return;
    }
    setLoading(true);
    try {
      const data = await fetchJson<{ models: string[] }>("/api/ai/models", {
        method: "POST",
        body: JSON.stringify({ provider, apiKey, baseUrl: baseUrl || undefined }),
      });
      setModels(data.models);
      if (!model && data.models.length) setModel(data.models[0]);
      setStatus(data.models.length ? t("modelsLoaded", { count: data.models.length }) : t("noModels"));
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function save() {
    setStatus(null);
    const parsed = AiConfigSchema.safeParse({
      provider,
      apiKey,
      model,
      baseUrl: baseUrl.trim() || undefined,
    });
    if (!parsed.success) {
      setStatus(t(!apiKey.trim() ? "needKey" : !model.trim() ? "needModel" : "needUrl"));
      return;
    }
    setAiConfig(parsed.data);
    setSaved(true);
  }

  function clear() {
    clearAiConfig();
    setApiKey("");
    setModel("");
    setBaseUrl("");
    setModels([]);
    setStatus(null);
    setSaved(false);
  }

  return (
    <section aria-labelledby={`${ids}-title`} className={`${card} flex flex-col gap-5`}>
      <div>
        <h2 id={`${ids}-title`} className="text-lg font-extrabold">
          {t("title")}
        </h2>
        <p className="text-sm text-muted">{t("intro")}</p>
      </div>

      {/* Fournisseur */}
      <div className="flex flex-col gap-2">
        <label htmlFor={`${ids}-provider`} className="text-sm font-bold text-muted">
          {t("service")}
        </label>
        <div className="relative">
          <select
            id={`${ids}-provider`}
            value={provider}
            onChange={(e) => {
              reset({ provider: e.target.value as AiProviderId, model: "" });
              setModels([]);
            }}
            className={`${field} appearance-none pr-11 font-semibold`}
          >
            {AI_PROVIDER_IDS.map((id) => (
              <option key={id} value={id}>
                {PROVIDER_LABELS[id]}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
        </div>
      </div>

      {/* URL de base, seulement pour un point de terminaison personnalisé */}
      {isCustom && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-base`} className="text-sm font-bold text-muted">
            {t("baseUrl")}
          </label>
          <input
            id={`${ids}-base`}
            type="url"
            value={baseUrl}
            onChange={(e) => reset({ baseUrl: e.target.value })}
            placeholder="https://exemple.com/v1"
            className={field}
          />
        </div>
      )}

      {/* Clé API */}
      <div className="flex flex-col gap-2">
        <label htmlFor={`${ids}-key`} className="text-sm font-bold text-muted">
          {t("apiKey")}
        </label>
        <div className="flex items-center gap-2">
          <input
            id={`${ids}-key`}
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(e) => reset({ apiKey: e.target.value })}
            placeholder="sk-…"
            className={field}
          />
          <button
            type="button"
            onClick={clear}
            aria-label={t("clear")}
            disabled={!apiKey && !model}
            className={`${button.icon} shrink-0`}
          >
            <Trash2 aria-hidden="true" className="size-5" />
          </button>
        </div>
        {keyUrl ? (
          <a href={keyUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent-strong underline">
            {t("getKey")}
          </a>
        ) : (
          <p className="text-sm text-muted">{t("customHint")}</p>
        )}
      </div>

      {/* Modèle + chargement de la liste */}
      <div className="flex flex-col gap-2">
        <label htmlFor={`${ids}-model`} className="text-sm font-bold text-muted">
          {t("model")}
        </label>
        <div className="flex items-center gap-2">
          <ModelCombobox
            id={`${ids}-model`}
            value={model}
            onChange={(v) => reset({ model: v })}
            options={models}
            placeholder={PLACEHOLDER_MODEL[provider]}
            className={field}
            listLabel={t("modelList")}
          />
          <button type="button" onClick={loadModels} disabled={loading} className={`${button.secondary} shrink-0 !px-4`}>
            <KeyRound aria-hidden="true" className="size-5" />
            {loading ? t("loadingModels") : t("loadModels")}
          </button>
        </div>
        <p className="text-sm text-muted">{t("modelHint")}</p>
      </div>

      {status && (
        <p role="status" className="text-sm font-semibold text-muted">
          {status}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="button" onClick={save} className={button.primary}>
          {t("save")}
        </button>
        {saved && (
          <span className="text-sm font-semibold text-herb-ink">{t("saved")}</span>
        )}
      </div>
    </section>
  );
}
