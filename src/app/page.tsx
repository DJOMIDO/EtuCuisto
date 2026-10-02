import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { FridgePage } from "@/components/fridge/FridgePage";

export const metadata: Metadata = { title: "Mon frigo" };

export default function Home() {
  return (
    <>
      <AppHeader />
      <FridgePage />
    </>
  );
}
