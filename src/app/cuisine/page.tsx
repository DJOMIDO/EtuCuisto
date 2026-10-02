import type { Metadata } from "next";
import { KitchenPage } from "@/components/kitchen/KitchenPage";

export const metadata: Metadata = { title: "Ma cuisine" };

export default function Cuisine() {
  return <KitchenPage />;
}
