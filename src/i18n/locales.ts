// Langues proposées. Ajouter une langue = l'ajouter ici + un fichier messages/<code>.json.
export const LOCALES = ["fr", "en", "zh-Hans", "zh-Hant"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "fr";

export const LOCALE_COOKIE = "locale";
export const THEME_COOKIE = "theme";
export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/** Nom de chaque langue dans sa propre langue (sélecteur du Profil). */
export const LOCALE_NAMES: Record<AppLocale, string> = {
  fr: "Français",
  en: "English",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
};

/** Langue de sortie demandée à l'IA. */
export const AI_LANGUAGE: Record<AppLocale, string> = {
  fr: "français",
  en: "anglais (English)",
  "zh-Hans": "chinois simplifié (简体中文)",
  "zh-Hant": "chinois traditionnel (繁體中文)",
};

export function isLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/** Choisit une langue à partir d'un en-tête Accept-Language (« zh-TW,zh;q=0.9,en;q=0.8 »). */
export function localeFromAcceptLanguage(header: string | null): AppLocale | undefined {
  if (!header) return undefined;
  const tags = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    if (tag.startsWith("zh")) {
      return /^zh-(hant|tw|hk|mo)/.test(tag) ? "zh-Hant" : "zh-Hans";
    }
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return undefined;
}

/** Cookie `locale`, sinon Accept-Language, sinon français. */
export function resolveLocale(cookieValue: string | undefined, acceptLanguage: string | null): AppLocale {
  if (isLocale(cookieValue)) return cookieValue;
  return localeFromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}
