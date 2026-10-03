import { DEFAULT_LOCALE, isLocale, type AppLocale } from "@/i18n/locales";

// Repli quand le serveur ne renvoie pas de JSON (ex. page 504 de l'hébergeur).
// Mêmes textes que « common.genericError » dans messages/*.json, gardés ici pour ne pas
// embarquer tous les fichiers de traduction dans ce module.
const GENERIC_ERROR: Record<AppLocale, string> = {
  fr: "Une erreur est survenue, réessaie.",
  en: "Something went wrong, please try again.",
  "zh-Hans": "出了点问题，请再试一次。",
  "zh-Hant": "出了點問題，請再試一次。",
};

function genericError() {
  const lang = typeof document === "undefined" ? undefined : document.documentElement.lang;
  return GENERIC_ERROR[isLocale(lang) ? lang : DEFAULT_LOCALE];
}

/** fetch JSON qui lève une Error avec le message d'erreur (déjà traduit) renvoyé par l'API. */
export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = init?.body instanceof FormData ? undefined : { "content-type": "application/json" };
  const res = await fetch(input, { ...init, headers: { ...headers, ...init?.headers } });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? genericError());
  return data as T;
}
