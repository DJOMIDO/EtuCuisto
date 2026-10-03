import Image from "next/image";
import Link from "next/link";

// Le compte se gère depuis l'onglet Profil : l'en-tête ne porte que le logo.
export function AppHeader() {
  return (
    <header>
      <a
        href="#content"
        className="visually-hidden fixed left-2 top-2 z-50 rounded-full bg-surface px-4 py-2 shadow-card"
      >
        Aller au contenu
      </a>
      <div className="mx-auto flex max-w-2xl items-center px-4 pb-2 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <Link href="/" className="flex items-center gap-2 rounded-full">
          <Image src="/logo.svg" alt="" width={40} height={40} priority />
          <Image src="/logo-text.svg" alt="EtuCuisto" width={118} height={22} className="dark:invert" />
        </Link>
      </div>
    </header>
  );
}
