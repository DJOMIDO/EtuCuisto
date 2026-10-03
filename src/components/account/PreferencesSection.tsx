"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { isLocale, LOCALE_NAMES, LOCALES, THEMES, type AppLocale, type Theme } from "@/i18n/locales";
import { fetchJson } from "@/lib/client/fetch-json";
import { applyTheme, setLocaleCookie } from "@/lib/client/preferences";
import { card, choiceChip, field } from "../ui";

type Props = { initialTheme: Theme; signedIn: boolean };

export function PreferencesSection({ initialTheme, signedIn }: Props) {
  const ids = useId();
  const t = useTranslations("profile");
  const router = useRouter();
  const locale = useLocale();
  const [theme, setTheme] = useState(initialTheme);
  const [pending, startTransition] = useTransition();

  function changeTheme(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  async function changeLocale(next: AppLocale) {
    setLocaleCookie(next);
    // Langue liée au compte : synchronisée sur les autres appareils à la connexion.
    if (signedIn) await fetchJson("/api/settings", { method: "PUT", body: JSON.stringify({ locale: next }) }).catch(() => {});
    startTransition(() => router.refresh());
  }

  return (
    <section aria-labelledby={`${ids}-title`} className={`${card} flex flex-col gap-5`}>
      <h2 id={`${ids}-title`} className="text-lg font-extrabold">
        {t("preferences")}
      </h2>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${ids}-locale`} className="text-sm font-bold text-muted">
          {t("language")}
        </label>
        {/* Liste native : reste compacte quelle que soit le nombre de langues (sélecteur système sur mobile). */}
        <div className="relative">
          <select
            id={`${ids}-locale`}
            value={locale}
            disabled={pending}
            onChange={(e) => {
              if (isLocale(e.target.value)) changeLocale(e.target.value);
            }}
            className={`${field} appearance-none pr-11 font-semibold disabled:opacity-60`}
          >
            {LOCALES.map((code) => (
              <option key={code} value={code} lang={code}>
                {LOCALE_NAMES[code]}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-muted">{t("appearance")}</legend>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((option) => (
            <label key={option} className={choiceChip}>
              <input
                type="radio"
                name="theme"
                value={option}
                checked={theme === option}
                onChange={() => changeTheme(option)}
                className="sr-only"
              />
              {t(`themes.${option}`)}
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
