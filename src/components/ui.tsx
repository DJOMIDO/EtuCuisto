import type { LucideIcon } from "lucide-react";

// Styles partagés : une seule façon de faire un bouton, une carte, un champ.

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:pointer-events-none disabled:opacity-50";

export const button = {
  primary: `${BUTTON_BASE} bg-accent px-5 py-2.5 text-on-accent shadow-sm hover:brightness-95`,
  secondary: `${BUTTON_BASE} bg-accent-soft px-5 py-2.5 text-accent-strong hover:brightness-95`,
  ghost: `${BUTTON_BASE} px-3 py-2 text-muted hover:bg-surface-muted hover:text-foreground`,
  icon: `${BUTTON_BASE} size-10 shrink-0 text-muted hover:bg-surface-muted hover:text-foreground`,
  // Variantes complètes plutôt que des classes ajoutées par-dessus : deux utilitaires
  // sur la même propriété (bg, size, text) ne se départagent pas de façon fiable.
  iconDanger: `${BUTTON_BASE} size-10 shrink-0 text-muted hover:bg-cherry-soft hover:text-cherry-ink`,
  iconSun: `${BUTTON_BASE} size-10 shrink-0 bg-sun-soft text-sun-ink`,
  stepper: `${BUTTON_BASE} size-9 shrink-0 bg-surface text-muted hover:text-foreground`,
  favoriteOn: `${BUTTON_BASE} bg-cherry-soft px-5 py-2.5 text-cherry-ink hover:brightness-95`,
  // Rouge foncé fixe : texte blanc lisible (≥ 4.5:1) en clair comme en sombre.
  danger: `${BUTTON_BASE} bg-[#b3261e] px-5 py-2.5 text-white shadow-sm hover:brightness-110`,
};

export const card = "rounded-3xl bg-surface p-5 shadow-card";

export const field =
  "w-full rounded-2xl border border-field/60 bg-surface px-4 py-3 placeholder:text-muted/70 focus-visible:border-accent-strong";

/** Pastille radio/case stylée en bouton (input sr-only à l'intérieur). */
export const choiceChip =
  "inline-flex cursor-pointer items-center gap-2 rounded-full bg-surface-muted px-4 py-2 font-semibold text-foreground has-[:checked]:bg-accent has-[:checked]:text-on-accent";

export type Tone = "cherry" | "lagoon" | "sun" | "herb" | "neutral" | "accent";

// Classes écrites en entier pour que Tailwind les détecte.
export const TONE: Record<Tone, string> = {
  cherry: "bg-cherry-soft text-cherry-ink",
  lagoon: "bg-lagoon-soft text-lagoon-ink",
  sun: "bg-sun-soft text-sun-ink",
  herb: "bg-herb-soft text-herb-ink",
  neutral: "bg-neutral-soft text-neutral-ink",
  accent: "bg-accent-soft text-accent-strong",
};

export function Pill({ icon: Icon, tone = "neutral", children }: { icon?: LucideIcon; tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${TONE[tone]}`}>
      {Icon && <Icon aria-hidden="true" className="size-4" />}
      {children}
    </span>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-1 text-muted">{subtitle}</p>
    </div>
  );
}
