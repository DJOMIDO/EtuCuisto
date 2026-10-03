"use client";

import { LogIn, Refrigerator } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePantry, type PantryItem } from "@/lib/client/use-pantry";
import { AddIngredients } from "./AddIngredients";
import { PantryList } from "./PantryList";
import { PageTitle } from "../ui";

export function FridgePage() {
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
      item.expiresSoon ? `${item.name} n'est plus à utiliser vite.` : `${item.name} est à utiliser vite.`,
    );
  const remove = (item: PantryItem) => run(() => pantry.remove(item.id), `${item.name} retiré du frigo.`);

  return (
    <main id="content" tabIndex={-1} className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-4">
      <PageTitle title="Mon frigo" subtitle="Ce que tu as sous la main. Les recettes partiront de là." />

      {pantry.isGuest && pantry.loaded && (
        <p className="flex items-start gap-3 rounded-2xl bg-accent-soft px-4 py-3 text-sm">
          <LogIn aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-strong" />
          <span>
            Mode invité : ton frigo reste sur cet appareil.{" "}
            <Link href="/connexion" className="font-bold text-accent-strong underline">
              Connecte-toi
            </Link>{" "}
            pour le retrouver partout.
          </span>
        </p>
      )}

      <AddIngredients onAdd={pantry.add} announce={setStatus} />

      {(error ?? pantry.error) && (
        <p role="alert" className="text-sm font-semibold text-cherry-ink">
          {error ?? pantry.error}
        </p>
      )}

      {!pantry.loaded ? (
        <p className="text-muted">Chargement du frigo…</p>
      ) : pantry.items.length === 0 ? (
        <EmptyFridge />
      ) : (
        <>
          <h2 className="mt-2 flex items-baseline justify-between text-xl font-extrabold">
            Dans ton frigo
            <span className="text-sm font-bold text-muted">
              {pantry.items.length} ingrédient{pantry.items.length > 1 ? "s" : ""}
            </span>
          </h2>
          <PantryList items={pantry.items} onToggleExpiring={toggle} onRemove={remove} />
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
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
        <Refrigerator className="size-8" />
      </span>
      <p className="text-lg font-extrabold">Ton frigo est vide</p>
      <p className="max-w-sm text-muted">
        Écris ce que tu as ou prends une photo : on s&apos;occupe de trier.
      </p>
    </div>
  );
}
