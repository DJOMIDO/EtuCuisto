"use client";

import { AlarmClock } from "lucide-react";
import type { PantryItem } from "@/lib/client/use-pantry";
import { CATEGORIES } from "@/lib/ingredients";
import { CategoryIcon } from "../CategoryIcon";
import { card } from "../ui";
import { ItemMenu } from "./ItemMenu";

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
    <div className="flex flex-col gap-4">
      {expiring.length > 0 && (
        <section aria-labelledby="fridge-expiring" className="rounded-3xl bg-sun-soft p-5">
          <h2 id="fridge-expiring" className="mb-2 flex items-center gap-2 text-lg font-extrabold text-sun-ink">
            <AlarmClock aria-hidden="true" className="size-5" />À utiliser vite
          </h2>
          <ItemRows items={expiring} showCategory onToggleExpiring={onToggleExpiring} onRemove={onRemove} />
        </section>
      )}
      {groups.length > 0 && (
        <div className={`${card} flex flex-col gap-5`}>
          {groups.map((g) => (
            <section key={g.id} aria-labelledby={`fridge-${g.id}`}>
              <h2 id={`fridge-${g.id}`} className="mb-1 flex items-center gap-2.5 font-extrabold">
                <CategoryIcon category={g.id} size="sm" />
                {g.label}
              </h2>
              <ItemRows items={g.items} onToggleExpiring={onToggleExpiring} onRemove={onRemove} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemRows({ items, showCategory, ...actions }: Props & { showCategory?: boolean }) {
  return (
    <ul role="list" className="flex flex-col">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-1 pl-1">
          {showCategory && <CategoryIcon category={item.category} size="sm" onColor />}
          <span className={`flex-1 font-semibold ${showCategory ? "" : "pl-[2.625rem]"}`}>
            {item.name}
            {item.quantity && <span className="font-normal text-muted"> · {item.quantity}</span>}
          </span>
          <ItemMenu item={item} {...actions} />
        </li>
      ))}
    </ul>
  );
}
