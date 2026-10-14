"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_KITCHEN, KitchenProfile } from "@/lib/ai/schemas";
import { authClient } from "@/lib/auth/client";
import { fetchJson } from "./fetch-json";

const STORAGE_KEY = "etucuisto:kitchen";

// Anciens réglages invités : le champ unique « diet » éclate en catégories plus fines.
// On reclasse les valeurs pour ne pas perdre les réglages déjà stockés sur l'appareil.
function normalizeLegacyKitchen(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const kitchen = { ...(raw as Record<string, unknown>) };
  if (!Array.isArray(kitchen.diet)) return kitchen;
  const diet = (kitchen.diet as unknown[]).filter((d): d is string => typeof d === "string");
  delete kitchen.diet;
  kitchen.habits = diet
    .filter((d) => ["vegetarien", "vegan", "halal", "sans-porc"].includes(d))
    .map((d) => (d === "vegan" ? "vegetalien" : d));
  kitchen.allergies = diet
    .filter((d) => ["sans-gluten", "sans-lactose"].includes(d))
    .map((d) => (d === "sans-gluten" ? "gluten" : "lait"));
  if (!Array.isArray(kitchen.avoided)) kitchen.avoided = [];
  if (!Array.isArray(kitchen.cuisines)) kitchen.cuisines = [];
  return kitchen;
}

// Invité : réglages dans localStorage. Connecté : en base, via l'API.
// À la connexion, les réglages locaux remplacent seulement les réglages par défaut.

export function readLocalKitchen(): KitchenProfile | null {
  try {
    const parsed = KitchenProfile.safeParse(normalizeLegacyKitchen(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")));
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

export function migrateLocalKitchen(local: KitchenProfile | null): Promise<KitchenResponse> {
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
  // Faux tant que l'utilisateur n'a jamais enregistré ses réglages (on lui demande avant la 1re recherche).
  const [configured, setConfigured] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionPending) return;
    let cancelled = false;

    async function load() {
      const local = readLocalKitchen();
      if (!userId) {
        setKitchen(local ?? DEFAULT_KITCHEN);
        setConfigured(!!local);
        setLoaded(true);
        return;
      }
      try {
        const data = await migrateLocalKitchen(local);
        if (!cancelled) {
          setKitchen(data.kitchen);
          setConfigured(!data.isDefault);
        }
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
      setConfigured(true);
    },
    [userId],
  );

  return { kitchen, configured, loaded, error, isGuest: !userId, save };
}
