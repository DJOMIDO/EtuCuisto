"use client";

import { UtensilsCrossed } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { CategoryId } from "@/lib/categories";
import { STORAGES, storageOf, type StorageId } from "@/lib/storage";
import { usePantry, type PantryItem } from "@/lib/client/use-pantry";
import { AddIngredients } from "./AddIngredients";
import { PantryList } from "./PantryList";
import { STORAGE_ICONS } from "./storageIcons";
import { choiceChip, PageTitle } from "../ui";

export function FridgePage() {
  const ids = useId();
  const t = useTranslations();
  const pantry = usePantry();
  const [zone, setZone] = useState<StorageId>("frigo");
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
  const changeStorage = (item: PantryItem, storage: StorageId) =>
    run(
      () => pantry.update(item.id, { storage }),
      t("fridge.statusStorage", { name: item.name, zone: t(`storageZones.${storage}`) }),
    );

  // Le badge d'une zone compte ce que ses groupes affichent (l'urgence reste visible partout).
  const zoneCount = (s: StorageId) => pantry.items.filter((i) => !i.expiresSoon && storageOf(i) === s).length;

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
        <EmptyKitchen />
      ) : (
        <>
          <fieldset className="grid grid-cols-3 gap-2">
            <legend className="visually-hidden">{t("fridge.zonesLabel")}</legend>
            {STORAGES.map(({ id: s }) => {
              const Icon = STORAGE_ICONS[s];
              return (
                <label key={s} className={`${choiceChip} gap-1.5 justify-center py-2.5`}>
                  <input
                    type="radio"
                    name={`${ids}-zone`}
                    value={s}
                    checked={zone === s}
                    onChange={() => setZone(s)}
                    className="sr-only"
                  />
                  <Icon aria-hidden="true" className="size-5" />
                  {t(`storageZones.${s}`)}
                  <span className="text-sm font-bold opacity-70 tabular-nums">{zoneCount(s)}</span>
                </label>
              );
            })}
          </fieldset>

          <h2 className="mt-2 flex items-baseline justify-between text-xl font-extrabold">
            {t("fridge.listTitle", { zone })}
            <span className="text-sm font-bold text-muted">{t("fridge.count", { count: zoneCount(zone) })}</span>
          </h2>
          <PantryList
            items={pantry.items}
            zone={zone}
            onToggleExpiring={toggle}
            onRemove={remove}
            onChangeCategory={changeCategory}
            onChangeStorage={changeStorage}
          />
        </>
      )}

      {/* Une seule zone d'annonces pour les lecteurs d'écran. */}
      <p role="status" className="visually-hidden">
        {status}
      </p>
    </main>
  );
}

function EmptyKitchen() {
  const t = useTranslations("fridge");
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
        <UtensilsCrossed className="size-8" />
      </span>
      <p className="text-lg font-extrabold">{t("emptyTitle")}</p>
      <p className="max-w-sm text-muted">{t("emptyText")}</p>
    </div>
  );
}
