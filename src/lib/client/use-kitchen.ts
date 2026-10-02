"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_KITCHEN, KitchenProfile } from "@/lib/ai/schemas";
import { authClient } from "@/lib/auth/client";
import { fetchJson } from "./fetch-json";

const STORAGE_KEY = "etucuisto:kitchen";

// Invité : réglages dans localStorage. Connecté : en base, via l'API.
// À la connexion, les réglages locaux remplacent seulement les réglages par défaut.

export function readLocalKitchen(): KitchenProfile | null {
  try {
    const parsed = KitchenProfile.safeParse(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeLocal(kitchen: KitchenProfile | null) {
  try {
    if (kitchen) localStorage.setItem(STORAGE_KEY, JSON.stringify(kitchen));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Stockage indisponible : les réglages restent en mémoire.
  }
}

type KitchenResponse = { kitchen: KitchenProfile; isDefault: boolean };

// Même principe que pour le frigo : un seul envoi des réglages invité, partagé.
let migration: Promise<KitchenResponse> | null = null;

function migrateLocalKitchen(local: KitchenProfile | null): Promise<KitchenResponse> {
  if (migration) return migration;
  writeLocal(null);
  migration = (async () => {
    try {
      const data = await fetchJson<KitchenResponse>("/api/kitchen");
      if (!local || !data.isDefault) return data;
      const saved = await fetchJson<{ kitchen: KitchenProfile }>("/api/kitchen", {
        method: "PUT",
        body: JSON.stringify(local),
      });
      return { ...saved, isDefault: false };
    } catch (e) {
      if (local) writeLocal(local);
      throw e;
    } finally {
      migration = null;
    }
  })();
  return migration;
}

export function useKitchen() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const userId = session?.user?.id ?? null;
  const [kitchen, setKitchen] = useState<KitchenProfile>(DEFAULT_KITCHEN);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionPending) return;
    let cancelled = false;

    async function load() {
      const local = readLocalKitchen();
      if (!userId) {
        setKitchen(local ?? DEFAULT_KITCHEN);
        setLoaded(true);
        return;
      }
      try {
        const data = await migrateLocalKitchen(local);
        if (!cancelled) setKitchen(data.kitchen);
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

  const save = useCallback(
    async (next: KitchenProfile) => {
      if (userId) {
        await fetchJson("/api/kitchen", { method: "PUT", body: JSON.stringify(next) });
      } else {
        writeLocal(next);
      }
      setKitchen(next);
    },
    [userId],
  );

  return { kitchen, loaded, error, isGuest: !userId, save };
}
