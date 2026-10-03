"use client";

import { AlarmClock, Camera, Plus, WandSparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { ParsedIngredients, PantryItemInput } from "@/lib/ai/schemas";
import { downscaleImage } from "@/lib/client/image";
import { fetchJson } from "@/lib/client/fetch-json";
import { CategoryIcon } from "../CategoryIcon";
import { button, card, field } from "../ui";

type Candidate = PantryItemInput & { key: string; selected: boolean };

type Props = {
  onAdd: (items: PantryItemInput[]) => Promise<void>;
  announce: (message: string) => void;
};

export function AddIngredients({ onAdd, announce }: Props) {
  const ids = useId();
  const t = useTranslations();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<null | "text" | "photo" | "save">(null);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);

  function showCandidates(result: ParsedIngredients) {
    if (result.items.length === 0) {
      setError(t("add.noneFound"));
      return;
    }
    setCandidates(result.items.map((i) => ({ ...i, key: crypto.randomUUID(), selected: true })));
    announce(t("add.found", { count: result.items.length }));
  }

  async function analyzeText(e: React.FormEvent) {
    e.preventDefault();
    setBusy("text");
    setError(null);
    try {
      showCandidates(
        await fetchJson<ParsedIngredients>("/api/ai/parse", {
          method: "POST",
          body: JSON.stringify({ text }),
        }),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function analyzePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de reprendre la même photo
    if (!file) return;
    setBusy("photo");
    setError(null);
    try {
      const form = new FormData();
      form.append("image", await downscaleImage(file), "frigo.jpg");
      showCandidates(await fetchJson<ParsedIngredients>("/api/ai/recognize", { method: "POST", body: form }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function confirmCandidates() {
    const chosen = (candidates ?? []).filter((c) => c.selected);
    if (chosen.length === 0) return setCandidates(null);
    setBusy("save");
    setError(null);
    try {
      await onAdd(chosen.map(({ name, quantity, category, expiresSoon }) => ({ name, quantity, category, expiresSoon })));
      setCandidates(null);
      setText("");
      announce(t("add.added", { count: chosen.length }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  function patchCandidate(key: string, patch: Partial<Candidate>) {
    setCandidates((prev) => prev?.map((c) => (c.key === key ? { ...c, ...patch } : c)) ?? null);
  }

  if (candidates) {
    const count = candidates.filter((c) => c.selected).length;
    return (
      <section aria-labelledby={`${ids}-review`} className={`${card} flex flex-col gap-4`}>
        <div>
          <h2 id={`${ids}-review`} className="text-xl font-extrabold">
            {t("add.reviewTitle")}
          </h2>
          <p className="text-sm text-muted">{t("add.reviewHint")}</p>
        </div>
        <ul role="list" className="flex flex-col gap-1">
          {candidates.map((c) => (
            <li key={c.key} className="flex items-center gap-3">
              <input
                id={`${ids}-${c.key}`}
                type="checkbox"
                checked={c.selected}
                onChange={(e) => patchCandidate(c.key, { selected: e.target.checked })}
                className="size-5 shrink-0 accent-[var(--accent-strong)]"
              />
              <CategoryIcon category={c.category} size="sm" />
              <label htmlFor={`${ids}-${c.key}`} className="flex-1 py-2 font-semibold">
                {c.name}
                {c.quantity && <span className="font-normal text-muted"> · {c.quantity}</span>}
              </label>
              <button
                type="button"
                aria-pressed={c.expiresSoon}
                onClick={() => patchCandidate(c.key, { expiresSoon: !c.expiresSoon })}
                className={c.expiresSoon ? button.iconSun : button.icon}
              >
                <AlarmClock aria-hidden="true" className="size-5" />
                <span className="visually-hidden">{t("add.expiringToggle", { name: c.name })}</span>
              </button>
            </li>
          ))}
        </ul>
        {error && <p role="alert" className="text-sm font-semibold text-cherry-ink">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={confirmCandidates} disabled={busy === "save" || count === 0} className={button.primary}>
            <Plus aria-hidden="true" className="size-5" />
            {busy === "save" ? t("add.adding") : t("add.addCount", { count })}
          </button>
          <button type="button" onClick={() => setCandidates(null)} className={button.ghost}>
            {t("common.cancel")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby={`${ids}-add`} className={`${card} flex flex-col gap-5`}>
      <form onSubmit={analyzeText} className="flex flex-col gap-3">
        <div>
          <h2 id={`${ids}-add`} className="text-xl font-extrabold">
            <label htmlFor={`${ids}-text`}>{t("add.title")}</label>
          </h2>
          <p id={`${ids}-text-hint`} className="text-sm text-muted">
            {t("add.hint")}
          </p>
        </div>
        <textarea
          id={`${ids}-text`}
          aria-describedby={`${ids}-text-hint`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("add.placeholder")}
          required
          maxLength={1000}
          rows={3}
          className={`${field} resize-none`}
        />
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy !== null || !text.trim()} className={button.primary}>
            <WandSparkles aria-hidden="true" className="size-5" />
            {busy === "text" ? t("add.analyzing") : t("add.analyze")}
          </button>
          <label className={`${button.secondary} cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
            <Camera aria-hidden="true" className="size-5" />
            {busy === "photo" ? t("add.analyzingPhoto") : t("add.photo")}
            <input type="file" accept="image/*" onChange={analyzePhoto} disabled={busy !== null} className="sr-only" />
          </label>
        </div>
      </form>

      {error && <p role="alert" className="text-sm font-semibold text-cherry-ink">{error}</p>}
    </section>
  );
}
