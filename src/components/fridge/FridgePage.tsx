"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePantry, type PantryItem } from "@/lib/client/use-pantry";
import { CATEGORIES } from "@/lib/ingredients";
import { AddIngredients } from "./AddIngredients";
import { PantryList } from "./PantryList";

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
      item.expiresSoon ? `${item.name} n'est plus marqué comme bientôt périmé.` : `${item.name} marqué bientôt périmé.`,
    );
  const remove = (item: PantryItem) => run(() => pantry.remove(item.id), `${item.name} retiré du frigo.`);

  return (
    <main id="content" tabIndex={-1} className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Mon frigo</h1>
        <p className="text-muted">Ce que tu as sous la main. Les recettes partiront de là.</p>
      </div>

      {pantry.isGuest && pantry.loaded && (
        <p className="rounded-lg bg-surface px-4 py-3 text-sm">
          Mode invité : ton frigo est gardé sur cet appareil.{" "}
          <Link href="/connexion" className="font-medium text-accent-strong underline">
            Connecte-toi
          </Link>{" "}
          pour le retrouver partout.
        </p>
      )}

      <AddIngredients onAdd={pantry.add} announce={setStatus} />

      {(error ?? pantry.error) && (
        <p role="alert" className="text-sm text-danger">
          {error ?? pantry.error}
        </p>
      )}

      {!pantry.loaded ? (
        <p className="text-muted">Chargement du frigo…</p>
      ) : pantry.items.length === 0 ? (
        <EmptyFridge />
      ) : (
        <>
          <p className="text-sm text-muted">
            {pantry.items.length} ingrédient{pantry.items.length > 1 ? "s" : ""}
          </p>
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
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border px-4 py-8 text-center">
      <div className="grid grid-cols-5 gap-3" aria-hidden="true">
        {CATEGORIES.slice(0, 5).map((c) => (
          <Image key={c.id} src={c.icon} alt="" width={36} height={36} />
        ))}
      </div>
      <p className="font-medium">Ton frigo est vide.</p>
      <p className="max-w-sm text-sm text-muted">
        Prends une photo de ton frigo ou écris ce que tu as : on s&apos;occupe de trier.
      </p>
    </div>
  );
}
