"use client";

import { CircleCheck, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Theme } from "@/i18n/locales";
import { authClient } from "@/lib/auth/client";
import { button, card, PageTitle } from "../ui";
import { AuthForm, type AuthStep } from "./AuthForm";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { PreferencesSection } from "./PreferencesSection";

export function ProfilePage({ initialTheme }: { initialTheme: Theme }) {
  const t = useTranslations("profile");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  // Gardé ici et non dans AuthForm : hors connexion, chaque rafraîchissement de session
  // repasse isPending à true et démonte le formulaire ; l'étape en cours doit survivre.
  const [authStep, setAuthStep] = useState<AuthStep>({ kind: "signup" });
  const user = session?.user;
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <main id="content" tabIndex={-1} className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-5 px-4 py-4">
      {deleted && (
        <p role="status" className="flex items-start gap-2 rounded-2xl bg-herb-soft px-4 py-3 font-semibold text-herb-ink">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {t("accountDeleted")}
        </p>
      )}

      {isPending ? null : !user ? (
        <>
          <AuthForm step={authStep} onStepChange={setAuthStep} />
          <PreferencesSection initialTheme={initialTheme} signedIn={false} />
        </>
      ) : (
        <>
          <PageTitle title={t("title")} subtitle={t("subtitle")} />
          <div className={`${card} flex items-center gap-4`}>
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-extrabold text-on-accent"
            >
              {(user.name || user.email).slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold">{user.name || t("noName")}</p>
              <p className="truncate text-muted">{user.email}</p>
            </div>
          </div>

          <PreferencesSection initialTheme={initialTheme} signedIn />

          <button type="button" onClick={signOut} className={`${button.secondary} self-start`}>
            <LogOut aria-hidden="true" className="size-5" />
            {t("signOut")}
          </button>

          <button
            type="button"
            onClick={() => setDeleting(true)}
            className="mt-4 self-start text-sm font-semibold text-cherry-ink underline"
          >
            {t("deleteAccount")}
          </button>
          <DeleteAccountDialog
            open={deleting}
            email={user.email}
            onClose={() => setDeleting(false)}
            onDeleted={() => {
              setDeleting(false);
              setDeleted(true);
              router.refresh();
            }}
          />
        </>
      )}
    </main>
  );
}
