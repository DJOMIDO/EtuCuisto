"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { button, card, field } from "../ui";
import { authClient } from "@/lib/auth/client";
import { migrateLocalKitchen, readLocalKitchen } from "@/lib/client/use-kitchen";
import { migrateLocalPantry } from "@/lib/client/use-pantry";

type AuthErrorKey =
  | "invalidCredentials"
  | "emailExists"
  | "passwordTooShort"
  | "rateLimited"
  | "invalidCode"
  | "codeExpired"
  | "tooManyAttempts";

/**
 * Erreur d'authentification → clé de message. Le SDK Neon Auth renvoie ({ error }) ou lève
 * des erreurs aux codes façon Supabase (« invalid_credentials »…). Les erreurs de code OTP
 * n'ont pas de code dédié : on les reconnaît à leur message.
 */
function authErrorKey(err: unknown): AuthErrorKey | undefined {
  const e = err as { code?: string; message?: string } | null;
  switch (e?.code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "user_already_exists":
    case "email_exists":
      return "emailExists";
    case "weak_password":
      return "passwordTooShort";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
  }
  const message = e?.message?.toLowerCase() ?? "";
  if (message.includes("invalid otp")) return "invalidCode";
  if (message.includes("expired")) return "codeExpired";
  if (message.includes("too many attempts")) return "tooManyAttempts";
  return undefined;
}

function isEmailNotVerified(err: unknown) {
  const code = (err as { code?: string } | null)?.code;
  return code === "email_not_confirmed" || code === "EMAIL_NOT_VERIFIED";
}

const RESEND_COOLDOWN_S = 30;

export type PendingVerification = { email: string; password: string };

type Props = {
  /** E-mail en attente de vérification (état tenu par le parent, voir ProfilePage). */
  verifying: PendingVerification | null;
  onVerifyingChange: (value: PendingVerification | null) => void;
};

export function AuthForm({ verifying, onVerifyingChange: setVerifying }: Props) {
  const router = useRouter();
  const ids = useId();
  const t = useTranslations("auth");
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  function showError(err: unknown) {
    const key = authErrorKey(err);
    setError(key ? t(`errors.${key}`) : t("failed"));
  }

  /** Connecté : envoie tout de suite le frigo et les réglages de l'invité, puis l'accueil. */
  async function finish() {
    await Promise.allSettled([migrateLocalPantry(), migrateLocalKitchen(readLocalKitchen())]);
    router.push("/");
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    setPending(true);
    setError(null);

    if (mode === "signup") {
      let data: { token?: string | null } | null = null;
      let error: unknown;
      try {
        ({ data, error } = await authClient.signUp.email({ email, password, name: String(form.get("name") || email) }));
      } catch (thrown) {
        error = thrown;
      }
      setPending(false);
      if (error) return showError(error);
      // Pas de session tant que l'e-mail n'est pas vérifié : on demande le code reçu.
      if (!data?.token) return setVerifying({ email, password });
      return finish();
    }

    let error: unknown;
    try {
      ({ error } = await authClient.signIn.email({ email, password }));
    } catch (thrown) {
      error = thrown;
    }
    if (isEmailNotVerified(error)) {
      // Neon Auth exige la vérification avant la connexion : nouveau code, puis l'étape « code ».
      await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" }).catch(() => {});
      setPending(false);
      return setVerifying({ email, password });
    }
    setPending(false);
    if (error) return showError(error);
    return finish();
  }

  if (verifying) {
    return (
      <VerifyEmail
        {...verifying}
        onVerified={finish}
        onBack={() => {
          setVerifying(null);
          setError(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">{t(mode === "signin" ? "signinTitle" : "signupTitle")}</h1>
        <p className="mt-1 text-muted">{t(mode === "signin" ? "signinIntro" : "signupIntro")}</p>
      </div>

      <div className={`${card} flex flex-col gap-4`}>
        <button
          type="button"
          onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/" })}
          className={`${button.secondary} w-full py-3`}
        >
          {t("google")}
        </button>

        <div className="flex items-center gap-3 text-sm font-semibold text-muted">
          <span className="h-px flex-1 bg-border" /> {t("or")} <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <div className="flex flex-col gap-1">
              <label htmlFor={`${ids}-name`} className="text-sm font-bold">
                {t("firstName")}
              </label>
              <input id={`${ids}-name`} name="name" autoComplete="given-name" className={field} />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor={`${ids}-email`} className="text-sm font-bold">
              {t("email")}
            </label>
            <input id={`${ids}-email`} name="email" type="email" required autoComplete="email" className={field} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${ids}-password`} className="text-sm font-bold">
              {t("password")}
            </label>
            {mode === "signup" && (
              <p id={`${ids}-password-hint`} className="text-sm text-muted">
                {t("passwordHint")}
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
            {pending ? "…" : t(mode === "signin" ? "signin" : "signup")}
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
        }}
        className={`${button.ghost} self-center`}
      >
        {t(mode === "signin" ? "toSignup" : "toSignin")}
      </button>
    </div>
  );
}

type VerifyProps = PendingVerification & { onVerified: () => Promise<void>; onBack: () => void };

// Saisie du code à 6 chiffres envoyé par Neon Auth, puis connexion automatique.
function VerifyEmail({ email, password, onVerified, onBack }: VerifyProps) {
  const ids = useId();
  const t = useTranslations("auth");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function showError(err: unknown) {
    const key = authErrorKey(err);
    setError(key ? t(`errors.${key}`) : t("failed"));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const verified = await authClient.emailOtp.verifyEmail({ email, otp: code.trim() });
      if (verified.error) throw verified.error;
      // Selon la configuration, la vérification ouvre déjà une session ; sinon on se connecte.
      const { data: session } = await authClient.getSession();
      if (!session) {
        const signedIn = await authClient.signIn.email({ email, password });
        if (signedIn.error) throw signedIn.error;
      }
      await onVerified();
    } catch (err) {
      setBusy(false);
      showError(err);
    }
  }

  async function resend() {
    setError(null);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
      if (error) throw error;
      setStatus(t("resent"));
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      showError(err);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("verifyTitle")}</h1>
        <p className="mt-1 text-muted">{t("verifyIntro", { email })}</p>
      </div>

      <form onSubmit={onSubmit} className={`${card} flex flex-col gap-3`}>
        <label htmlFor={`${ids}-code`} className="text-sm font-bold">
          {t("codeLabel")}
        </label>
        <input
          id={`${ids}-code`}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          required
          className={`${field} text-center text-2xl font-extrabold tracking-[0.5em]`}
        />
        {error && <p role="alert" className="text-sm font-semibold text-cherry-ink">{error}</p>}
        <button type="submit" disabled={busy || code.length !== 6} className={`${button.primary} mt-1 w-full py-3`}>
          {busy ? t("verifying") : t("verify")}
        </button>
        <button type="button" onClick={resend} disabled={cooldown > 0} className={`${button.ghost} w-full`}>
          {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
        </button>
      </form>

      <button type="button" onClick={onBack} className={`${button.ghost} self-center`}>
        {t("back")}
      </button>
      <p role="status" className="visually-hidden">
        {status}
      </p>
    </div>
  );
}
