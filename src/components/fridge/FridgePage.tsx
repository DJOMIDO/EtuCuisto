"use client";

import { Refrigerator } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CategoryId } from "@/lib/categories";
import { usePantry, type PantryItem } from "@/lib/client/use-pantry";
import { AddIngredients } from "./AddIngredients";
import { PantryList } from "./PantryList";
import { PageTitle } from "../ui";

export function FridgePage() {
  const t = useTranslations();
  const pantry = usePantry();
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>, success: string) {
    setError(null);
    try {
      await action();
      setStatus(success);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const toggle = (item: PantryItem) =>
    run(
      () => pantry.update(item.id, { expiresSoon: !item.expiresSoon }),
      t(item.expiresSoon ? "fridge.statusExpiringOff" : "fridge.statusExpiringOn", { name: item.name }),
    );
  const remove = (item: PantryItem) => run(() => pantry.remove(item.id), t("fridge.statusRemoved", { name: item.name }));
  const changeCategory = (item: PantryItem, category: CategoryId) =>
    run(
      () => pantry.update(item.id, { category }),
      t("fridge.statusCategory", { name: item.name, category: t(`categories.${category}`) }),
    );

  return (
    <main id="content" tabIndex={-1} className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-4">
      <PageTitle title={t("fridge.title")} subtitle={t("fridge.subtitle")} />

      <AddIngredients onAdd={pantry.add} announce={setStatus} />

      {(error ?? pantry.error) && (
        <p role="alert" className="text-sm font-semibold text-cherry-ink">
          {error ?? pantry.error}
        </p>
      )}

      {!pantry.loaded ? (
        <p className="text-muted">{t("fridge.loading")}</p>
      ) : pantry.items.length === 0 ? (
        <EmptyFridge />
      ) : (
        <>
          <h2 className="mt-2 flex items-baseline justify-between text-xl font-extrabold">
            {t("fridge.listTitle")}
            <span className="text-sm font-bold text-muted">{t("fridge.count", { count: pantry.items.length })}</span>
          </h2>
          <PantryList items={pantry.items} onToggleExpiring={toggle} onRemove={remove} onChangeCategory={changeCategory} />
        </>
      )}

      {/* Une seule zone d'annonces pour les lecteurs d'écran. */}
      <p role="status" className="visually-hidden">
        {status}
      </p>
    </main>
  );
}

function EmptyFridge() {
  const t = useTranslations("fridge");
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
        <Refrigerator className="size-8" />
      </span>
      <p className="text-lg font-extrabold">{t("emptyTitle")}</p>
      <p className="max-w-sm text-muted">{t("emptyText")}</p>
    </div>
  );
}
