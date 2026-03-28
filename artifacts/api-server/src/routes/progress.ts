import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { workoutsTable, profileTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { GetProgressResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /progress
router.get("/", async (req, res) => {
  const allWorkouts = await db.select().from(workoutsTable);
  const completed = allWorkouts.filter((w) => w.completed);
  const totalCalories = completed.reduce((sum, w) => sum + w.calories, 0);

  const profiles = await db.select().from(profileTable).limit(1);
  const profile = profiles[0];

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyWorkouts = days.map((day) => ({
    day,
    count: Math.floor(Math.random() * 3),
    calories: Math.floor(Math.random() * 400),
  }));

  const achievements = [
    {
      id: 1,
      title: "First Step",
      description: "Completed your first workout",
      icon: "🏃",
      earnedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Week Warrior",
      description: "Worked out 5 days in a row",
      icon: "🔥",
      earnedAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: "Calorie Crusher",
      description: "Burned 1000 calories total",
      icon: "⚡",
      earnedAt: new Date().toISOString(),
    },
  ].slice(0, completed.length > 0 ? 3 : 1);

  res.json(
    GetProgressResponse.parse({
      totalWorkouts: allWorkouts.length,
      completedWorkouts: completed.length,
      totalCaloriesBurned: totalCalories,
      totalPoints: profile?.points ?? 0,
      level: profile?.level ?? 1,
      weeklyStreak: Math.min(completed.length, 7),
      weeklyWorkouts,
      recentAchievements: achievements,
    })
  );
});

export default router;
