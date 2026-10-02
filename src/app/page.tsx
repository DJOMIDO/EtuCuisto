import type { Metadata } from "next";
import { FridgePage } from "@/components/fridge/FridgePage";

export const metadata: Metadata = { title: "Mon frigo" };

export default function Home() {
  return <FridgePage />;
}
