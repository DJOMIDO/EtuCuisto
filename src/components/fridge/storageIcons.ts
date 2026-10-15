import { Package, Refrigerator, Snowflake, type LucideIcon } from "lucide-react";
import type { StorageId } from "@/lib/storage";

// Mêmes icônes pour les onglets de la page et le menu d'un ingrédient.
export const STORAGE_ICONS: Record<StorageId, LucideIcon> = {
  frigo: Refrigerator,
  congelateur: Snowflake,
  placard: Package,
};
