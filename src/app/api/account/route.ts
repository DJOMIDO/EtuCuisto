import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { aiUsage, getDb, kitchenProfiles, pantryItems, recipes, userSettings } from "@/db";
import { jsonError, requireUser } from "@/lib/api";
import { canDeleteAuthUsers, deleteAuthUser } from "@/lib/auth/admin";

// Supprime le compte et toutes les données de l'utilisateur connecté.
export async function DELETE() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  // Sans accès à l'API Neon, on ne touche à rien plutôt que de laisser un compte à moitié supprimé.
  if (!canDeleteAuthUsers()) {
    console.error("Suppression de compte impossible : variables NEON_* manquantes");
    return jsonError("deleteFailed", 500);
  }

  try {
    const db = getDb();
    // 1. Données de l'appli, en une fois. Si l'étape 2 échoue, le compte reste mais vide :
    //    l'utilisateur peut réessayer, et aucune donnée ne reste sans propriétaire.
    await db.batch([
      db.delete(recipes).where(eq(recipes.userId, auth.userId)),
      db.delete(pantryItems).where(eq(pantryItems.userId, auth.userId)),
      db.delete(kitchenProfiles).where(eq(kitchenProfiles.userId, auth.userId)),
      db.delete(userSettings).where(eq(userSettings.userId, auth.userId)),
      db.delete(aiUsage).where(eq(aiUsage.key, `user:${auth.userId}`)),
    ]);
    // 2. Le compte lui-même.
    await deleteAuthUser(auth.userId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Suppression de compte :", error);
    return jsonError("deleteFailed", 500);
  }
}
