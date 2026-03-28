import { pgTable, text, integer, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workoutsTable = pgTable("workouts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // strength, cardio, yoga, home
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  duration: integer("duration").notNull(), // minutes
  calories: integer("calories").notNull(),
  imageUrl: text("image_url").notNull(),
  steps: text("steps").notNull(), // JSON array stored as text
  completed: boolean("completed").notNull().default(false),
});

export const insertWorkoutSchema = createInsertSchema(workoutsTable).omit({ id: true });
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workoutsTable.$inferSelect;
