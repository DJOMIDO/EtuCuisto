"use client";

import { LogIn, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { button } from "./ui";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <header>
      <a
        href="#content"
        className="visually-hidden fixed left-2 top-2 z-50 rounded-full bg-surface px-4 py-2 shadow-card"
      >
        Aller au contenu
      </a>
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <Link href="/" className="flex items-center gap-2 rounded-full">
          <Image src="/logo.svg" alt="" width={40} height={40} priority />
          <Image src="/logo-text.svg" alt="EtuCuisto" width={118} height={22} className="dark:invert" />
        </Link>
        {!isPending &&
          (session?.user ? (
            <button type="button" onClick={signOut} className={button.ghost}>
              <LogOut aria-hidden="true" className="size-4" />
              Déconnexion
            </button>
          ) : pathname === "/connexion" ? null : (
            <Link href="/connexion" className={`${button.secondary} px-4 py-2 text-sm`}>
              <LogIn aria-hidden="true" className="size-4" />
              Connexion
            </Link>
          ))}
      </div>
    </header>
  );
}
