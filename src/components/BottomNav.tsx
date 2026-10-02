"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Les pages Recettes et Favoris s'ajouteront ici (étapes 5 et 6).
const LINKS = [
  { href: "/", label: "Frigo", icon: "🧊" },
  { href: "/cuisine", label: "Cuisine", icon: "🍳" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul role="list" className="mx-auto flex max-w-2xl">
        {LINKS.map((l) => {
          const current = pathname === l.href;
          return (
            <li key={l.href} className="flex-1">
              <Link
                href={l.href}
                aria-current={current ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs ${
                  current ? "font-semibold text-accent-strong" : "text-muted"
                }`}
              >
                <span aria-hidden="true" className="text-xl">
                  {l.icon}
                </span>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
