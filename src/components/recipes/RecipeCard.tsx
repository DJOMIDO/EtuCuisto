"use client";

import { Check, ChefHat, ChevronDown, Clock, Heart, Plus, Recycle, Trash2, Users, UtensilsCrossed, Wallet } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useId } from "react";
import type { Recipe } from "@/lib/ai/schemas";
import { button, card, Pill } from "../ui";

export type SavedState = { id?: string; favorite: boolean; cooked: boolean };

type Props = {
  recipe: Recipe;
  saved: SavedState;
  busy: boolean;
  onFavorite: () => void;
  onCooked: () => void;
  /** Page Favoris : on peut refaire une recette déjà cuisinée, et la supprimer. */
  allowRecook?: boolean;
  note?: string;
  onDelete?: () => void;
};

export function RecipeCard({ recipe, saved, busy, onFavorite, onCooked, allowRecook, note, onDelete }: Props) {
  const id = useId();
  const t = useTranslations();
  const format = useFormatter();
  const eur = (value: number) => format.number(value, { style: "currency", currency: "EUR" });
  const fromFridge = recipe.ingredients.filter((i) => i.pantryItemId);
  const toBuy = recipe.missing;
  const cost = toBuy.reduce((sum, m) => sum + m.estimatedPriceEur, 0);

  return (
    <article aria-labelledby={`${id}-title`} className={`${card} flex flex-col gap-5`}>
      <header className="flex flex-col gap-2">
        <div>
          <h2 id={`${id}-title`} className="text-xl font-extrabold leading-tight">
            {recipe.title}
          </h2>
          <p className="mt-1 text-muted">{recipe.summary}</p>
          {note && <p className="mt-1 text-sm font-semibold text-muted">{note}</p>}
        </div>
        <ul role="list" className="flex flex-wrap gap-2">
          <li>
            <Pill icon={Clock}>{t("recipeCard.minutes", { count: recipe.minutes })}</Pill>
          </li>
          <li>
            <Pill icon={Users}>{t("recipeCard.servings", { count: recipe.servings })}</Pill>
          </li>
          <li>
            <Pill icon={Wallet} tone={toBuy.length ? "neutral" : "herb"}>
              {toBuy.length ? t("recipeCard.toBuy", { amount: eur(cost) }) : t("recipeCard.nothingToBuy")}
            </Pill>
          </li>
          {recipe.rescuesPantryItemIds.length > 0 && (
            <li>
              <Pill icon={Recycle} tone="sun">
                {t("recipeCard.rescues", { count: recipe.rescuesPantryItemIds.length })}
              </Pill>
            </li>
          )}
        </ul>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby={`${id}-fridge`}>
          <h3 id={`${id}-fridge`} className="mb-1.5 text-sm font-extrabold uppercase tracking-wide text-muted">
            {t("recipeCard.fromFridge")}
          </h3>
          <ul role="list" className="flex flex-col gap-1">
            {fromFridge.map((i) => (
              <li key={`${i.pantryItemId}-${i.name}`} className="flex items-start gap-2">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-strong" strokeWidth={3} />
                <span>
                  <span className="font-semibold">{i.name}</span> <span className="text-muted">· {i.amount}</span>
                  {recipe.rescuesPantryItemIds.includes(i.pantryItemId!) && (
                    <span className="ml-1 rounded-full bg-sun-soft px-2 text-xs font-bold text-sun-ink">
                      {t("recipeCard.useSoon")}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
        {toBuy.length > 0 && (
          <section aria-labelledby={`${id}-buy`}>
            <h3 id={`${id}-buy`} className="mb-1.5 text-sm font-extrabold uppercase tracking-wide text-muted">
              {t("recipeCard.buy")}
            </h3>
            <ul role="list" className="flex flex-col gap-1">
              {toBuy.map((m) => (
                <li key={m.name} className="flex items-start gap-2">
                  <Plus aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-cherry-ink" strokeWidth={3} />
                  <span>
                    <span className="font-semibold">{m.name}</span>{" "}
                    <span className="text-muted">· ~{eur(m.estimatedPriceEur)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <p className="flex items-center gap-2 text-sm text-muted">
        <UtensilsCrossed aria-hidden="true" className="size-4" />
        {format.list(recipe.tools.map((tool) => t(`kitchen.toolOptions.${tool}`)), { type: "conjunction" })}
      </p>

      <details className="group rounded-2xl bg-surface-muted">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl px-4 py-3 font-bold [&::-webkit-details-marker]:hidden">
          {t("recipeCard.steps", { count: recipe.steps.length })}
          <ChevronDown aria-hidden="true" className="size-5 transition group-open:rotate-180" />
        </summary>
        <ol className="flex flex-col gap-3 px-4 pb-4">
          {recipe.steps.map((step, n) => (
            <li key={n} className="flex gap-3">
              <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-extrabold text-accent-strong">
                {n + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </details>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCooked}
          disabled={busy || (saved.cooked && !allowRecook)}
          className={button.primary}
        >
          {saved.cooked && !allowRecook ? (
            <Check aria-hidden="true" className="size-5" strokeWidth={3} />
          ) : (
            <ChefHat aria-hidden="true" className="size-5" />
          )}
          {t(allowRecook ? "recipeCard.recook" : saved.cooked ? "recipeCard.cooked" : "recipeCard.cook")}
          <span className="visually-hidden">{t("common.forItem", { name: recipe.title })}</span>
        </button>
        <button
          type="button"
          aria-pressed={saved.favorite}
          onClick={onFavorite}
          disabled={busy}
          className={saved.favorite ? button.favoriteOn : button.secondary}
        >
          <Heart aria-hidden="true" className={`size-5 ${saved.favorite ? "fill-current" : ""}`} />
          {t("recipeCard.favorite")}
          <span className="visually-hidden">{t("common.forItem", { name: recipe.title })}</span>
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} disabled={busy} className={`${button.iconDanger} ml-auto`}>
            <Trash2 aria-hidden="true" className="size-5" />
            <span className="visually-hidden">
              {t("recipeCard.delete")}
              {t("common.forItem", { name: recipe.title })}
            </span>
          </button>
        )}
      </div>
    </article>
  );
}
