"use client";

import Image from "next/image";
import type { PantryItem } from "@/lib/client/use-pantry";
import { CATEGORIES } from "@/lib/ingredients";

type Props = {
  items: PantryItem[];
  onToggleExpiring: (item: PantryItem) => void;
  onRemove: (item: PantryItem) => void;
};

export function PantryList({ items, onToggleExpiring, onRemove }: Props) {
  const expiring = items.filter((i) => i.expiresSoon);
  const groups = CATEGORIES.map((c) => ({
    ...c,
    items: items.filter((i) => !i.expiresSoon && i.category === c.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {expiring.length > 0 && (
        <section aria-labelledby="fridge-expiring" className="rounded-xl bg-warn-bg p-4 text-warn-fg">
          <h2 id="fridge-expiring" className="mb-2 font-semibold">
            <span aria-hidden="true">⏰ </span>À utiliser vite
          </h2>
          <ItemRows items={expiring} onToggleExpiring={onToggleExpiring} onRemove={onRemove} />
        </section>
      )}
      {groups.map((g) => (
        <section key={g.id} aria-labelledby={`fridge-${g.id}`}>
          <h2 id={`fridge-${g.id}`} className="mb-2 flex items-center gap-2 font-semibold">
            <Image src={g.icon} alt="" width={28} height={28} />
            {g.label}
          </h2>
          <ItemRows items={g.items} onToggleExpiring={onToggleExpiring} onRemove={onRemove} />
        </section>
      ))}
    </div>
  );
}

function ItemRows({ items, onToggleExpiring, onRemove }: Props) {
  return (
    <ul role="list" className="flex flex-col divide-y divide-border/60">
      {items.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
          <span className="flex-1">
            {item.name}
            {item.quantity && <span className="opacity-75"> · {item.quantity}</span>}
          </span>
          <button
            type="button"
            aria-pressed={item.expiresSoon}
            onClick={() => onToggleExpiring(item)}
            className="rounded-full border border-current px-3 py-1 text-sm opacity-90"
          >
            Bientôt périmé<span className="visually-hidden"> : {item.name}</span>
            <span aria-hidden="true">{item.expiresSoon ? " ✓" : ""}</span>
          </button>
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="rounded-full px-3 py-1 text-sm underline"
          >
            Retirer<span className="visually-hidden"> {item.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
