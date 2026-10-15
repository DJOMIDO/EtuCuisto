-- Familles plus fines : « Féculents & pain » devient « Céréales & féculents » (id cereal),
-- les légumineuses en sortent, et boissons / sucreries ont leur propre famille.
UPDATE "pantry_items" SET "category" = 'cereal' WHERE "category" = 'feculent';
--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'legumineuse'
WHERE lower("name") ~ '^(lentilles?|pois chiches?|pois cassés?|haricots? (rouges?|blancs?|noirs?|mung|de lima)|soja|tofu|tempeh|edamame)( |$)';
--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'boisson'
WHERE lower("name") ~ '^(eau|jus|sodas?|cola|bières?|vin[s]?|café|thés?|limonade|lait végétal|lait d.amande|lait de soja)( |$)';
--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'sucrerie'
WHERE lower("name") ~ '^(sucre|chocolats?|bonbons?|biscuits?|cookies?|barres? (céréalières?|de céréales)|confiture|miel|sirop d.agave|chips|croustilles?|gâteaux?|gaufres?|céréales? (sucrées?|au miel)|granola|muesli)( |$)';
