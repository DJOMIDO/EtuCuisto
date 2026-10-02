"use client";

import { useEffect, useId, useRef } from "react";
import type { Recipe } from "@/lib/ai/schemas";
import type { PantryItem } from "@/lib/client/use-pantry";

type Props = {
  recipe: Recipe | null;
  pantry: PantryItem[];
  onConfirm: (ids: string[]) => void;
  onClose: () => void;
};

// Confirme quels ingrédients du frigo ont été utilisés avant de les retirer.
export function CookedDialog({ recipe, pantry, onConfirm, onClose }: Props) {
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (recipe && !dialog.open) dialog.showModal();
    if (!recipe && dialog.open) dialog.close();
  }, [recipe]);

  const used = recipe
    ? pantry.filter((p) => recipe.ingredients.some((i) => i.pantryItemId === p.id))
    : [];

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onConfirm(new FormData(e.currentTarget).getAll("used").map(String));
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={`${id}-title`}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-xl bg-background p-0 text-foreground backdrop:bg-black/50"
    >
      {recipe && (
        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5">
          <h2 id={`${id}-title`} className="text-lg font-semibold">
            Bravo ! On retire quoi du frigo ?
          </h2>
          {used.length === 0 ? (
            <p className="text-muted">Ces ingrédients ne sont plus dans ton frigo.</p>
          ) : (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm text-muted">Décoche ce qu&apos;il te reste encore.</legend>
              {used.map((p) => (
                <label key={p.id} className="flex items-center gap-3">
                  <input type="checkbox" name="used" value={p.id} defaultChecked className="size-5 accent-[var(--accent-strong)]" />
                  <span>
                    {p.name}
                    {p.quantity && <span className="text-muted"> · {p.quantity}</span>}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded-lg bg-accent-strong px-4 py-2.5 font-medium text-on-accent">
              Valider
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 font-medium">
              Annuler
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
