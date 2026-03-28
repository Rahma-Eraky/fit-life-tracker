import { pgTable, text, integer, serial, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mealsTable = pgTable("meals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  goal: text("goal").notNull(), // weight-loss, muscle-gain, maintenance
  calories: integer("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  imageUrl: text("image_url").notNull(),
  ingredients: text("ingredients").notNull(), // JSON array
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
});

export const diaryEntriesTable = pgTable("diary_entries", {
  id: serial("id").primaryKey(),
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
