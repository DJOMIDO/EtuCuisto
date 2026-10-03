import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Recipe } from "@/lib/ai/schemas";

// `user_id` = id de l'utilisateur Neon Auth (schéma `neon_auth`). Pas de clé
// étrangère : ce schéma appartient à Neon Auth et on ne le migre pas nous-mêmes.

export const pantryItems = pgTable(
  "pantry_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    quantity: text("quantity"),
    category: text("category").notNull().default("autre"),
    expiresSoon: boolean("expires_soon").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pantry_items_user_idx").on(t.userId)],
);

export const kitchenProfiles = pgTable("kitchen_profiles", {
  userId: text("user_id").primaryKey(),
  tools: text("tools").array().notNull().default([]),
  budget: text("budget").notNull().default("serre"),
  diet: text("diet").array().notNull().default([]),
  servings: integer("servings").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    data: jsonb("data").$type<Recipe>().notNull(),
    favorite: boolean("favorite").notNull().default(false),
    cookedAt: timestamp("cooked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("recipes_user_idx").on(t.userId)],
);

// Compteur d'appels IA par jour. `key` = "user:<id>" ou "ip:<hash>".
export const aiUsage = pgTable(
  "ai_usage",
  {
    key: text("key").notNull(),
    day: date("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.day] })],
);

// Préférences liées au compte (le thème, lui, reste propre à chaque appareil).
export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  locale: text("locale").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
