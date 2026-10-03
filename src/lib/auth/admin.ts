// Suppression d'un utilisateur Neon Auth via l'API de gestion Neon.
// Neon Auth managé ne propose pas l'endpoint Better Auth `delete-user` (404), d'où ce passage
// par l'API, avec une clé limitée au projet.

function config() {
  const { NEON_API_KEY, NEON_PROJECT_ID, NEON_BRANCH_ID } = process.env;
  if (!NEON_API_KEY || !NEON_PROJECT_ID || !NEON_BRANCH_ID) return null;
  return { apiKey: NEON_API_KEY, projectId: NEON_PROJECT_ID, branchId: NEON_BRANCH_ID };
}

export function canDeleteAuthUsers() {
  return config() !== null;
}

/** Supprime l'utilisateur ; un utilisateur déjà absent (404) compte comme supprimé. */
export async function deleteAuthUser(userId: string) {
  const c = config();
  if (!c) throw new Error("NEON_API_KEY / NEON_PROJECT_ID / NEON_BRANCH_ID manquants");
  const url = `https://console.neon.tech/api/v2/projects/${c.projectId}/branches/${c.branchId}/auth/users/${encodeURIComponent(userId)}`;
  const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${c.apiKey}` } });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Neon API ${res.status}: ${await res.text().catch(() => "")}`);
  }
}
