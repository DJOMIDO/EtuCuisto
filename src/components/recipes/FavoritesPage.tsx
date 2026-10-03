"use client";

import { ChefHat, Heart, LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Recipe } from "@/lib/ai/schemas";
import { authClient } from "@/lib/auth/client";
import { fetchJson } from "@/lib/client/fetch-json";
import { usePantry } from "@/lib/client/use-pantry";
import { CookedDialog } from "./CookedDialog";
import { RecipeCard } from "./RecipeCard";
import { button, choiceChip, PageTitle } from "../ui";

type SavedRecipe = { id: string; data: Recipe; favorite: boolean; cookedAt: string | null };
type Filter = "all" | "favorite" | "cooked";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "favorite", label: "Favoris" },
  { id: "cooked", label: "Déjà cuisinées" },
];

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

export function FavoritesPage() {
  const { data: session, isPending } = authClient.useSession();
  const signedIn = !!session?.user;
  const pantry = usePantry();
  const [rows, setRows] = useState<SavedRecipe[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cooking, setCooking] = useState<SavedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!signedIn) return;
    fetchJson<{ recipes: SavedRecipe[] }>("/api/recipes")
      .then((d) => setRows(d.recipes))
      .catch((e: Error) => setError(e.message));
  }, [signedIn]);

  async function run(id: string, action: () => Promise<void>, message: string) {
    setBusyId(id);
    setError(null);
    try {
      await action();
      setStatus(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const replace = (row: SavedRecipe) => setRows((prev) => prev?.map((r) => (r.id === row.id ? row : r)) ?? null);

  const toggleFavorite = (row: SavedRecipe) =>
    run(
      row.id,
      async () => {
        const d = await fetchJson<{ recipe: SavedRecipe }>(`/api/recipes/${row.id}`, {
          method: "PATCH",
          body: JSON.stringify({ favorite: !row.favorite }),
        });
        replace(d.recipe);
      },
      row.favorite ? "Retirée des favoris." : "Ajoutée aux favoris.",
    );

  const remove = (row: SavedRecipe) => {
    if (!confirm(`Supprimer « ${row.data.title} » ?`)) return;
    run(
      row.id,
      async () => {
        await fetchJson(`/api/recipes/${row.id}`, { method: "DELETE" });
        setRows((prev) => prev?.filter((r) => r.id !== row.id) ?? null);
      },
      "Recette supprimée.",
    );
  };

  function confirmCooked(usedIds: string[]) {
    const row = cooking!;
    setCooking(null);
    run(
      row.id,
      async () => {
        if (usedIds.length) await pantry.consume(usedIds);
        const d = await fetchJson<{ recipe: SavedRecipe }>(`/api/recipes/${row.id}`, {
          method: "PATCH",
          body: JSON.stringify({ cooked: true }),
        });
        replace(d.recipe);
      },
      "Bon appétit !",
    );
  }

  const shown =
    rows?.filter((r) => (filter === "favorite" ? r.favorite : filter === "cooked" ? !!r.cookedAt : true)) ?? [];

  return (
    <main id="content" tabIndex={-1} className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-4">
      <PageTitle title="Mes recettes" subtitle="Tes favoris et ce que tu as déjà cuisiné." />

      {isPending ? null : !signedIn ? (
        <EmptyState
          message="Connecte-toi pour garder tes recettes favorites et ton historique."
          action={
            <Link href="/connexion" className={button.primary}>
              <LogIn aria-hidden="true" className="size-5" />
              Connexion
            </Link>
          }
        />
      ) : (
        <>
          <fieldset>
            <legend className="visually-hidden">Afficher</legend>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <label key={f.id} className={choiceChip}>
                  <input
                    type="radio"
                    name="filter"
                    checked={filter === f.id}
                    onChange={() => setFilter(f.id)}
                    className="sr-only"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p role="alert" className="text-sm font-semibold text-cherry-ink">{error}</p>}

          {rows === null ? (
            !error && <p className="text-muted">Chargement…</p>
          ) : shown.length === 0 ? (
            <EmptyState
              message={rows.length === 0 ? "Aucune recette enregistrée pour l'instant." : "Rien dans cette catégorie."}
              action={
                <Link href="/recettes" className={button.secondary}>
                  <ChefHat aria-hidden="true" className="size-5" />
                  Trouver des recettes
                </Link>
              }
            />
          ) : (
            shown.map((row) => (
              <RecipeCard
                key={row.id}
                recipe={row.data}
                saved={{ id: row.id, favorite: row.favorite, cooked: !!row.cookedAt }}
                busy={busyId === row.id}
                allowRecook
                note={row.cookedAt ? `Cuisinée le ${DATE.format(new Date(row.cookedAt))}` : undefined}
                onFavorite={() => toggleFavorite(row)}
                onCooked={() => setCooking(row)}
                onDelete={() => remove(row)}
              />
            ))
          )}
        </>
      )}

      <CookedDialog
        recipe={cooking?.data ?? null}
        pantry={pantry.items}
        onConfirm={confirmCooked}
        onClose={() => setCooking(null)}
      />

      <p role="status" className="visually-hidden">
        {status}
      </p>
    </main>
  );
}

function EmptyState({ message, action }: { message: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-cherry-soft text-cherry-ink">
        <Heart className="size-8" />
      </span>
      <p className="max-w-sm text-muted">{message}</p>
      {action}
    </div>
  );
}
