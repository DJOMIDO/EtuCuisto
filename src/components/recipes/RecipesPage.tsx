"use client";

import { ChefHat, Refrigerator, Settings2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { KitchenProfile, Recipe, Recommendations } from "@/lib/ai/schemas";
import { fetchJson } from "@/lib/client/fetch-json";
import { useKitchen } from "@/lib/client/use-kitchen";
import { usePantry } from "@/lib/client/use-pantry";
import { BUDGET_OPTIONS, TOOL_OPTIONS } from "@/lib/kitchen-options";
import { KitchenDialog } from "../kitchen/KitchenDialog";
import { CookedDialog } from "./CookedDialog";
import { RecipeCard, type SavedState } from "./RecipeCard";
import { button, card, choiceChip, PageTitle } from "../ui";

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
  const { kitchen, configured, loaded: kitchenLoaded, isGuest, save: saveKitchen } = useKitchen();
  // "first" : réglages demandés avant la toute première recherche.
  const [kitchenDialog, setKitchenDialog] = useState<null | "edit" | "first">(null);
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

  async function generate(savedKitchen?: KitchenProfile) {
    if (!configured && !savedKitchen) {
      setKitchenDialog("first");
      return;
    }
    setError(null);
    setStatus("");
    setLoading(true);
    try {
      const body = isGuest ? { maxMinutes, pantry: pantry.items, kitchen: savedKitchen ?? kitchen } : { maxMinutes };
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
      setError("Crée un compte depuis l'onglet Profil pour garder tes recettes favorites.");
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
    <main id="content" tabIndex={-1} className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-4">
      <PageTitle title="Recettes" subtitle="3 idées avec ce que tu as, en priorité ce qui va périmer." />

      <section aria-labelledby={`${ids}-ask`} className={`${card} flex flex-col gap-4`}>
        <h2 id={`${ids}-ask`} className="visually-hidden">
          Demander des recettes
        </h2>
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-muted">Temps maximum</legend>
          <div className="flex flex-wrap gap-2">
            {TIMES.map((t) => (
              <label key={t} className={choiceChip}>
                <input
                  type="radio"
                  name="maxMinutes"
                  value={t}
                  checked={maxMinutes === t}
                  onChange={() => setMaxMinutes(t)}
                  className="sr-only"
                />
                {t} min
              </label>
            ))}
          </div>
        </fieldset>

        <p className="flex items-start gap-2 text-sm text-muted">
          <Settings2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            {configured ? `${tools || "aucun ustensile"} · budget ${budget} · ` : "Ta cuisine n'est pas encore configurée · "}
            <button
              type="button"
              onClick={() => setKitchenDialog("edit")}
              disabled={!kitchenLoaded}
              className="font-bold text-accent-strong underline"
            >
              {configured ? "modifier" : "configurer"}
              <span className="visually-hidden"> ma cuisine</span>
            </button>
          </span>
        </p>

        {empty ? (
          <p className="flex items-center gap-2 rounded-2xl bg-surface-muted px-4 py-3">
            <Refrigerator aria-hidden="true" className="size-5 shrink-0 text-muted" />
            <span>
              Ton frigo est vide.{" "}
              <Link href="/" className="font-bold text-accent-strong underline">
                Ajoute des ingrédients
              </Link>{" "}
              d&apos;abord.
            </span>
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => generate()}
              disabled={loading || !pantry.loaded || !kitchenLoaded}
              className={button.primary}
            >
              <ChefHat aria-hidden="true" className="size-5" />
              {loading ? "Le chef réfléchit…" : recipes ? "Autres idées" : "Trouver des recettes"}
            </button>
            {loading && <span className="text-sm text-muted">Quelques secondes…</span>}
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="text-sm font-semibold text-cherry-ink">
          {error}
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

      <KitchenDialog
        open={kitchenDialog !== null}
        kitchen={kitchen}
        firstTime={kitchenDialog === "first"}
        isGuest={isGuest}
        onSave={saveKitchen}
        onSaved={(saved) => {
          const first = kitchenDialog === "first";
          setKitchenDialog(null);
          setStatus("Réglages de ta cuisine enregistrés.");
          if (first) generate(saved);
        }}
        onClose={() => setKitchenDialog(null)}
      />

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
