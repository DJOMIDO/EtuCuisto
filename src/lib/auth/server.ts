import { createNeonAuth } from "@neondatabase/auth/next/server";

type NeonAuth = ReturnType<typeof createNeonAuth>;
let auth: NeonAuth | undefined;

// Paresseux pour que `next build` passe sans les variables Neon Auth.
export function getAuth(): NeonAuth {
  if (!auth) {
    auth = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
    });
  }
  return auth;
}

/** Id de l'utilisateur connecté, ou null pour un invité. */
export async function getUserId(): Promise<string | null> {
  const { data } = await getAuth().getSession();
  return data?.user?.id ?? null;
}
