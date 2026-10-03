"use client";

import { AlarmClock, EllipsisVertical, Trash2 } from "lucide-react";
import { useId, useRef } from "react";
import type { PantryItem } from "@/lib/client/use-pantry";
import { button } from "../ui";

type Props = {
  item: PantryItem;
  onToggleExpiring: (item: PantryItem) => void;
  onRemove: (item: PantryItem) => void;
};

// Actions d'un ingrédient dans une feuille du bas (Popover API, fermeture au clic dehors / Échap).
export function ItemMenu({ item, onToggleExpiring, onRemove }: Props) {
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
          <button type="button" popoverTarget={id} popoverTargetAction="hide" className={`${button.ghost} mt-1 py-3`}>
            Annuler
          </button>
        </div>
      </div>
    </>
  );
}
