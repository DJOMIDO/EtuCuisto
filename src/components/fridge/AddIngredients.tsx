"use client";

import { useId, useState } from "react";
import type { ParsedIngredients, PantryItemInput } from "@/lib/ai/schemas";
import { downscaleImage } from "@/lib/client/image";
import { fetchJson } from "@/lib/client/fetch-json";
import { findIngredient, INGREDIENTS } from "@/lib/ingredients";

type Candidate = PantryItemInput & { key: string; selected: boolean };

type Props = {
  onAdd: (items: PantryItemInput[]) => Promise<void>;
  announce: (message: string) => void;
};

const BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium disabled:opacity-60";
const PRIMARY = `${BUTTON} bg-accent-strong text-on-accent`;
const SECONDARY = `${BUTTON} border border-border hover:bg-surface`;

export function AddIngredients({ onAdd, announce }: Props) {
  const ids = useId();
  const [text, setText] = useState("");
  const [quick, setQuick] = useState("");
  const [busy, setBusy] = useState<null | "text" | "photo" | "save">(null);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);

  function showCandidates(result: ParsedIngredients) {
    if (result.items.length === 0) {
      setError("Je n'ai trouvé aucun aliment. Essaie de reformuler ou une autre photo.");
      return;
    }
    setCandidates(result.items.map((i) => ({ ...i, key: crypto.randomUUID(), selected: true })));
    announce(`${result.items.length} ingrédient(s) trouvé(s), vérifie la liste avant d'ajouter.`);
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

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = quick.trim().toLowerCase();
    if (!name) return;
    const known = findIngredient(name);
    setError(null);
    try {
      await onAdd([{ name, quantity: null, category: known?.category ?? "autre", expiresSoon: false }]);
      setQuick("");
      announce(`${name} ajouté au frigo.`);
    } catch (err) {
      setError((err as Error).message);
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
      announce(`${chosen.length} ingrédient(s) ajouté(s) au frigo.`);
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
      <section aria-labelledby={`${ids}-review`} className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <h2 id={`${ids}-review`} className="text-lg font-semibold">
          Vérifie avant d&apos;ajouter
        </h2>
        <ul role="list" className="flex flex-col gap-2">
          {candidates.map((c) => (
            <li key={c.key} className="flex flex-wrap items-center gap-3">
              <input
                id={`${ids}-${c.key}`}
                type="checkbox"
                checked={c.selected}
                onChange={(e) => patchCandidate(c.key, { selected: e.target.checked })}
                className="size-5 accent-[var(--accent-strong)]"
              />
              <label htmlFor={`${ids}-${c.key}`} className="flex-1">
                {c.name}
                {c.quantity && <span className="text-muted"> · {c.quantity}</span>}
              </label>
              <button
                type="button"
                aria-pressed={c.expiresSoon}
                onClick={() => patchCandidate(c.key, { expiresSoon: !c.expiresSoon })}
                className={`rounded-full border px-3 py-1 text-sm ${
                  c.expiresSoon ? "border-warn-fg bg-warn-bg text-warn-fg" : "border-border text-muted"
                }`}
              >
                <span aria-hidden="true">⏰ </span>Bientôt périmé
                <span className="visually-hidden"> : {c.name}</span>
              </button>
            </li>
          ))}
        </ul>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={confirmCandidates} disabled={busy === "save" || count === 0} className={PRIMARY}>
            {busy === "save" ? "Ajout…" : `Ajouter ${count} ingrédient${count > 1 ? "s" : ""}`}
          </button>
          <button type="button" onClick={() => setCandidates(null)} className={SECONDARY}>
            Annuler
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby={`${ids}-add`} className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <h2 id={`${ids}-add`} className="text-lg font-semibold">
        Ajouter des ingrédients
      </h2>

      <form onSubmit={analyzeText} className="flex flex-col gap-2">
        <label htmlFor={`${ids}-text`} className="font-medium">
          Dis-moi ce que tu as
        </label>
        <p id={`${ids}-text-hint`} className="text-sm text-muted">
          Ex. : 3 œufs, un reste de riz, une courgette qui va bientôt périmer
        </p>
        <textarea
          id={`${ids}-text`}
          aria-describedby={`${ids}-text-hint`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          maxLength={1000}
          rows={3}
          className="rounded-lg border border-border bg-transparent px-3 py-2"
        />
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy !== null || !text.trim()} className={PRIMARY}>
            {busy === "text" ? "Analyse…" : "Analyser"}
          </button>
          <label className={`${SECONDARY} cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
            <span aria-hidden="true">📷</span>
            {busy === "photo" ? "Analyse de la photo…" : "Prendre une photo"}
            <input
              type="file"
              accept="image/*"
              onChange={analyzePhoto}
              disabled={busy !== null}
              className="visually-hidden"
            />
          </label>
        </div>
      </form>

      <form onSubmit={quickAdd} className="flex flex-col gap-2 border-t border-border pt-4">
        <label htmlFor={`${ids}-quick`} className="font-medium">
          Ajout rapide
        </label>
        <div className="flex gap-2">
          <input
            id={`${ids}-quick`}
            list={`${ids}-ingredients`}
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            autoComplete="off"
            maxLength={80}
            className="min-w-0 flex-1 rounded-lg border border-border bg-transparent px-3 py-2"
          />
          <button type="submit" disabled={!quick.trim()} className={SECONDARY}>
            Ajouter
          </button>
        </div>
        <datalist id={`${ids}-ingredients`}>
          {INGREDIENTS.map((i) => (
            <option key={i.id} value={i.label} />
          ))}
        </datalist>
      </form>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </section>
  );
}
