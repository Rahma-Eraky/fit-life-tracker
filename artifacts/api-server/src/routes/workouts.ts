import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { workoutsTable } from "@workspace/db/schema";
import { eq, ilike, and, sql } from "drizzle-orm";
import {
  GetWorkoutsResponse,
  CompleteWorkoutResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// GET /workouts
router.get("/", async (req, res) => {
  const { category, difficulty, search } = req.query as Record<string, string>;

  const conditions = [];
  if (category) conditions.push(eq(workoutsTable.category, category));
  if (difficulty) conditions.push(eq(workoutsTable.difficulty, difficulty));
  // Case-insensitive search so "The" and "the" match the same rows.
  if (search) conditions.push(ilike(workoutsTable.title, `%${search}%`));

  const rows = conditions.length
    ? await db.select().from(workoutsTable).where(and(...conditions))
    : await db.select().from(workoutsTable);

  const workouts = rows.map((w) => ({
    ...w,
    steps: JSON.parse(w.steps) as string[],
  }));

  res.json(GetWorkoutsResponse.parse(workouts));
});

// POST /workouts/:id/complete
// Allows a workout to be completed multiple times. Each POST is an independent
// completion event: we atomically increment `completion_count` by 1 and award
// points. The `completed` boolean is not used to lock the row; it stays false
// so the UI button remains clickable and the frontend can keep marking the
// same workout done as often as the user actually does it.
router.post("/:id/complete", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);

  // Atomically increment and return the new count in one round-trip. Using
  // `sql` here avoids a read-modify-write race if the same user hammers the
  // endpoint twice in parallel. Empty result ⇒ workout id does not exist.
  const updated = await db
    .update(workoutsTable)
    .set({
      completionCount: sql`${workoutsTable.completionCount} + 1`,
    })
    .where(eq(workoutsTable.id, id))
    .returning({ completionCount: workoutsTable.completionCount });

  if (updated.length === 0) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }

  const completionCount = updated[0].completionCount;

  // Award points to the authenticated user's profile. Falls back safely
  // if the user has not yet filled in a profile row.
  const { profileTable } = await import("@workspace/db/schema");
  const profiles = await db
    .select()
    .from(profileTable)
    .where(eq(profileTable.userId, req.user!.id))
    .limit(1);
  const profile = profiles[0];

  const pointsEarned = 50;
  let totalPoints = pointsEarned;

  if (profile) {
    const newPoints = (profile.points || 0) + pointsEarned;
    const newLevel = Math.floor(newPoints / 500) + 1;
    await db
      .update(profileTable)
      .set({ points: newPoints, level: newLevel })
      .where(eq(profileTable.id, profile.id));
    totalPoints = newPoints;
  }

  res.json(
    CompleteWorkoutResponse.parse({
      workoutId: id,
      completed: true,
      completionCount,
      pointsEarned,
      totalPoints,
    })
  );
});

export default router;
