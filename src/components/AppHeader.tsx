"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function AppHeader() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <header className="border-b border-border">
      <a
        href="#content"
        className="visually-hidden fixed left-2 top-2 z-50 rounded bg-background px-3 py-2"
      >
        Aller au contenu
      </a>
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="" width={36} height={36} priority />
          <Image src="/logo-text.svg" alt="EtuCuisto" width={110} height={20} className="dark:invert" />
        </Link>
        {!isPending &&
          (session?.user ? (
            <button type="button" onClick={signOut} className="text-sm text-muted underline">
              Déconnexion
            </button>
          ) : (
            <Link href="/connexion" className="text-sm font-medium text-accent-strong underline">
              Connexion
            </Link>
          ))}
      </div>
    </header>
  );
}
