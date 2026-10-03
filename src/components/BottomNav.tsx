"use client";

import { ChefHat, Heart, Refrigerator, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Frigo", icon: Refrigerator },
  { href: "/recettes", label: "Recettes", icon: ChefHat },
  { href: "/favoris", label: "Favoris", icon: Heart },
  { href: "/cuisine", label: "Cuisine", icon: UtensilsCrossed },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principale"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-full bg-surface/95 p-1.5 shadow-card ring-1 ring-border backdrop-blur"
    >
      <ul role="list" className="flex">
        {LINKS.map(({ href, label, icon: Icon }) => {
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
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
