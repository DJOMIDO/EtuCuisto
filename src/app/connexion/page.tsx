"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function ConnexionPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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
    setPending(false);
    if (error) {
      setError(error.message ?? "Échec, réessaie.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-10">
      <Image src="/logo.svg" alt="EtuCuisto" width={56} height={56} className="self-center" />
      <h1 className="text-center text-2xl font-semibold">
        {mode === "signin" ? "Connexion" : "Créer un compte"}
      </h1>

      <button
        type="button"
        onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/" })}
        className="rounded-lg border border-foreground/20 px-4 py-2.5 font-medium hover:bg-foreground/5"
      >
        Continuer avec Google
      </button>

      <div className="flex items-center gap-3 text-sm text-foreground/60">
        <span className="h-px flex-1 bg-foreground/15" /> ou <span className="h-px flex-1 bg-foreground/15" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <label className="flex flex-col gap-1 text-sm">
            Prénom
            <input name="name" autoComplete="given-name" className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2" />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input name="email" type="email" required autoComplete="email" className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mot de passe
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2"
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-foreground px-4 py-2.5 font-medium text-background disabled:opacity-60"
        >
          {pending ? "…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="text-sm text-foreground/70 underline"
      >
        {mode === "signin" ? "Pas encore de compte ? Inscris-toi" : "Déjà un compte ? Connecte-toi"}
      </button>
    </main>
  );
}
