import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let db: NeonHttpDatabase<typeof schema> | undefined;

// Initialisation paresseuse : `next build` importe les routes sans DATABASE_URL.
export function getDb() {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL manquant");
    db = drizzle(url, { schema });
  }
  return db;
}

export * from "./schema";
