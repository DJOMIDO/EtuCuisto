"use client";

import { Check, Minus, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { KitchenProfile } from "@/lib/ai/schemas";
import { BUDGET_OPTIONS, DIET_OPTIONS, TOOL_OPTIONS } from "@/lib/kitchen-options";
import { button, choiceChip } from "../ui";

type Props = {
  open: boolean;
  kitchen: KitchenProfile;
  /** Première recherche : on explique pourquoi on demande, et on enchaîne sur les recettes. */
  firstTime: boolean;
  isGuest: boolean;
  onSave: (kitchen: KitchenProfile) => Promise<void>;
  onSaved: (kitchen: KitchenProfile) => void;
  onClose: () => void;
};

const LEGEND = "mb-3 text-lg font-extrabold";
const SECTION = "border-t border-border pt-5";
const CHECK_CHIP = `${choiceChip} pr-4 [&:not(:has(:checked))>svg]:hidden`;

// Réglages de la cuisine (ustensiles, budget, régime, personnes) dans une fenêtre modale.
export function KitchenDialog({ open, kitchen, firstTime, isGuest, onSave, onSaved, onClose }: Props) {
  const ids = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = KitchenProfile.safeParse({
      tools: form.getAll("tools"),
      budget: form.get("budget"),
      diet: form.getAll("diet"),
      servings: Number(form.get("servings")),
    });
    if (!parsed.success) return setError("Vérifie les réglages : nombre de personnes entre 1 et 8.");
    if (parsed.data.tools.length === 0) return setError("Coche au moins un ustensile.");
    setError(null);
    setSaving(true);
    try {
      await onSave(parsed.data);
      onSaved(parsed.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={`${ids}-title`}
      aria-describedby={`${ids}-intro`}
      className="m-auto max-h-[90dvh] w-[min(34rem,calc(100%-1.5rem))] overflow-hidden rounded-3xl bg-surface p-0 text-foreground shadow-card backdrop:bg-black/40"
    >
      {open && (
        // `key` : repart des réglages enregistrés à chaque ouverture.
        <form key={JSON.stringify(kitchen)} onSubmit={onSubmit} className="flex max-h-[90dvh] flex-col">
          <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-6">
            <div>
              <h2 id={`${ids}-title`} className="text-2xl font-extrabold">
                {firstTime ? "D'abord, ta cuisine" : "Ma cuisine"}
              </h2>
              <p id={`${ids}-intro`} className="mt-1 text-muted">
                {firstTime
                  ? "Dis-moi ce que tu as, pour ne recevoir que des recettes faisables chez toi. Tu pourras changer ça plus tard."
                  : "Pour ne te proposer que des recettes que tu peux vraiment faire."}
              </p>
            </div>
            <button type="button" onClick={onClose} className={button.icon}>
              <X aria-hidden="true" className="size-5" />
              <span className="visually-hidden">Fermer</span>
            </button>
          </div>

          <div className="flex flex-col gap-5 overflow-y-auto px-6 py-4">
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

            <fieldset className={SECTION}>
              <legend className={`${LEGEND} float-left w-full`}>Budget</legend>
              <div className="clear-left flex flex-col gap-2">
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

            <fieldset className={SECTION}>
              <legend className={`${LEGEND} float-left w-full`}>Régime alimentaire</legend>
              <div className="clear-left flex flex-wrap gap-2">
                {DIET_OPTIONS.map((o) => (
                  <label key={o.id} className={CHECK_CHIP}>
                    <input type="checkbox" name="diet" value={o.id} defaultChecked={kitchen.diet.includes(o.id)} className="sr-only" />
                    <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={`${SECTION} flex items-center justify-between gap-3`}>
              <label htmlFor={`${ids}-servings`} className="text-lg font-extrabold">
                Nombre de personnes
              </label>
              <ServingsStepper id={`${ids}-servings`} defaultValue={kitchen.servings} />
            </div>

            {isGuest && <p className="text-sm text-muted">Mode invité : réglages gardés sur cet appareil.</p>}
          </div>

          <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
            {error && <p role="alert" className="text-sm font-semibold text-cherry-ink">{error}</p>}
            <button type="submit" disabled={saving} className={`${button.primary} w-full py-3`}>
              {saving ? "Enregistrement…" : firstTime ? "Enregistrer et trouver des recettes" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}
    </dialog>
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
