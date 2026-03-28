import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { workoutsTable } from "@workspace/db/schema";
import { eq, like, and } from "drizzle-orm";
import {
  GetWorkoutsResponse,
  CompleteWorkoutResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /workouts
router.get("/", async (req, res) => {
  const { category, difficulty, search } = req.query as Record<string, string>;

  const conditions = [];
  if (category) conditions.push(eq(workoutsTable.category, category));
  if (difficulty) conditions.push(eq(workoutsTable.difficulty, difficulty));
  if (search) conditions.push(like(workoutsTable.title, `%${search}%`));

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
router.post("/:id/complete", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  await db
    .update(workoutsTable)
    .set({ completed: true })
    .where(eq(workoutsTable.id, id));

  // Get profile to compute points
  const { profileTable } = await import("@workspace/db/schema");
  const profiles = await db.select().from(profileTable).limit(1);
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
      pointsEarned,
      totalPoints,
    })
  );
});

export default router;
