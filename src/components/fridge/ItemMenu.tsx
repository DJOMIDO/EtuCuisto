"use client";

import { AlarmClock, EllipsisVertical, Trash2 } from "lucide-react";
import { useId, useRef } from "react";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import type { PantryItem } from "@/lib/client/use-pantry";
import { CategoryIcon } from "../CategoryIcon";
import { button } from "../ui";

type Props = {
  item: PantryItem;
  onToggleExpiring: (item: PantryItem) => void;
  onRemove: (item: PantryItem) => void;
  onChangeCategory: (item: PantryItem, category: CategoryId) => void;
};

// Actions d'un ingrédient dans une feuille du bas (Popover API, fermeture au clic dehors / Échap).
export function ItemMenu({ item, onToggleExpiring, onRemove, onChangeCategory }: Props) {
  const id = useId();
  const sheet = useRef<HTMLDivElement>(null);

  function run(action: (item: PantryItem) => void) {
    sheet.current?.hidePopover();
    action(item);
  }

  return (
    <>
      <button type="button" popoverTarget={id} className={button.icon}>
        <EllipsisVertical aria-hidden="true" className="size-5" />
        <span className="visually-hidden">Actions : {item.name}</span>
      </button>
      <div ref={sheet} id={id} popover="auto" className="sheet" aria-labelledby={`${id}-title`}>
        <div className="m-3 flex flex-col gap-1 rounded-3xl bg-surface p-3 shadow-card">
          <p id={`${id}-title`} className="px-3 pb-1 pt-2 text-lg font-extrabold">
            {item.name}
            {item.quantity && <span className="font-semibold text-muted"> · {item.quantity}</span>}
          </p>
          <button
            type="button"
            onClick={() => run(onToggleExpiring)}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold hover:bg-surface-muted"
          >
            <AlarmClock aria-hidden="true" className="size-5 text-sun-ink" />
            {item.expiresSoon ? "Ce n'est plus urgent" : "Marquer « à utiliser vite »"}
          </button>
          <button
            type="button"
            onClick={() => run(onRemove)}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold text-cherry-ink hover:bg-cherry-soft"
          >
            <Trash2 aria-hidden="true" className="size-5" />
            Retirer du frigo
          </button>
          <div className="mt-1 border-t border-border px-3 pt-3">
            <p id={`${id}-cat`} className="mb-2 text-sm font-bold text-muted">
              Catégorie
            </p>
            <div role="group" aria-labelledby={`${id}-cat`} className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={item.category === c.id}
                  onClick={() => run((i) => item.category !== c.id && onChangeCategory(i, c.id))}
                  className="flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center text-xs font-semibold leading-tight hover:bg-surface-muted aria-pressed:bg-accent-soft aria-pressed:text-accent-strong"
                >
                  <CategoryIcon category={c.id} size="sm" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" popoverTarget={id} popoverTargetAction="hide" className={`${button.ghost} mt-1 py-3`}>
            Annuler
          </button>
        </div>
      </div>
    </>
  );
}
