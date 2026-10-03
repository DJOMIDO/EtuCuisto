"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { migrateLocalKitchen, readLocalKitchen } from "@/lib/client/use-kitchen";
import { migrateLocalPantry } from "@/lib/client/use-pantry";

// Dès qu'une session existe (e-mail ou retour de Google), le frigo et les réglages
// gardés en invité partent vers le compte, quelle que soit la page ouverte.
export function GuestDataSync() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    migrateLocalPantry().catch(() => {});
    if (readLocalKitchen()) migrateLocalKitchen(readLocalKitchen()).catch(() => {});
  }, [userId]);

  return null;
}
