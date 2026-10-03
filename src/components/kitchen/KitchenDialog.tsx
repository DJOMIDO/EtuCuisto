"use client";

import { Check, Minus, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { BUDGET_IDS, DIET_IDS, KitchenProfile, TOOL_IDS } from "@/lib/ai/schemas";
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
  const t = useTranslations();
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
    if (!parsed.success) return setError(t("kitchen.invalid"));
    if (parsed.data.tools.length === 0) return setError(t("kitchen.noTool"));
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
                {t(firstTime ? "kitchen.titleFirst" : "kitchen.title")}
              </h2>
              <p id={`${ids}-intro`} className="mt-1 text-muted">
                {t(firstTime ? "kitchen.introFirst" : "kitchen.intro")}
              </p>
            </div>
            <button type="button" onClick={onClose} className={button.icon}>
              <X aria-hidden="true" className="size-5" />
              <span className="visually-hidden">{t("common.close")}</span>
            </button>
          </div>

          <div className="flex flex-col gap-5 overflow-y-auto px-6 py-4">
            <fieldset aria-describedby={`${ids}-tools-hint`}>
              <legend className={LEGEND}>{t("kitchen.tools")}</legend>
              <p id={`${ids}-tools-hint`} className="-mt-2 mb-3 text-sm text-muted">
                {t("kitchen.toolsHint")}
              </p>
              <div className="flex flex-wrap gap-2">
                {TOOL_IDS.map((tool) => (
                  <label key={tool} className={CHECK_CHIP}>
                    <input type="checkbox" name="tools" value={tool} defaultChecked={kitchen.tools.includes(tool)} className="sr-only" />
                    <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                    {t(`kitchen.toolOptions.${tool}`)}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className={SECTION}>
              <legend className={`${LEGEND} float-left w-full`}>{t("kitchen.budget")}</legend>
              <div className="clear-left flex flex-col gap-2">
                {BUDGET_IDS.map((budget) => (
                  <label
                    key={budget}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3 has-[:checked]:bg-accent-soft has-[:checked]:ring-2 has-[:checked]:ring-accent-strong"
                  >
                    <input
                      type="radio"
                      name="budget"
                      value={budget}
                      defaultChecked={kitchen.budget === budget}
                      aria-describedby={`${ids}-budget-${budget}`}
                      className="size-5 shrink-0 accent-[var(--accent-strong)]"
                    />
                    <span className="flex flex-col">
                      <span className="font-bold">{t(`kitchen.budgetOptions.${budget}`)}</span>
                      <span id={`${ids}-budget-${budget}`} className="text-sm text-muted">
                        {t(`kitchen.budgetHints.${budget}`)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className={SECTION}>
              <legend className={`${LEGEND} float-left w-full`}>{t("kitchen.diet")}</legend>
              <div className="clear-left flex flex-wrap gap-2">
                {DIET_IDS.map((diet) => (
                  <label key={diet} className={CHECK_CHIP}>
                    <input type="checkbox" name="diet" value={diet} defaultChecked={kitchen.diet.includes(diet)} className="sr-only" />
                    <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                    {t(`kitchen.dietOptions.${diet}`)}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={`${SECTION} flex items-center justify-between gap-3`}>
              <label htmlFor={`${ids}-servings`} className="text-lg font-extrabold">
                {t("kitchen.servings")}
              </label>
              <ServingsStepper id={`${ids}-servings`} defaultValue={kitchen.servings} />
            </div>

            {isGuest && <p className="text-sm text-muted">{t("kitchen.guestNote")}</p>}
          </div>

          <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
            {error && <p role="alert" className="text-sm font-semibold text-cherry-ink">{error}</p>}
            <button type="submit" disabled={saving} className={`${button.primary} w-full py-3`}>
              {t(saving ? "common.saving" : firstTime ? "kitchen.saveAndFind" : "common.save")}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}

function ServingsStepper({ id, defaultValue }: { id: string; defaultValue: number }) {
  const t = useTranslations("kitchen");
  const [value, setValue] = useState(defaultValue);
  const step = (delta: number) => setValue((v) => Math.min(8, Math.max(1, v + delta)));
  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-muted p-1">
      <button type="button" onClick={() => step(-1)} disabled={value <= 1} className={button.stepper}>
        <Minus aria-hidden="true" className="size-4" />
        <span className="visually-hidden">{t("fewer")}</span>
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
      <button type="button" onClick={() => step(1)} disabled={value >= 8} className={button.stepper}>
        <Plus aria-hidden="true" className="size-4" />
        <span className="visually-hidden">{t("more")}</span>
      </button>
    </div>
  );
}
