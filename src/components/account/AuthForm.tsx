"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { button, card, field } from "../ui";
import { authClient } from "@/lib/auth/client";
import { migrateLocalKitchen, readLocalKitchen } from "@/lib/client/use-kitchen";
import { migrateLocalPantry } from "@/lib/client/use-pantry";

export function AuthForm() {
  const router = useRouter();
  const ids = useId();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setPending(true);
    setError(null);
    const { error } =
      mode === "signin"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: String(form.get("name") || email) });
    if (error) {
      setPending(false);
      setError(error.message ?? "Échec, réessaie.");
      return;
    }
    // Envoie tout de suite le frigo et les réglages de l'invité vers le compte,
    // sans attendre qu'une page qui les utilise soit ouverte.
    await Promise.allSettled([migrateLocalPantry(), migrateLocalKitchen(readLocalKitchen())]);
    setPending(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">{mode === "signin" ? "Content de te revoir" : "Bienvenue !"}</h1>
        <p className="mt-1 text-muted">
          {mode === "signin"
            ? "Connecte-toi pour retrouver ton frigo, tes réglages et tes recettes."
            : "Crée ton compte pour garder ton frigo et tes recettes sur tous tes appareils."}
        </p>
      </div>

      <div className={`${card} flex flex-col gap-4`}>
        <button
          type="button"
          onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/" })}
          className={`${button.secondary} w-full py-3`}
        >
          Continuer avec Google
        </button>

        <div className="flex items-center gap-3 text-sm font-semibold text-muted">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <div className="flex flex-col gap-1">
              <label htmlFor={`${ids}-name`} className="text-sm font-bold">
                Prénom
              </label>
              <input id={`${ids}-name`} name="name" autoComplete="given-name" className={field} />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor={`${ids}-email`} className="text-sm font-bold">
              E-mail
            </label>
            <input id={`${ids}-email`} name="email" type="email" required autoComplete="email" className={field} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${ids}-password`} className="text-sm font-bold">
              Mot de passe
            </label>
            {mode === "signup" && (
              <p id={`${ids}-password-hint`} className="text-sm text-muted">
                8 caractères minimum.
              </p>
            )}
            <input
              id={`${ids}-password`}
              name="password"
              type="password"
              required
              minLength={8}
              aria-describedby={mode === "signup" ? `${ids}-password-hint` : undefined}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className={field}
            />
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-cherry-ink">{error}</p>}
          <button type="submit" disabled={pending} className={`${button.primary} mt-1 w-full py-3`}>
            {pending ? "…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className={`${button.ghost} self-center`}
      >
        {mode === "signin" ? "Pas encore de compte ? Inscris-toi" : "Déjà un compte ? Connecte-toi"}
      </button>
    </div>
  );
}
