import type { Metadata } from "next";
import { ProfilePage } from "@/components/account/ProfilePage";

export const metadata: Metadata = { title: "Profil" };

export default function Profil() {
  return <ProfilePage />;
}
