// Unités de mesure fréquentes en cuisine d'étudiant. Orthogonales aux familles :
// elles qualifient la quantité d'un aliment. Les identifiants restent en français
// (comme les zones de rangement) ; les libellés affichés : messages/*.json → « units ».

export const UNIT_IDS = [
  "piece",
  "tranche",
  "gousse",
  "pincee",
  "cuillere",
  "cuillere-cafe",
  "tasse",
  "gramme",
  "kilogramme",
  "millilitre",
  "litre",
  "boite",
  "bouteille",
  "sachet",
  "paquet",
] as const;

export type UnitId = (typeof UNIT_IDS)[number];

// Ramène n'importe quelle valeur stockée (ancienne quantité en texte libre, donnée
// d'avant cette refonte, champ absent) à une UnitId valide, ou null = « pas d'unité ».
export function normalizeUnit(value: unknown): UnitId | null {
  return UNIT_IDS.includes(value as UnitId) ? (value as UnitId) : null;
}

// Libellés français pour le prompt de l'IA (l'UI traduit via « units »).
export const UNIT_LABELS_FR: Record<UnitId, string> = {
  piece: "pièce",
  tranche: "tranche",
  gousse: "gousse",
  pincee: "pincée",
  cuillere: "cuillère à soupe",
  "cuillere-cafe": "cuillère à café",
  tasse: "tasse",
  gramme: "gramme",
  kilogramme: "kilogramme",
  millilitre: "millilitre",
  litre: "litre",
  boite: "boîte",
  bouteille: "bouteille",
  sachet: "sachet",
  paquet: "paquet",
};
