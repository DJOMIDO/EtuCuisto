"use client";

import { PartyPopper } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";
import type { Recipe } from "@/lib/ai/schemas";
import type { PantryItem } from "@/lib/client/use-pantry";
import { CategoryIcon } from "../CategoryIcon";
import { button } from "../ui";

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
  const t = useTranslations();

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
      className="m-auto w-[min(28rem,calc(100%-1.5rem))] rounded-3xl bg-surface p-0 text-foreground shadow-card backdrop:bg-black/40"
    >
      {recipe && (
        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-6">
          <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-sun-soft text-sun-ink">
            <PartyPopper className="size-6" />
          </span>
          <div>
            <h2 id={`${id}-title`} className="text-xl font-extrabold">
              {t("cookedDialog.title")}
            </h2>
          </div>
          {used.length === 0 ? (
            <p className="text-muted">{t("cookedDialog.gone")}</p>
          ) : (
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-2 text-sm text-muted">{t("cookedDialog.hint")}</legend>
              {used.map((p) => (
                <label key={p.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-surface-muted">
                  <input type="checkbox" name="used" value={p.id} defaultChecked className="size-5 shrink-0 accent-[var(--accent-strong)]" />
                  <CategoryIcon category={p.category} size="sm" />
                  <span className="font-semibold">
                    {p.name}
                    {p.quantity && <span className="font-normal text-muted"> · {p.quantity}</span>}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={button.primary}>
              {t("common.validate")}
            </button>
            <button type="button" onClick={onClose} className={button.ghost}>
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
