"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { Recipe, Recommendations } from "@/lib/ai/schemas";
import { fetchJson } from "@/lib/client/fetch-json";
import { useKitchen } from "@/lib/client/use-kitchen";
import { usePantry } from "@/lib/client/use-pantry";
import { BUDGET_OPTIONS, TOOL_OPTIONS } from "@/lib/kitchen-options";
import { CookedDialog } from "./CookedDialog";
import { RecipeCard, type SavedState } from "./RecipeCard";

const TIMES = [10, 20, 30, 45];
const SESSION_KEY = "etucuisto:last-recipes";

type Session = { recipes: Recipe[]; saved: SavedState[]; maxMinutes: number };

function readSession(): Session | null {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
  } catch {
    return null;
  }
}

function writeSession(session: Session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Pas grave : les recettes restent affichées tant que la page est ouverte.
  }
}

export function RecipesPage() {
  const ids = useId();
  const pantry = usePantry();
  const { kitchen, isGuest } = useKitchen();
  const [maxMinutes, setMaxMinutes] = useState(20);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [saved, setSaved] = useState<SavedState[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [cookingIndex, setCookingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  // Retrouver les dernières recettes de l'onglet (évite un appel IA en revenant sur la page).
  useEffect(() => {
    const session = readSession();
    if (!session) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique de sessionStorage au montage
    setRecipes(session.recipes);
    setSaved(session.saved);
    setMaxMinutes(session.maxMinutes);
  }, []);

  useEffect(() => {
    if (recipes) writeSession({ recipes, saved, maxMinutes });
  }, [recipes, saved, maxMinutes]);

  async function generate() {
    setError(null);
    setStatus("");
    setLoading(true);
    try {
      const body = isGuest ? { maxMinutes, pantry: pantry.items, kitchen } : { maxMinutes };
      const data = await fetchJson<Recommendations>("/api/ai/recipes", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setRecipes(data.recipes);
      setSaved(data.recipes.map(() => ({ favorite: false, cooked: false })));
      setStatus(`${data.recipes.length} recettes trouvées.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function patchSaved(index: number, patch: Partial<SavedState>) {
    setSaved((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  /** Crée la recette en base au premier usage, puis la met à jour. */
  async function persist(index: number, change: { favorite?: boolean; cooked?: true }) {
    const current = saved[index];
    if (current.id) {
      await fetchJson(`/api/recipes/${current.id}`, { method: "PATCH", body: JSON.stringify(change) });
      return current.id;
    }
    const data = await fetchJson<{ recipe: { id: string } }>("/api/recipes", {
      method: "POST",
      body: JSON.stringify({ recipe: recipes![index], favorite: false, cooked: false, ...change }),
    });
    return data.recipe.id;
  }

  async function toggleFavorite(index: number) {
    if (isGuest) {
      setError("Connecte-toi pour garder tes recettes favorites.");
      return;
    }
    const favorite = !saved[index].favorite;
    setBusyIndex(index);
    setError(null);
    try {
      const id = await persist(index, { favorite });
      patchSaved(index, { id, favorite });
      setStatus(favorite ? "Ajoutée aux favoris." : "Retirée des favoris.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyIndex(null);
    }
  }

  async function confirmCooked(usedIds: string[]) {
    const index = cookingIndex!;
    setCookingIndex(null);
    setBusyIndex(index);
    setError(null);
    try {
      if (usedIds.length) await pantry.consume(usedIds);
      const id = isGuest ? undefined : await persist(index, { cooked: true });
      patchSaved(index, { id, cooked: true });
      setStatus(
        usedIds.length
          ? `Bon appétit ! ${usedIds.length} ingrédient${usedIds.length > 1 ? "s" : ""} retiré${usedIds.length > 1 ? "s" : ""} du frigo.`
          : "Bon appétit !",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyIndex(null);
    }
  }

  const tools = kitchen.tools.map((t) => TOOL_OPTIONS.find((o) => o.id === t)?.label ?? t).join(", ");
  const budget = BUDGET_OPTIONS.find((o) => o.id === kitchen.budget)?.label.toLowerCase();
  const empty = pantry.loaded && pantry.items.length === 0;

  return (
    <main id="content" tabIndex={-1} className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Recettes</h1>
        <p className="text-muted">3 idées avec ce que tu as, en priorité ce qui va périmer.</p>
      </div>

      <section aria-labelledby={`${ids}-ask`} className="flex flex-col gap-4 rounded-xl border border-border p-4">
        <h2 id={`${ids}-ask`} className="visually-hidden">
          Demander des recettes
        </h2>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-medium">Temps maximum</legend>
          <div className="flex flex-wrap gap-2">
            {TIMES.map((t) => (
              <label
                key={t}
                className="cursor-pointer rounded-full border border-border px-4 py-1.5 has-[:checked]:border-accent-strong has-[:checked]:bg-accent-strong has-[:checked]:text-on-accent has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent-strong"
              >
                <input
                  type="radio"
                  name="maxMinutes"
                  value={t}
                  checked={maxMinutes === t}
                  onChange={() => setMaxMinutes(t)}
                  className="visually-hidden"
                />
                {t} min
              </label>
            ))}
          </div>
        </fieldset>

        <p className="text-sm text-muted">
          Avec : {tools || "aucun ustensile"} · budget {budget} ·{" "}
          <Link href="/cuisine" className="text-accent-strong underline">
            modifier
          </Link>
        </p>

        {empty ? (
          <p>
            Ton frigo est vide.{" "}
            <Link href="/" className="font-medium text-accent-strong underline">
              Ajoute des ingrédients
            </Link>{" "}
            d&apos;abord.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generate}
              disabled={loading || !pantry.loaded}
              className="rounded-lg bg-accent-strong px-5 py-2.5 font-medium text-on-accent disabled:opacity-60"
            >
              {loading ? "Le chef réfléchit…" : recipes ? "Autres idées" : "Trouver des recettes"}
            </button>
            {loading && <span className="text-sm text-muted">Ça peut prendre une vingtaine de secondes.</span>}
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
          {isGuest && error.startsWith("Connecte-toi") && (
            <>
              {" "}
              <Link href="/connexion" className="font-medium underline">
                Connexion
              </Link>
            </>
          )}
        </p>
      )}

      {recipes?.map((recipe, index) => (
        <RecipeCard
          key={`${recipe.title}-${index}`}
          recipe={recipe}
          saved={saved[index] ?? { favorite: false, cooked: false }}
          busy={busyIndex === index}
          onFavorite={() => toggleFavorite(index)}
          onCooked={() => setCookingIndex(index)}
        />
      ))}

      <CookedDialog
        recipe={cookingIndex === null ? null : recipes![cookingIndex]}
        pantry={pantry.items}
        onConfirm={confirmCooked}
        onClose={() => setCookingIndex(null)}
      />

      <p role="status" className="visually-hidden">
        {status}
      </p>
    </main>
  );
}
