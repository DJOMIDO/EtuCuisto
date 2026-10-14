-- Le champ « diet » éclate en réglages plus fins : allergènes, habitudes alimentaires,
-- ingrédients évités (saisie libre) et cuisines appréciées.
ALTER TABLE "kitchen_profiles" ADD COLUMN "allergies" text[] NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE "kitchen_profiles" ADD COLUMN "habits" text[] NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE "kitchen_profiles" ADD COLUMN "avoided" text[] NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE "kitchen_profiles" ADD COLUMN "cuisines" text[] NOT NULL DEFAULT '{}';
--> statement-breakpoint
-- Reclassement des anciennes restrictions : les régimes partent en « habits »,
-- sans-gluten / sans-lactose deviennent des allergènes.
UPDATE "kitchen_profiles" SET
  "habits" = ARRAY(SELECT CASE d WHEN 'vegan' THEN 'vegetalien' ELSE d END FROM unnest("diet") d WHERE d IN ('vegetarien', 'vegan', 'halal', 'sans-porc')),
  "allergies" = ARRAY(SELECT CASE d WHEN 'sans-gluten' THEN 'gluten' WHEN 'sans-lactose' THEN 'lait' END FROM unnest("diet") d WHERE d IN ('sans-gluten', 'sans-lactose'));
--> statement-breakpoint
ALTER TABLE "kitchen_profiles" DROP COLUMN "diet";
