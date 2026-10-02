"use client";

import { useId } from "react";
import type { Recipe } from "@/lib/ai/schemas";
import { formatEur } from "@/lib/format";
import { TOOL_OPTIONS } from "@/lib/kitchen-options";

export type SavedState = { id?: string; favorite: boolean; cooked: boolean };

type Props = {
  recipe: Recipe;
  saved: SavedState;
  busy: boolean;
  onFavorite: () => void;
  onCooked: () => void;
};

const TOOL_LABEL = Object.fromEntries(TOOL_OPTIONS.map((o) => [o.id, o.label]));

export function RecipeCard({ recipe, saved, busy, onFavorite, onCooked }: Props) {
  const id = useId();
  const fromFridge = recipe.ingredients.filter((i) => i.pantryItemId);
  const toBuy = recipe.missing;
  const cost = toBuy.reduce((sum, m) => sum + m.estimatedPriceEur, 0);

  return (
    <article aria-labelledby={`${id}-title`} className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <header className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-xl font-semibold">
          {recipe.title}
        </h2>
        <p className="text-muted">{recipe.summary}</p>
        <ul role="list" className="mt-1 flex flex-wrap gap-2 text-sm">
          <li className="rounded-full bg-surface px-3 py-1">
            <span aria-hidden="true">⏱ </span>
            {recipe.minutes} min
          </li>
          <li className="rounded-full bg-surface px-3 py-1">
            {recipe.servings} pers.
          </li>
          <li className="rounded-full bg-surface px-3 py-1">
            {toBuy.length ? `${formatEur(cost)} à acheter` : "Rien à acheter"}
          </li>
          {recipe.rescuesPantryItemIds.length > 0 && (
            <li className="rounded-full bg-warn-bg px-3 py-1 text-warn-fg">
              <span aria-hidden="true">♻️ </span>
              Sauve {recipe.rescuesPantryItemIds.length} ingrédient
              {recipe.rescuesPantryItemIds.length > 1 ? "s" : ""}
            </li>
          )}
        </ul>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby={`${id}-fridge`}>
          <h3 id={`${id}-fridge`} className="mb-1 font-medium">
            De ton frigo
          </h3>
          <ul role="list" className="flex flex-col gap-0.5 text-sm">
            {fromFridge.map((i) => (
              <li key={`${i.pantryItemId}-${i.name}`}>
                <span aria-hidden="true">✓ </span>
                {i.name} <span className="text-muted">· {i.amount}</span>
                {recipe.rescuesPantryItemIds.includes(i.pantryItemId!) && (
                  <span className="text-warn-fg"> (bientôt périmé)</span>
                )}
              </li>
            ))}
          </ul>
        </section>
        {toBuy.length > 0 && (
          <section aria-labelledby={`${id}-buy`}>
            <h3 id={`${id}-buy`} className="mb-1 font-medium">
              À acheter
            </h3>
            <ul role="list" className="flex flex-col gap-0.5 text-sm">
              {toBuy.map((m) => (
                <li key={m.name}>
                  <span aria-hidden="true">+ </span>
                  {m.name} <span className="text-muted">· ~{formatEur(m.estimatedPriceEur)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <p className="text-sm text-muted">
        Ustensiles : {recipe.tools.map((t) => TOOL_LABEL[t] ?? t).join(", ")}
      </p>

      <details className="rounded-lg bg-surface px-4 py-3">
        <summary className="cursor-pointer font-medium">Voir les étapes ({recipe.steps.length})</summary>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5">
          {recipe.steps.map((step, n) => (
            <li key={n}>{step}</li>
          ))}
        </ol>
      </details>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCooked}
          disabled={busy || saved.cooked}
          className="rounded-lg bg-accent-strong px-4 py-2.5 font-medium text-on-accent disabled:opacity-60"
        >
          {saved.cooked ? "✓ Cuisiné" : "J'ai cuisiné ça"}
          <span className="visually-hidden"> : {recipe.title}</span>
        </button>
        <button
          type="button"
          aria-pressed={saved.favorite}
          onClick={onFavorite}
          disabled={busy}
          className="rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-surface disabled:opacity-60"
        >
          <span aria-hidden="true">{saved.favorite ? "★ " : "☆ "}</span>
          Favori<span className="visually-hidden"> : {recipe.title}</span>
        </button>
      </div>
    </article>
  );
}
