import type { Metadata } from "next";
import { FridgePage } from "@/components/fridge/FridgePage";

// Le modèle « %s | EtuCuisto » du layout ne s'applique pas à la page racine.
export const metadata: Metadata = { title: { absolute: "Mon frigo | EtuCuisto" } };

export default function Home() {
  return <FridgePage />;
}
