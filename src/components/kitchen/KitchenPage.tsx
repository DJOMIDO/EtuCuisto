"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { KitchenProfile } from "@/lib/ai/schemas";
import { useKitchen } from "@/lib/client/use-kitchen";
import { BUDGET_OPTIONS, DIET_OPTIONS, TOOL_OPTIONS } from "@/lib/kitchen-options";

const FIELDSET = "flex flex-col gap-3 rounded-xl border border-border p-4";
const LEGEND = "px-1 text-lg font-semibold";
const CHOICE =
  "flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 has-[:checked]:border-accent-strong has-[:checked]:bg-surface";
const INPUT = "size-5 shrink-0 accent-[var(--accent-strong)]";

export function KitchenPage() {
  const ids = useId();
  const { kitchen, loaded, error: loadError, isGuest, save } = useKitchen();
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = KitchenProfile.safeParse({
      tools: form.getAll("tools"),
      budget: form.get("budget"),
      diet: form.getAll("diet"),
      servings: Number(form.get("servings")),
    });
    setStatus("");
    if (!parsed.success) return setError("Vérifie les réglages : nombre de personnes entre 1 et 8.");
    if (parsed.data.tools.length === 0) return setError("Coche au moins un ustensile.");
    setError(null);
    setSaving(true);
    try {
      await save(parsed.data);
      setStatus("Réglages enregistrés.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main id="content" tabIndex={-1} className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Ma cuisine</h1>
        <p className="text-muted">Pour ne te proposer que des recettes que tu peux vraiment faire.</p>
      </div>

      {loadError && <p role="alert" className="text-sm text-danger">{loadError}</p>}

      {!loaded ? (
        <p className="text-muted">Chargement…</p>
      ) : (
        // `key` : réinitialise le formulaire quand les réglages arrivent de l'API.
        <form key={JSON.stringify(kitchen)} onSubmit={onSubmit} className="flex flex-col gap-5">
          <fieldset className={FIELDSET} aria-describedby={`${ids}-tools-hint`}>
            <legend className={LEGEND}>Ustensiles</legend>
            <p id={`${ids}-tools-hint`} className="text-sm text-muted">
              Coche seulement ce que tu as vraiment.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TOOL_OPTIONS.map((o) => (
                <label key={o.id} className={CHOICE}>
                  <input type="checkbox" name="tools" value={o.id} defaultChecked={kitchen.tools.includes(o.id)} className={INPUT} />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={FIELDSET}>
            <legend className={LEGEND}>Budget</legend>
            <div className="flex flex-col gap-2">
              {BUDGET_OPTIONS.map((o) => (
                <label key={o.id} className={CHOICE}>
                  <input
                    type="radio"
                    name="budget"
                    value={o.id}
                    defaultChecked={kitchen.budget === o.id}
                    aria-describedby={`${ids}-budget-${o.id}`}
                    className={INPUT}
                  />
                  <span className="flex flex-col">
                    {o.label}
                    <span id={`${ids}-budget-${o.id}`} className="text-sm text-muted">
                      {o.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={FIELDSET}>
            <legend className={LEGEND}>Régime alimentaire</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DIET_OPTIONS.map((o) => (
                <label key={o.id} className={CHOICE}>
                  <input type="checkbox" name="diet" value={o.id} defaultChecked={kitchen.diet.includes(o.id)} className={INPUT} />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className={FIELDSET}>
            <label htmlFor={`${ids}-servings`} className="text-lg font-semibold">
              Nombre de personnes
            </label>
            <input
              id={`${ids}-servings`}
              name="servings"
              type="number"
              inputMode="numeric"
              min={1}
              max={8}
              required
              defaultValue={kitchen.servings}
              className="w-24 rounded-lg border border-border bg-transparent px-3 py-2"
            />
          </div>

          {error && <p role="alert" className="text-sm text-danger">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent-strong px-5 py-2.5 font-medium text-on-accent disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            {status && (
              <span className="text-sm text-muted" aria-hidden="true">
                <span aria-hidden="true">✓ </span>
                {status}
              </span>
            )}
          </div>

          {isGuest && (
            <p className="text-sm text-muted">
              Mode invité : réglages gardés sur cet appareil.{" "}
              <Link href="/connexion" className="font-medium text-accent-strong underline">
                Connecte-toi
              </Link>{" "}
              pour les retrouver partout.
            </p>
          )}
        </form>
      )}

      <p role="status" className="visually-hidden">
        {status}
      </p>
    </main>
  );
}
