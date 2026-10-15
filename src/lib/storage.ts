import type { CategoryId } from "@/lib/categories";

// Zones de rangement, orthogonales aux familles : un même aliment peut vivre au frais
// ou au placard (thon frais vs thon en boîte). Les libellés affichés :
// messages/*.json → « storageZones ».

export type StorageId = "frigo" | "congelateur" | "placard";

export const STORAGES: { id: StorageId }[] = [
  { id: "frigo" },
  { id: "congelateur" },
  { id: "placard" },
];

// Par défaut d'une famille : le repli quand ni l'IA ni l'utilisateur n'ont tranché.
// « congelateur » n'est jamais un défaut : on n'y met que du surgelé explicitement repéré.
const DEFAULT_STORAGE_BY_CATEGORY: Record<CategoryId, StorageId> = {
  legume: "frigo",
  viande: "frigo",
  poisson: "frigo",
  laitier: "frigo",
  restes: "frigo",
  fruit: "placard",
  cereal: "placard",
  legumineuse: "placard",
  condiment: "placard",
  epice: "placard",
  boisson: "placard",
  sucrerie: "placard",
  autre: "placard",
};

// Ramène n'importe quelle valeur stockée (localStorage invité, colonne texte libre,
// champ absent des anciennes données) à une zone valide, ou null = « pas d'avis ».
export function normalizeStorage(value: unknown): StorageId | null {
  return STORAGES.some((s) => s.id === value) ? (value as StorageId) : null;
}

// Zone réellement effective d'un ingrédient : son rangement explicite, sinon le repli
// de sa famille (garde « placard » pour une famille inconnue, jamais de crash).
export function storageOf(item: { storage?: StorageId | null; category: CategoryId }): StorageId {
  return item.storage ?? DEFAULT_STORAGE_BY_CATEGORY[item.category] ?? "placard";
}
