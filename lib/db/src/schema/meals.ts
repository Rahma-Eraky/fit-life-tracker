import { pgTable, text, integer, serial, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Only `title`, `calories`, and `mealType` are required so users can add
// a quick custom meal (e.g. "Home-made sandwich — 450 kcal — lunch"). The
// richer fields (description, goal, macros, image, ingredients) are kept
// nullable so curated seed recipes can still populate them. Existing seed
// rows continue to satisfy the softened schema unchanged.
export const mealsTable = pgTable("meals", {
  id: serial("id").primaryKey(),
  // Nullable so seeded shared recipes (userId = null) stay visible to all
  // users, while user-created custom meals carry their owner's id. Scoping
  // logic in the meal CRUD routes treats null as "belongs to everyone
  // / read-only for non-owners" and the owning user for edit/delete.
  userId: integer("user_id"),
  title: text("title").notNull(),
  description: text("description"),
  goal: text("goal"), // weight-loss, muscle-gain, maintenance
  calories: integer("calories").notNull(),
  protein: real("protein"),
  carbs: real("carbs"),
  fat: real("fat"),
  imageUrl: text("image_url"),
  ingredients: text("ingredients"), // JSON array
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
});

export const diaryEntriesTable = pgTable("diary_entries", {
  id: serial("id").primaryKey(),
  // Nullable during migration. New entries from authenticated routes
  // always carry userId; any legacy null entries are treated as the
  // demo user's so nothing disappears from the current fixtures.
  userId: integer("user_id"),
  mealId: integer("meal_id").notNull(),
  mealTitle: text("meal_title").notNull(),
  calories: integer("calories").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  mealType: text("meal_type").notNull(),
});

export const insertMealSchema = createInsertSchema(mealsTable).omit({ id: true });
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof mealsTable.$inferSelect;

export const insertDiaryEntrySchema = createInsertSchema(diaryEntriesTable).omit({ id: true });
export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;
export type DiaryEntry = typeof diaryEntriesTable.$inferSelect;
