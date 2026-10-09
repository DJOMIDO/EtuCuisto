"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
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

/**
 * Étape affichée. « verify » : code de vérification de l'e-mail ; « forgot » : demande du code
 * de réinitialisation (e-mail prérempli) ; « reset » : code + nouveau mot de passe.
 */
export type AuthStep =
  | { kind: "signup" }
  | { kind: "signin" }
  | { kind: "verify"; email: string; password: string }
  | { kind: "forgot"; email: string }
  | { kind: "reset"; email: string };

type Props = {
  /** Étape tenue par le parent (voir ProfilePage). */
  step: AuthStep;
  onStepChange: (step: AuthStep) => void;
};

function useAuthError() {
  const t = useTranslations("auth");
  const [error, setError] = useState<string | null>(null);
  function showError(err: unknown) {
    const key = authErrorKey(err);
    setError(key ? t(`errors.${key}`) : t("failed"));
  }
  return [error, showError, () => setError(null)] as const;
}

/** Délai avant de pouvoir redemander un code. */
function useCooldown() {
  const [left, setLeft] = useState(RESEND_COOLDOWN_S);
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  return [left, () => setLeft(RESEND_COOLDOWN_S)] as const;
}

/** Connexion après vérification ou réinitialisation ; demande la vérification si l'e-mail ne l'est pas. */
async function signInOrVerify(email: string, password: string, onStepChange: Props["onStepChange"]) {
  let error: unknown;
  try {
    ({ error } = await authClient.signIn.email({ email, password }));
  } catch (thrown) {
    error = thrown;
  }
  if (isEmailNotVerified(error)) {
    // Neon Auth exige la vérification avant la connexion : nouveau code, puis l'étape « code ».
    await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" }).catch(() => {});
    onStepChange({ kind: "verify", email, password });
    return false;
  }
  if (error) throw error;
  return true;
}

export function AuthForm({ step, onStepChange }: Props) {
  const router = useRouter();

  /** Connecté : envoie tout de suite le frigo et les réglages de l'invité, puis l'accueil. */
  async function finish() {
    await Promise.allSettled([migrateLocalPantry(), migrateLocalKitchen(readLocalKitchen())]);
    router.push("/");
    router.refresh();
  }

  const toSignin = () => onStepChange({ kind: "signin" });

  switch (step.kind) {
    case "verify":
      return <VerifyEmail {...step} onVerified={finish} onBack={() => onStepChange({ kind: "signup" })} />;
    case "forgot":
      return <ForgotPassword email={step.email} onSent={(email) => onStepChange({ kind: "reset", email })} onBack={toSignin} />;
    case "reset":
      return <ResetPassword email={step.email} onStepChange={onStepChange} onDone={finish} onBack={toSignin} />;
    default:
      return <Credentials key={step.kind} mode={step.kind} onStepChange={onStepChange} onDone={finish} />;
  }
}

function Heading({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-1 text-muted">{intro}</p>
    </div>
  );
}

function ErrorText({ error }: { error: string | null }) {
  return error && <p role="alert" className="text-sm font-semibold text-cherry-ink">{error}</p>;
}

type CredentialsProps = {
  mode: "signin" | "signup";
  onStepChange: Props["onStepChange"];
  onDone: () => Promise<void>;
};

function Credentials({ mode, onStepChange, onDone }: CredentialsProps) {
  const ids = useId();
  const t = useTranslations("auth");
  const emailRef = useRef<HTMLInputElement>(null);
  const [error, showError, clearError] = useAuthError();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    setPending(true);
    clearError();

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
      if (!data?.token) return onStepChange({ kind: "verify", email, password });
      return onDone();
    }

    try {
      if (await signInOrVerify(email, password, onStepChange)) return onDone();
    } catch (err) {
      setPending(false);
      showError(err);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Heading
        title={t(mode === "signin" ? "signinTitle" : "signupTitle")}
        intro={t(mode === "signin" ? "signinIntro" : "signupIntro")}
      />

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
            <input
              ref={emailRef}
              id={`${ids}-email`}
              name="email"
              type="email"
              required
              autoComplete="email"
              className={field}
            />
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
            {mode === "signin" && (
              <button
                type="button"
                onClick={() => onStepChange({ kind: "forgot", email: emailRef.current?.value.trim() ?? "" })}
                className="self-end rounded-lg px-1 py-1 text-sm font-bold text-accent-strong underline-offset-2 hover:underline"
              >
                {t("forgotPassword")}
              </button>
            )}
          </div>
          <ErrorText error={error} />
          <button type="submit" disabled={pending} className={`${button.primary} mt-1 w-full py-3`}>
            {pending ? "…" : t(mode === "signin" ? "signin" : "signup")}
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={() => onStepChange({ kind: mode === "signin" ? "signup" : "signin" })}
        className={`${button.ghost} self-center`}
      >
        {t(mode === "signin" ? "toSignup" : "toSignin")}
      </button>
    </div>
  );
}

/** Champ du code à 6 chiffres envoyé par e-mail. */
function CodeField({ code, onChange }: { code: string; onChange: (code: string) => void }) {
  const id = useId();
  const t = useTranslations("auth");
  return (
    <>
      <label htmlFor={id} className="text-sm font-bold">
        {t("codeLabel")}
      </label>
      <input
        id={id}
        value={code}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        required
        className={`${field} text-center text-2xl font-extrabold tracking-[0.5em]`}
      />
    </>
  );
}

