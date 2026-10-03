import { LOCALE_COOKIE, THEME_COOKIE, type AppLocale, type Theme } from "@/i18n/locales";

const ONE_YEAR = 60 * 60 * 24 * 365;

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

/** Thème de cet appareil : appliqué tout de suite, et lu par le serveur aux prochains chargements. */
export function applyTheme(theme: Theme) {
  setCookie(THEME_COOKIE, theme);
  document.documentElement.dataset.theme = theme;
}

/** Langue de cet appareil (le serveur la lit à chaque requête ; penser à router.refresh()). */
export function setLocaleCookie(locale: AppLocale) {
  setCookie(LOCALE_COOKIE, locale);
}
