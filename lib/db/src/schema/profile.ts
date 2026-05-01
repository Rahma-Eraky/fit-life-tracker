import { pgTable, text, integer, serial, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profileTable = pgTable("profile", {
  id: serial("id").primaryKey(),
  // Nullable during migration — the seed backfills the demo profile's
  // userId. Once every environment has been re-seeded we can tighten
  // this to notNull() in a follow-up.
  userId: integer("user_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  age: integer("age").notNull(),
  weight: real("weight").notNull(), // kg
  height: real("height").notNull(), // cm
  goal: text("goal").notNull(), // weight-loss, muscle-gain, maintenance, endurance
  avatarUrl: text("avatar_url"),
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  joinedAt: text("joined_at").notNull(),
});

export const insertProfileSchema = createInsertSchema(profileTable).omit({ id: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profileTable.$inferSelect;
