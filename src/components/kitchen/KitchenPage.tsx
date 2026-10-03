"use client";

import { Check, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { KitchenProfile } from "@/lib/ai/schemas";
import { useKitchen } from "@/lib/client/use-kitchen";
import { BUDGET_OPTIONS, DIET_OPTIONS, TOOL_OPTIONS } from "@/lib/kitchen-options";
import { button, card, choiceChip, PageTitle } from "../ui";

const LEGEND = "mb-3 text-lg font-extrabold";
const CHECK_CHIP = `${choiceChip} pr-4 [&:not(:has(:checked))>svg]:hidden`;

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
    <main id="content" tabIndex={-1} className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-4">
      <PageTitle title="Ma cuisine" subtitle="Pour ne te proposer que des recettes que tu peux vraiment faire." />

      {loadError && <p role="alert" className="text-sm font-semibold text-cherry-ink">{loadError}</p>}

      {!loaded ? (
        <p className="text-muted">Chargement…</p>
      ) : (
        // `key` : réinitialise le formulaire quand les réglages arrivent de l'API.
        <form key={JSON.stringify(kitchen)} onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className={card}>
            <fieldset aria-describedby={`${ids}-tools-hint`}>
            <legend className={LEGEND}>Ustensiles</legend>
            <p id={`${ids}-tools-hint`} className="-mt-2 mb-3 text-sm text-muted">
              Coche seulement ce que tu as vraiment.
            </p>
            <div className="flex flex-wrap gap-2">
              {TOOL_OPTIONS.map((o) => (
                <label key={o.id} className={CHECK_CHIP}>
                  <input type="checkbox" name="tools" value={o.id} defaultChecked={kitchen.tools.includes(o.id)} className="sr-only" />
                  <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
          </div>

          <div className={card}>
            <fieldset>
            <legend className={LEGEND}>Budget</legend>
            <div className="flex flex-col gap-2">
              {BUDGET_OPTIONS.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3 has-[:checked]:bg-accent-soft has-[:checked]:ring-2 has-[:checked]:ring-accent-strong"
                >
                  <input
                    type="radio"
                    name="budget"
                    value={o.id}
                    defaultChecked={kitchen.budget === o.id}
                    aria-describedby={`${ids}-budget-${o.id}`}
                    className="size-5 shrink-0 accent-[var(--accent-strong)]"
                  />
                  <span className="flex flex-col">
                    <span className="font-bold">{o.label}</span>
                    <span id={`${ids}-budget-${o.id}`} className="text-sm text-muted">
                      {o.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          </div>

          <div className={card}>
            <fieldset>
            <legend className={LEGEND}>Régime alimentaire</legend>
            <div className="flex flex-wrap gap-2">
              {DIET_OPTIONS.map((o) => (
                <label key={o.id} className={CHECK_CHIP}>
                  <input type="checkbox" name="diet" value={o.id} defaultChecked={kitchen.diet.includes(o.id)} className="sr-only" />
                  <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
          </div>

          <div className={`${card} flex items-center justify-between gap-3`}>
            <label htmlFor={`${ids}-servings`} className="text-lg font-extrabold">
              Nombre de personnes
            </label>
            <ServingsStepper id={`${ids}-servings`} defaultValue={kitchen.servings} />
          </div>

          {error && <p role="alert" className="text-sm font-semibold text-cherry-ink">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving} className={button.primary}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            {status && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-herb-ink" aria-hidden="true">
                <Check className="size-4" strokeWidth={3} />
                {status}
              </span>
            )}
          </div>

          {isGuest && (
            <p className="text-sm text-muted">
              Mode invité : réglages gardés sur cet appareil.{" "}
              <Link href="/connexion" className="font-bold text-accent-strong underline">
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

function ServingsStepper({ id, defaultValue }: { id: string; defaultValue: number }) {
  const [value, setValue] = useState(defaultValue);
  const step = (delta: number) => setValue((v) => Math.min(8, Math.max(1, v + delta)));
  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-muted p-1">
      <button type="button" onClick={() => step(-1)} disabled={value <= 1} className={`${button.icon} size-9 bg-surface`}>
        <Minus aria-hidden="true" className="size-4" />
        <span className="visually-hidden">Une personne de moins</span>
      </button>
      <input
        id={id}
        name="servings"
        type="number"
        inputMode="numeric"
        min={1}
        max={8}
        required
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-10 bg-transparent text-center text-lg font-extrabold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" onClick={() => step(1)} disabled={value >= 8} className={`${button.icon} size-9 bg-surface`}>
        <Plus aria-hidden="true" className="size-4" />
        <span className="visually-hidden">Une personne de plus</span>
      </button>
    </div>
  );
}
