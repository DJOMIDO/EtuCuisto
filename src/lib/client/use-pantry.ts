"use client";

import { useCallback, useEffect, useState } from "react";
import type { PantryItemInput } from "@/lib/ai/schemas";
import { normalizeCategory } from "@/lib/categories";
import { normalizeStorage } from "@/lib/storage";
import { normalizeUnit } from "@/lib/units";
import { authClient } from "@/lib/auth/client";
import { fetchJson } from "./fetch-json";

export type PantryItem = PantryItemInput & { id: string };
// « J'ai cuisiné ça » : combien d'unités de chaque ingrédient ont été utilisées.
export type Consumption = { id: string; used: number };

const STORAGE_KEY = "etucuisto:pantry";

// Invité : le frigo vit dans localStorage. Connecté : en base, via l'API.
// À la connexion, le frigo local est envoyé en base puis vidé.

function readLocal(): PantryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = raw ? (JSON.parse(raw) as PantryItem[]) : [];
    // Les invités peuvent avoir gardé d'anciennes valeurs (quantité en texte, famille ou
    // zone absente) : on ramène quantité, unité, famille et zone à des valeurs connues.
    return items.map((i) => ({
      ...i,
      quantity: normalizeQuantity(i.quantity),
      unit: normalizeUnit(i.unit),
      category: normalizeCategory(i.category),
      storage: normalizeStorage(i.storage),
    }));
  } catch {
    return [];
  }
}

// Quantité stockée (nombre, ancien texte libre type « 2 » / « 100 g », absent) → nombre ou null.
function normalizeQuantity(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(",", "."));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function writeLocal(items: PantryItem[]) {
  try {
    if (items.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Stockage indisponible (navigation privée…) : le frigo reste en mémoire.
  }
}

function toInput({ name, quantity, unit, category, storage, expiresSoon }: PantryItem): PantryItemInput {
  return { name, quantity, unit, category, storage, expiresSoon };
}

function toItem(row: PantryItem): PantryItem {
  const { id, name, quantity, unit, category, storage, expiresSoon } = row;
  // Normalise aussi les valeurs de la base au cas où la migration n'a pas encore tourné.
  return {
    id,
    name,
    quantity: normalizeQuantity(quantity),
    unit: normalizeUnit(unit),
    category: normalizeCategory(category),
    storage: normalizeStorage(storage),
    expiresSoon,
  };
}

// Envoi en cours du frigo invité. Partagé : si l'effet se relance pendant l'envoi
// (rafraîchissement de session), il attend cet envoi au lieu de lire un frigo incomplet.
let migration: Promise<void> | null = null;

export function migrateLocalPantry() {
  const local = readLocal();
  if (local.length) {
    writeLocal([]); // vidé tout de suite : jamais envoyé deux fois
    migration = fetchJson("/api/pantry", {
      method: "POST",
      body: JSON.stringify({ items: local.map(toInput) }),
    })
      .then(() => undefined)
      .catch((e) => {
        writeLocal(local);
        throw e;
      })
      .finally(() => {
        migration = null;
      });
  }
  return migration ?? Promise.resolve();
}

export function usePantry() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const userId = session?.user?.id ?? null;
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionPending) return;
    let cancelled = false;

    async function load() {
      if (!userId) {
        setItems(readLocal());
        setLoaded(true);
        return;
      }
      try {
        await migrateLocalPantry();
        const data = await fetchJson<{ items: PantryItem[] }>("/api/pantry");
        if (!cancelled) setItems(data.items.map(toItem));
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, sessionPending]);

  const add = useCallback(
    async (inputs: PantryItemInput[]) => {
      if (!userId) {
        const added = inputs.map((i) => ({ ...i, id: crypto.randomUUID() }));
        setItems((prev) => {
          const next = [...prev, ...added];
          writeLocal(next);
          return next;
        });
        return;
      }
      const data = await fetchJson<{ items: PantryItem[] }>("/api/pantry", {
        method: "POST",
        body: JSON.stringify({ items: inputs }),
      });
      setItems((prev) => [...prev, ...data.items.map(toItem)]);
    },
    [userId],
  );

  const update = useCallback(
    async (id: string, patch: Partial<PantryItemInput>) => {
      // Connecté : on attend la confirmation de l'API avant de modifier l'affichage.
      if (userId) {
        await fetchJson(`/api/pantry/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      }
      setItems((prev) => {
        const next = prev.map((i) => (i.id === id ? { ...i, ...patch } : i));
        if (!userId) writeLocal(next);
        return next;
      });
    },
    [userId],
  );

  const remove = useCallback(
    async (id: string) => {
      if (userId) await fetchJson(`/api/pantry/${id}`, { method: "DELETE" });
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        if (!userId) writeLocal(next);
        return next;
      });
    },
    [userId],
  );

  // « J'ai cuisiné ça » : retire les quantités utilisées, garde le reste en stock.
  const consume = useCallback(
    async (consumptions: Consumption[]) => {
      if (consumptions.length === 0) return;
      if (userId) {
        await fetchJson("/api/pantry/consume", { method: "POST", body: JSON.stringify({ items: consumptions }) });
      }
      const used = new Map(consumptions.map((c) => [c.id, c.used]));
      setItems((prev) => {
        const next: PantryItem[] = [];
        for (const i of prev) {
          const amount = used.get(i.id);
          if (amount === undefined) {
            next.push(i);
            continue;
          }
          // Quantité inconnue ou entièrement consommée → l'aliment disparaît ; sinon on décrémente.
          const remaining = (i.quantity ?? 0) - amount;
          if (i.quantity == null || remaining <= 0) continue;
          next.push({ ...i, quantity: remaining });
        }
        if (!userId) writeLocal(next);
        return next;
      });
    },
    [userId],
  );

  return { items, loaded, error, isGuest: !userId, add, update, remove, consume };
}
