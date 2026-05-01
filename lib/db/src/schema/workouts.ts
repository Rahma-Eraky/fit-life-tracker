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
  completionCount: integer("completion_count").notNull().default(0),
  // Optional YouTube URL shown on the workout detail page. Nullable so
  // existing rows don't need a backfill — the detail page just hides the
  // video section when this is null/empty.
  videoUrl: text("video_url"),
});

export const insertWorkoutSchema = createInsertSchema(workoutsTable).omit({ id: true });
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workoutsTable.$inferSelect;
