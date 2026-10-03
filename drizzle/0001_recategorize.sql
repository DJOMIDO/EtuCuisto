-- Nouvelles familles d'ingrédients : les œufs passent en « Œufs & produits laitiers »,
-- ail / oignon / échalote / gingembre en « Épices & aromates ».
UPDATE "pantry_items" SET "category" = 'laitier'
WHERE lower("name") ~ '^(œufs?|oeufs?)( |$)';
--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'epice'
WHERE lower("name") ~ '^(ail|oignons?|échalotes?|echalotes?|gingembre)( |$)';
