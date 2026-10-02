import Image from "next/image";
import { CATEGORIES } from "@/lib/ingredients";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex items-center gap-3">
        <Image src="/logo.svg" alt="" width={48} height={48} priority />
        <Image src="/logo-text.svg" alt="EtuCuisto" width={131} height={24} />
      </header>

      <section>
        <h1 className="text-2xl font-semibold">Qu&apos;est-ce qu&apos;il y a dans ton frigo ?</h1>
        <p className="mt-2 text-foreground/70">
          Une recette en 20 minutes, avec ce que tu as déjà.
        </p>
      </section>

      <ul className="grid grid-cols-3 gap-3">
        {CATEGORIES.map((c) => (
          <li
            key={c.id}
            className="flex flex-col items-center gap-2 rounded-xl border border-foreground/10 p-3 text-center text-sm"
          >
            <Image src={c.icon} alt="" width={40} height={40} />
            {c.label}
          </li>
        ))}
      </ul>
    </main>
  );
}
