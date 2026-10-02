import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { aiUsage, getDb } from "@/db";

// Appels IA autorisés par jour (parse + photo + recettes confondus).
const DAILY_LIMIT = { user: 30, guest: 3 };

/** Incrémente le compteur du jour et indique si l'appel est autorisé. */
export async function consumeAiQuota(request: Request, userId: string | null) {
  const key = userId ? `user:${userId}` : `ip:${hashIp(clientIp(request))}`;
  const limit = userId ? DAILY_LIMIT.user : DAILY_LIMIT.guest;

  const [row] = await getDb()
    .insert(aiUsage)
    .values({ key, day: sql`current_date`, count: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.key, aiUsage.day],
      set: { count: sql`${aiUsage.count} + 1` },
    })
    .returning({ count: aiUsage.count });

  return {
    allowed: row.count <= limit,
    isGuest: !userId,
    /** Rend l'appel si l'IA a échoué : une panne ne doit pas coûter de quota. */
    refund: async () => {
      await getDb()
        .update(aiUsage)
        .set({ count: sql`greatest(${aiUsage.count} - 1, 0)` })
        .where(and(eq(aiUsage.key, key), sql`${aiUsage.day} = current_date`));
    },
  };
}

/** Exécute un appel IA en rendant le quota si l'appel échoue. */
export async function withRefund<T>(quota: { refund: () => Promise<void> }, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    await quota.refund().catch(() => {});
    throw error;
  }
}

function clientIp(request: Request) {
  const h = request.headers;
  return (
    h.get("x-nf-client-connection-ip") ?? // Netlify
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

// On ne stocke pas l'IP en clair.
function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${process.env.NEON_AUTH_COOKIE_SECRET ?? ""}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}