/** Bouton « renvoyer le code », bloqué pendant le délai, avec annonce pour les lecteurs d'écran. */
function ResendButton({ onResend }: { onResend: () => Promise<boolean> }) {
  const t = useTranslations("auth");
  const [cooldown, restart] = useCooldown();
  const [status, setStatus] = useState("");
  async function resend() {
    if (!(await onResend())) return;
    setStatus(t("resent"));
    restart();
  }
  return (
    <>
      <button type="button" onClick={resend} disabled={cooldown > 0} className={`${button.ghost} w-full`}>
        {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
      </button>
      <p role="status" className="visually-hidden">
        {status}
      </p>
    </>
  );
}

type VerifyProps = { email: string; password: string; onVerified: () => Promise<void>; onBack: () => void };

// Saisie du code à 6 chiffres envoyé par Neon Auth, puis connexion automatique.
function VerifyEmail({ email, password, onVerified, onBack }: VerifyProps) {
  const t = useTranslations("auth");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, showError, clearError] = useAuthError();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    clearError();
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
    clearError();
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
      if (error) throw error;
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Heading title={t("verifyTitle")} intro={t("verifyIntro", { email })} />

      <form onSubmit={onSubmit} className={`${card} flex flex-col gap-3`}>
        <CodeField code={code} onChange={setCode} />
        <ErrorText error={error} />
        <button type="submit" disabled={busy || code.length !== 6} className={`${button.primary} mt-1 w-full py-3`}>
          {busy ? t("verifying") : t("verify")}
        </button>
        <ResendButton onResend={resend} />
      </form>

      <button type="button" onClick={onBack} className={`${button.ghost} self-center`}>
        {t("back")}
      </button>
    </div>
  );
}

/** Envoie le code de réinitialisation. La réponse est la même que le compte existe ou non. */
async function sendResetCode(email: string) {
  const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "forget-password" });
  if (error) throw error;
}

type ForgotProps = { email: string; onSent: (email: string) => void; onBack: () => void };

// Mot de passe oublié, 1/2 : l'e-mail auquel envoyer le code.
function ForgotPassword({ email: initialEmail, onSent, onBack }: ForgotProps) {
  const ids = useId();
  const t = useTranslations("auth");
  const [busy, setBusy] = useState(false);
  const [error, showError, clearError] = useAuthError();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setBusy(true);
    clearError();
    try {
      await sendResetCode(email);
      onSent(email);
    } catch (err) {
      setBusy(false);
      showError(err);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Heading title={t("resetTitle")} intro={t("resetIntro")} />

      <form onSubmit={onSubmit} className={`${card} flex flex-col gap-3`}>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${ids}-email`} className="text-sm font-bold">
            {t("email")}
          </label>
          <input
            id={`${ids}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={initialEmail}
            className={field}
          />
        </div>
        <ErrorText error={error} />
        <button type="submit" disabled={busy} className={`${button.primary} mt-1 w-full py-3`}>
          {busy ? t("sending") : t("sendCode")}
        </button>
      </form>

      <button type="button" onClick={onBack} className={`${button.ghost} self-center`}>
        {t("backToSignin")}
      </button>
    </div>
  );
}

type ResetProps = {
  email: string;
  onStepChange: Props["onStepChange"];
  onDone: () => Promise<void>;
  onBack: () => void;
};

// Mot de passe oublié, 2/2 : code reçu + nouveau mot de passe, puis connexion automatique.
function ResetPassword({ email, onStepChange, onDone, onBack }: ResetProps) {
  const ids = useId();
  const t = useTranslations("auth");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, showError, clearError] = useAuthError();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password"));
    setBusy(true);
    clearError();
    try {
      const reset = await authClient.emailOtp.resetPassword({ email, otp: code, password });
      if (reset.error) throw reset.error;
      if (await signInOrVerify(email, password, onStepChange)) await onDone();
    } catch (err) {
      setBusy(false);
      showError(err);
    }
  }

  async function resend() {
    clearError();
    try {
      await sendResetCode(email);
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Heading title={t("resetCodeTitle")} intro={t("resetCodeIntro", { email })} />

      <form onSubmit={onSubmit} className={`${card} flex flex-col gap-3`}>
        {/* Aide les gestionnaires de mots de passe à associer le nouveau mot de passe au compte. */}
        <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
        <CodeField code={code} onChange={setCode} />
        <div className="flex flex-col gap-1">
          <label htmlFor={`${ids}-password`} className="text-sm font-bold">
            {t("newPassword")}
          </label>
          <p id={`${ids}-password-hint`} className="text-sm text-muted">
            {t("passwordHint")}
          </p>
          <input
            id={`${ids}-password`}
            name="password"
            type="password"
            required
            minLength={8}
            aria-describedby={`${ids}-password-hint`}
            autoComplete="new-password"
            className={field}
          />
        </div>
        <ErrorText error={error} />
        <button type="submit" disabled={busy || code.length !== 6} className={`${button.primary} mt-1 w-full py-3`}>
          {busy ? t("resetting") : t("resetSubmit")}
        </button>
        <ResendButton onResend={resend} />
      </form>

      <button type="button" onClick={onBack} className={`${button.ghost} self-center`}>
        {t("backToSignin")}
      </button>
    </div>
  );
}
