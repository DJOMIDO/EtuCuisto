"use client";

import { ChefHat, CircleUser, Heart, Refrigerator } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const LINKS = [
  { href: "/", key: "fridge", icon: Refrigerator },
  { href: "/recettes", key: "recipes", icon: ChefHat },
  { href: "/favoris", key: "favorites", icon: Heart },
  { href: "/profil", key: "profile", icon: CircleUser },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  return (
    <nav
      aria-label={t("label")}
      // Au-dessus de la barre d'accueil iOS (env vaut 0 ailleurs).
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto max-w-md rounded-full bg-surface/95 p-1.5 shadow-card ring-1 ring-border backdrop-blur"
    >
      <ul role="list" className="flex">
        {LINKS.map(({ href, key, icon: Icon }) => {
          const current = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-full py-1.5 text-xs font-bold ${
                  current ? "bg-accent-soft text-accent-strong" : "text-muted hover:text-foreground"
                }`}
              >
                <Icon aria-hidden="true" className="size-5" strokeWidth={current ? 2.4 : 2} />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
