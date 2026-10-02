"use client";

import { useCallback, useEffect, useState } from "react";
import type { PantryItemInput } from "@/lib/ai/schemas";
import { authClient } from "@/lib/auth/client";
import { fetchJson } from "./fetch-json";

export type PantryItem = PantryItemInput & { id: string };

const STORAGE_KEY = "etucuisto:pantry";

// Invité : le frigo vit dans localStorage. Connecté : en base, via l'API.
// À la connexion, le frigo local est envoyé en base puis vidé.

function readLocal(): PantryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PantryItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: PantryItem[]) {
  try {
    if (items.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Stockage indisponible (navigation privée…) : le frigo reste en mémoire.
  }
}

function toInput({ name, quantity, category, expiresSoon }: PantryItem): PantryItemInput {
  return { name, quantity, category, expiresSoon };
}

function toItem(row: PantryItem): PantryItem {
  const { id, name, quantity, category, expiresSoon } = row;
  return { id, name, quantity, category, expiresSoon };
}

// Envoi en cours du frigo invité. Partagé : si l'effet se relance pendant l'envoi
// (rafraîchissement de session), il attend cet envoi au lieu de lire un frigo incomplet.
let migration: Promise<void> | null = null;

function migrateLocalPantry() {
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

  // « J'ai cuisiné ça » : retire d'un coup les ingrédients utilisés.
  const consume = useCallback(
    async (ids: string[]) => {
      if (userId) {
        await fetchJson("/api/pantry/consume", { method: "POST", body: JSON.stringify({ ids }) });
      }
      const gone = new Set(ids);
      setItems((prev) => {
        const next = prev.filter((i) => !gone.has(i.id));
        if (!userId) writeLocal(next);
        return next;
      });
    },
    [userId],
  );

  return { items, loaded, error, isGuest: !userId, add, update, remove, consume };
}
