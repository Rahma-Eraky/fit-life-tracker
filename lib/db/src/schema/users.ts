import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Auth users. Kept intentionally small — only what's needed to verify
 * credentials and attach a stable id to user-scoped rows. The richer
 * "profile" table (stats, goal, points, level) stays separate so profile
 * updates don't touch auth columns. A profile row belongs to a user via
 * its nullable `userId` column; nullability is temporary to keep the
 * existing demo profile valid during migration and is backfilled by the
 * seed.
 */
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
