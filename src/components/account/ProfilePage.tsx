"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { button, card, PageTitle } from "../ui";
import { AuthForm } from "./AuthForm";

export function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <main id="content" tabIndex={-1} className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-5 px-4 py-4">
      {isPending ? null : !user ? (
        <AuthForm />
      ) : (
        <>
          <PageTitle title="Profil" subtitle="Ton frigo, tes réglages et tes recettes te suivent sur tous tes appareils." />
          <div className={`${card} flex items-center gap-4`}>
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-extrabold text-on-accent"
            >
              {(user.name || user.email).slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold">{user.name || "Sans nom"}</p>
              <p className="truncate text-muted">{user.email}</p>
            </div>
          </div>
          <button type="button" onClick={signOut} className={`${button.secondary} self-start`}>
            <LogOut aria-hidden="true" className="size-5" />
            Se déconnecter
          </button>
        </>
      )}
    </main>
  );
}
