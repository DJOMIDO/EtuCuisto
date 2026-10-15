-- Quantité scindée en nombre + unité. Le texte libre d'avant (« 100 g », « 1/2 sachet »,
-- « selon l'envie ») est converti en best-effort : on garde le premier nombre rencontré
-- (« 100 g » → 100, « 1/2 » → 1), la virale décimale est normalisée, l'unité texte d'origine
-- est perdue (l'utilisateur la rechoisira). Rien de chiffrable → null.
ALTER TABLE "pantry_items" ADD COLUMN "unit" text;--> statement-breakpoint
ALTER TABLE "pantry_items" ALTER COLUMN "quantity" SET DATA TYPE double precision
  USING (NULLIF(replace(substring("quantity" from '[0-9]+([.,][0-9]+)?'), ',', '.'), '')::double precision);
