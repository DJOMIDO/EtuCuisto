"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Modèles chargés depuis le fournisseur ; vide tant que la liste n'a pas été demandée. */
  options: string[];
  placeholder?: string;
  className: string;
  listLabel: string;
};

/**
 * Champ libre + liste de suggestions maison.
 *
 * `<datalist>` était trop inégal selon les navigateurs : sur ordinateur il affiche un
 * menu natif que l'on ne peut pas styliser, et sur iOS Safari il ne montre rien du tout
 * tant que la saisie ne correspond pas à une entrée. Le contrôle est donc dessiné ici :
 * même rendu partout, et la liste apparaît dès le tapotement du champ. Elle se filtre au
 * fil de la saisie, ce qui rend les listes de plusieurs centaines de modèles praticables.
 *
 * Le champ reste libre (un point de terminaison personnalisé peut servir un modèle absent
 * de `/models`). Raccourcis : flèches pour parcourir, Entrée pour retenir, Échap pour refermer.
 */
export function ModelCombobox({ id, value, onChange, options, placeholder, className, listLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sous-ensemble filtré sur la saisie (les listes de modèles comptent jusqu'à plusieurs
  // centaines d'entrées) ; le modèle déjà saisi n'a pas besoin d'être re-proposé.
  const query = value.trim().toLowerCase();
  const items = options.filter((o) => o !== value && (!query || o.toLowerCase().includes(query)));
  const expanded = open && items.length > 0;
  // Index hors plage ou liste refermée : rien de sélectionné.
  const current = expanded && active >= 0 && active < items.length ? active : -1;

  // L'option suivie par les flèches reste dans la fenêtre de défilement.
  useEffect(() => {
    if (current < 0) return;
    listRef.current?.children[current]?.scrollIntoView({ block: "nearest" });
  }, [current]);

  function choose(option: string) {
    // Le champ reste libre : on remplace la saisie par le modèle complet.
    onChange(option);
    setActive(-1);
    setOpen(false);
    inputRef.current?.focus();
  }

  /** Défilement des suggestions ; sans sélection, la première touche atteint le bout opposé. */
  function move(step: number) {
    const from = current < 0 ? -step : current;
    let next = (from + step) % items.length;
    if (next < 0) next += items.length;
    setActive(next);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      if (expanded) {
        e.preventDefault();
        e.stopPropagation(); // ne pas refermer le panneau du profil par-dessus la liste
        setOpen(false);
      }
      return;
    }
    if (!expanded) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && current >= 0) {
      e.preventDefault(); // « Entrée » désigne une suggestion, ce n'est pas une validation
      choose(items[current]);
    }
  }

  return (
    // `onBlur` sur le conteneur : un clic sur une suggestion reste à l'intérieur, donc ne
    // referme pas ; seuls les flous venus d'ailleurs ferment la liste.
    <div className="relative flex-1" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setOpen(false)}>
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={`${id}-list`}
        aria-autocomplete="none"
        aria-activedescendant={current >= 0 ? `${id}-option-${current}` : undefined}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Un champ déjà focalisé ne redéclenche pas `focus` : sans ceci, retaper dans le
        // champ après une sélection ne rouvre jamais la liste.
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {expanded && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-label={listLabel}
          // `preventDefault` sur mousedown évite le flou du champ : sans ça, l'élément
          // disparaît avant la sélection (le flou referme la liste). Sur iOS, un tap ne
          // déclenche pas mousedown → onClick prend le relais.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-field/60 bg-surface p-1 shadow-card"
        >
          {items.map((option, index) => (
            <li
              key={option}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === current}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(option)}
              className={`cursor-pointer truncate rounded-xl px-3 py-2 font-mono text-sm ${
                index === current ? "bg-accent-soft text-accent-strong" : "hover:bg-surface-muted"
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
