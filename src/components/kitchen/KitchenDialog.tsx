"use client";

import { Check, Minus, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { ALLERGEN_IDS, CUISINE_IDS, HABIT_IDS, KitchenProfile, TOOL_IDS } from "@/lib/ai/schemas";
import { button, choiceChip, field } from "../ui";

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

// Groupes cochables + saisie libre. Budget et personnes se règlent sur la page recettes.
type GroupKey = "tools" | "allergies" | "habits" | "avoided" | "cuisines";
const GROUP_MAX: Record<GroupKey, number> = { tools: 20, allergies: 30, habits: 15, avoided: 30, cuisines: 25 };

// Réglages de la cuisine (ustensiles, allergènes, régime, cuisines) dans une fenêtre modale.
export function KitchenDialog({ open, kitchen, firstTime, isGuest, onSave, onSaved, onClose }: Props) {
  const ids = useId();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

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
        <KitchenForm
          key={JSON.stringify(kitchen)}
          ids={ids}
          kitchen={kitchen}
          firstTime={firstTime}
          isGuest={isGuest}
          onSave={onSave}
          onSaved={onSaved}
          onClose={onClose}
        />
      )}
    </dialog>
  );
}

// Remonté à chaque ouverture (via `key`) : ses états internes repartent des réglages enregistrés.
function KitchenForm({ ids, kitchen, firstTime, isGuest, onSave, onSaved, onClose }: Omit<Props, "open"> & { ids: string }) {
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sel, setSel] = useState<Record<GroupKey, string[]>>(() => ({
    tools: kitchen.tools,
    allergies: kitchen.allergies,
    habits: kitchen.habits,
    avoided: kitchen.avoided,
    cuisines: kitchen.cuisines,
  }));
  const [drafts, setDrafts] = useState<Record<GroupKey, string>>({
    tools: "",
    allergies: "",
    habits: "",
    avoided: "",
    cuisines: "",
  });

  // Libellé d'une pastille : les presets sont traduits, une saisie libre s'affiche telle quelle.
  const labelFor = (base: string) => (id: string) => {
    const key = `${base}.${id}` as unknown as Parameters<typeof t>[0];
    return t.has(key) ? t(key) : id;
  };

  function commit(group: GroupKey, list: string[], value: string) {
    const name = value.trim().toLowerCase();
    if (!name || name.length > 40 || list.includes(name) || list.length >= GROUP_MAX[group]) return list;
    return [...list, name];
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Un texte resté dans un champ est enregistré dans son groupe avant validation.
    const next: Record<GroupKey, string[]> = {
      tools: commit("tools", sel.tools, drafts.tools),
      allergies: commit("allergies", sel.allergies, drafts.allergies),
      habits: commit("habits", sel.habits, drafts.habits),
      avoided: commit("avoided", sel.avoided, drafts.avoided),
      cuisines: commit("cuisines", sel.cuisines, drafts.cuisines),
    };
    setSel(next);
    // Budget et personnes inchangés ici : ils se règlent sur la page recettes.
    const parsed = KitchenProfile.safeParse({
      tools: next.tools,
      budget: kitchen.budget,
      allergies: next.allergies,
      habits: next.habits,
      avoided: next.avoided,
      cuisines: next.cuisines,
      servings: kitchen.servings,
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

  const groupProps = (group: GroupKey, options: readonly string[], base: string) => ({
    options,
    labelOf: labelFor(base),
    value: sel[group],
    onChange: (v: string[]) => setSel((prev) => ({ ...prev, [group]: v })),
    draft: drafts[group],
    setDraft: (s: string) => setDrafts((prev) => ({ ...prev, [group]: s })),
    max: GROUP_MAX[group],
  });

  return (
    <form onSubmit={onSubmit} className="flex max-h-[90dvh] flex-col">
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
        <ChipInput title={t("kitchen.tools")} hint={t("kitchen.toolsHint")} divider={false} {...groupProps("tools", TOOL_IDS, "kitchen.toolOptions")} />
        <ChipInput title={t("kitchen.allergens")} hint={t("kitchen.allergensHint")} {...groupProps("allergies", ALLERGEN_IDS, "kitchen.allergenOptions")} />
        <ChipInput title={t("kitchen.habits")} hint={t("kitchen.habitsHint")} {...groupProps("habits", HABIT_IDS, "kitchen.habitOptions")} />
        <ChipInput title={t("kitchen.avoided")} hint={t("kitchen.avoidedHint")} {...groupProps("avoided", [], "kitchen.toolOptions")} />
        <ChipInput title={t("kitchen.cuisines")} hint={t("kitchen.cuisinesHint")} {...groupProps("cuisines", CUISINE_IDS, "kitchen.cuisineOptions")} />

        {isGuest && <p className="text-sm text-muted">{t("kitchen.guestNote")}</p>}
      </div>

      <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
        {error && <p role="alert" className="text-sm font-semibold text-cherry-ink">{error}</p>}
        <button type="submit" disabled={saving} className={`${button.primary} w-full py-3`}>
          {t(saving ? "common.saving" : firstTime ? "kitchen.saveAndFind" : "common.save")}
        </button>
      </div>
    </form>
  );
}

// Pastilles prédéfinies + champ de saisie libre pour ajouter ses propres options.
type ChipInputProps = {
  title: string;
  hint?: string;
  options: readonly string[];
  labelOf: (id: string) => string;
  value: string[];
  onChange: (value: string[]) => void;
  draft: string;
  setDraft: (value: string) => void;
  max: number;
  divider?: boolean;
};

function ChipInput({ title, hint, options, labelOf, value, onChange, draft, setDraft, max, divider = true }: ChipInputProps) {
  const t = useTranslations("kitchen");
  const customs = value.filter((v) => !options.includes(v));

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : value.length < max ? [...value, id] : value);

  const add = () => {
    const name = draft.trim().toLowerCase();
    if (!name || name.length > 40 || value.includes(name) || value.length >= max) return setDraft("");
    onChange([...value, name]);
    setDraft("");
  };

  return (
    <fieldset className={divider ? SECTION : undefined}>
      <legend className={LEGEND}>{title}</legend>
      {hint && <p className="-mt-2 mb-3 text-sm text-muted">{hint}</p>}

      {(options.length > 0 || customs.length > 0) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {options.map((id) => (
            <label key={id} className={CHECK_CHIP}>
              <input type="checkbox" checked={value.includes(id)} onChange={() => toggle(id)} className="sr-only" />
              <Check aria-hidden="true" className="size-4" strokeWidth={3} />
              {labelOf(id)}
            </label>
          ))}
          {customs.map((item) => (
            <span key={item} className={`${choiceChip} cursor-default pr-2`}>
              {item}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== item))}
                className="grid size-6 place-items-center rounded-full text-muted hover:bg-surface hover:text-foreground"
              >
                <X aria-hidden="true" className="size-3.5" strokeWidth={3} />
                <span className="visually-hidden">{t("removeOption", { item })}</span>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          maxLength={40}
          placeholder={t("customPlaceholder")}
          aria-label={title}
          className={`${field} min-w-0 py-2`}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim() || value.length >= max}
          className={`${button.secondary} shrink-0 whitespace-nowrap`}
        >
          <Plus aria-hidden="true" className="size-4" />
          {t("addOption")}
        </button>
      </div>
    </fieldset>
  );
}

// Sélecteur de personnes, piloté depuis la page recettes (réglage rapide).
export function ServingsStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const t = useTranslations("kitchen");
  const step = (delta: number) => onChange(Math.min(8, Math.max(1, value + delta)));
  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-muted p-1">
      <button type="button" onClick={() => step(-1)} disabled={value <= 1} className={button.stepper}>
        <Minus aria-hidden="true" className="size-4" />
        <span className="visually-hidden">{t("fewer")}</span>
      </button>
      <span aria-live="polite" className="w-10 text-center text-lg font-extrabold tabular-nums">
        {value}
      </span>
      <button type="button" onClick={() => step(1)} disabled={value >= 8} className={button.stepper}>
        <Plus aria-hidden="true" className="size-4" />
        <span className="visually-hidden">{t("more")}</span>
      </button>
    </div>
  );
}
