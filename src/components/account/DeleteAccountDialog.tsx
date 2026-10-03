"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { fetchJson } from "@/lib/client/fetch-json";
import { button, field } from "../ui";

type Props = {
  open: boolean;
  email: string;
  onClose: () => void;
  onDeleted: () => void;
};

// Suppression définitive : il faut retaper son e-mail pour activer le bouton.
export function DeleteAccountDialog({ open, email, onClose, onDeleted }: Props) {
  const ids = useId();
  const t = useTranslations("deleteAccount");
  const tc = useTranslations("common");
  const ref = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!matches) return;
    setDeleting(true);
    setError(null);
    try {
      await fetchJson("/api/account", { method: "DELETE" });
      await authClient.signOut().catch(() => {});
      clearLocalData();
      onDeleted();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={() => {
        setTyped("");
        setError(null);
        onClose();
      }}
      aria-labelledby={`${ids}-title`}
      className="m-auto w-[min(28rem,calc(100%-1.5rem))] rounded-3xl bg-surface p-0 text-foreground shadow-card backdrop:bg-black/40"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4 p-6">
        <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-cherry-soft text-cherry-ink">
          <TriangleAlert className="size-6" />
        </span>
        <h2 id={`${ids}-title`} className="text-xl font-extrabold">
          {t("title")}
        </h2>
        <div>
          <p id={`${ids}-intro`}>{t("intro")}</p>
          <ul className="mt-2 list-disc pl-5 text-muted">
            <li>{t("items.account")}</li>
            <li>{t("items.fridge")}</li>
            <li>{t("items.recipes")}</li>
            <li>{t("items.settings")}</li>
          </ul>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${ids}-email`} className="text-sm font-bold">
            {t("emailLabel")}
          </label>
          <input
            id={`${ids}-email`}
            type="email"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={email}
            autoComplete="off"
            className={field}
          />
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-cherry-ink">{error}</p>}
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={!matches || deleting}
            className={`${button.danger} w-full py-3`}
          >
            {deleting ? t("deleting") : t("confirm")}
          </button>
          <button type="button" onClick={onClose} className={`${button.ghost} w-full`}>
            {tc("cancel")}
          </button>
        </div>
      </form>
    </dialog>
  );
}

/** Efface tout ce qu'EtuCuisto garde dans ce navigateur (frigo invité, réglages, recettes). */
function clearLocalData() {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      for (const key of Object.keys(storage)) if (key.startsWith("etucuisto:")) storage.removeItem(key);
    } catch {
      // Stockage indisponible : rien à effacer.
    }
  }
}
