"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useRef } from "react";
import { isLocale } from "@/i18n/locales";
import { authClient } from "@/lib/auth/client";
import { fetchJson } from "@/lib/client/fetch-json";
import { migrateLocalKitchen, readLocalKitchen } from "@/lib/client/use-kitchen";
import { migrateLocalPantry } from "@/lib/client/use-pantry";
import { setLocaleCookie } from "@/lib/client/preferences";

// Dès qu'une session existe (e-mail ou retour de Google) :
// - le frigo et les réglages gardés en invité partent vers le compte ;
// - la langue du compte s'applique à cet appareil (ou, si le compte n'en a pas, il prend celle-ci).
export function GuestDataSync() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const locale = useLocale();
  const router = useRouter();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || syncedFor.current === userId) return;
    syncedFor.current = userId;

    migrateLocalPantry().catch(() => {});
    if (readLocalKitchen()) migrateLocalKitchen(readLocalKitchen()).catch(() => {});

    fetchJson<{ locale: string | null }>("/api/settings")
      .then(({ locale: saved }) => {
        if (!saved) {
          return fetchJson("/api/settings", { method: "PUT", body: JSON.stringify({ locale }) });
        }
        if (isLocale(saved) && saved !== locale) {
          setLocaleCookie(saved);
          router.refresh();
        }
      })
      .catch(() => {});
  }, [userId, locale, router]);

  return null;
}
